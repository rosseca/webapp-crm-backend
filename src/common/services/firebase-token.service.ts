import { Firestore } from '@google-cloud/firestore';
import { HttpService } from '@nestjs/axios';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { FIRESTORE } from '../firestore/firestore.module';

interface FirebaseSignInResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
  registered: boolean;
}

interface StoredToken {
  token: string;
  refreshToken: string;
  expiresAt: number;
  createdAt: Date;
  updatedAt: Date;
}

export const FIREBASE_TOKEN_SERVICE = 'FIREBASE_TOKEN_SERVICE';
const TOKEN_COLLECTION = 'api_tokens';
const TOKEN_DOC_ID = 'chatai_service_token';

@Injectable()
export class FirebaseTokenService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseTokenService.name);
  private readonly identityToolkitUrl =
    'https://identitytoolkit.googleapis.com/v1';
  private readonly secureTokenUrl = 'https://securetoken.googleapis.com/v1';

  private readonly firebaseApiKey: string;
  private readonly firebaseAuthEmail: string;
  private readonly firebaseAuthPassword: string;

  // In-memory cache for performance
  private cachedToken: string | null = null;
  private cachedRefreshToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @Inject(FIRESTORE) private readonly firestore: Firestore,
  ) {
    this.firebaseApiKey = this.configService.get<string>(
      'FIREBASE_WEB_API_KEY',
      '',
    );
    this.firebaseAuthEmail = this.configService.get<string>(
      'FIREBASE_AUTH_EMAIL',
      '',
    );
    this.firebaseAuthPassword = this.configService.get<string>(
      'FIREBASE_AUTH_PASSWORD',
      '',
    );
  }

  async onModuleInit(): Promise<void> {
    if (!this.firebaseAuthEmail || !this.firebaseAuthPassword) {
      this.logger.warn(
        'Firebase auth credentials not configured. Set FIREBASE_AUTH_EMAIL and FIREBASE_AUTH_PASSWORD in environment.',
      );
      return;
    }

    try {
      // Try to load existing token from Firestore
      const loaded = await this.loadTokenFromFirestore();
      if (loaded) {
        this.logger.log('Loaded existing token from Firestore');
        return;
      }

      // No valid token, authenticate
      await this.authenticate();
      this.logger.log('Firebase authentication successful on startup');
    } catch (error) {
      this.logger.error(
        `Firebase token initialization failed: ${error.message}`,
      );
    }
  }

  async getToken(): Promise<string> {
    if (!this.firebaseAuthEmail || !this.firebaseAuthPassword) {
      throw new Error(
        'Firebase auth credentials not configured. Set FIREBASE_AUTH_EMAIL and FIREBASE_AUTH_PASSWORD.',
      );
    }

    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes buffer before expiry

    // Check in-memory cache first
    if (this.cachedToken && this.tokenExpiresAt > now + bufferMs) {
      this.logger.debug('Using in-memory cached token');
      return this.cachedToken;
    }

    // Try to load from Firestore
    const loaded = await this.loadTokenFromFirestore();
    if (loaded && this.tokenExpiresAt > now + bufferMs) {
      this.logger.debug('Using token from Firestore');
      return this.cachedToken!;
    }

    this.logger.log('Token expired or not found, need to refresh/authenticate');

    // Try refresh if we have a refresh token
    if (this.cachedRefreshToken) {
      try {
        this.logger.log('Attempting to refresh token...');
        await this.refreshAccessToken();
        return this.cachedToken!;
      } catch (error) {
        this.logger.warn(
          `Token refresh failed, re-authenticating: ${error.message}`,
        );
      }
    }

    // Full re-authentication
    this.logger.log('Performing full re-authentication...');
    await this.authenticate();
    return this.cachedToken!;
  }

  /**
   * Force re-authentication - called when we get 401 from the API
   */
  async forceReauthenticate(): Promise<string> {
    this.logger.log('Forcing re-authentication due to 401 error');
    this.cachedToken = null;
    this.cachedRefreshToken = null;
    this.tokenExpiresAt = 0;

    await this.authenticate();
    return this.cachedToken!;
  }

  private async loadTokenFromFirestore(): Promise<boolean> {
    try {
      const docRef = this.firestore
        .collection(TOKEN_COLLECTION)
        .doc(TOKEN_DOC_ID);
      const doc = await docRef.get();

      if (!doc.exists) {
        this.logger.debug('No token found in Firestore');
        return false;
      }

      const data = doc.data() as StoredToken;
      this.logger.debug(`Firestore data fields: ${Object.keys(data).join(', ')}`);

      // Check if we have the new plain text format
      if (!data.token) {
        this.logger.debug('Token field not found (old encrypted format?), will re-authenticate');
        return false;
      }

      const now = Date.now();

      // Check if token is expired
      if (data.expiresAt <= now) {
        this.logger.debug('Stored token is expired');
        // Still load the refresh token to try refreshing
        this.cachedRefreshToken = data.refreshToken;
        return false;
      }

      // Load tokens
      this.cachedToken = data.token;
      this.cachedRefreshToken = data.refreshToken;
      this.tokenExpiresAt = data.expiresAt;

      this.logger.debug('Token loaded from Firestore successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to load token from Firestore: ${error.message}`);
      return false;
    }
  }

  private async saveTokenToFirestore(): Promise<void> {
    try {
      const tokenData: StoredToken = {
        token: this.cachedToken!,
        refreshToken: this.cachedRefreshToken!,
        expiresAt: this.tokenExpiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await this.firestore
        .collection(TOKEN_COLLECTION)
        .doc(TOKEN_DOC_ID)
        .set(tokenData, { merge: true });

      this.logger.debug('Token saved to Firestore successfully');
    } catch (error) {
      this.logger.error(`Failed to save token to Firestore: ${error.message}`);
    }
  }

  private async authenticate(): Promise<void> {
    this.logger.log(
      `Authenticating to Firebase with email: ${this.firebaseAuthEmail}`,
    );

    const signInUrl = `${this.identityToolkitUrl}/accounts:signInWithPassword?key=${this.firebaseApiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<FirebaseSignInResponse>(signInUrl, {
          email: this.firebaseAuthEmail,
          password: this.firebaseAuthPassword,
          returnSecureToken: true,
        }),
      );

      const { idToken, refreshToken, expiresIn } = response.data;

      this.cachedToken = idToken;
      this.cachedRefreshToken = refreshToken;
      this.tokenExpiresAt = Date.now() + parseInt(expiresIn, 10) * 1000;

      // Save to Firestore
      await this.saveTokenToFirestore();

      this.logger.log('Firebase authentication successful');
    } catch (error: any) {
      this.logger.error(`Firebase authentication failed: ${error.message}`);

      if (error.response?.data?.error) {
        const firebaseError = error.response.data.error;
        this.logger.error(`Firebase error: ${JSON.stringify(firebaseError)}`);
        throw new Error(`Firebase auth failed: ${firebaseError.message}`);
      }

      throw new Error(`Firebase authentication failed: ${error.message}`);
    }
  }

  private async refreshAccessToken(): Promise<void> {
    this.logger.debug('Refreshing Firebase token');

    const tokenUrl = `${this.secureTokenUrl}/token?key=${this.firebaseApiKey}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          tokenUrl,
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: this.cachedRefreshToken!,
          }).toString(),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      this.cachedToken = response.data.id_token;
      this.cachedRefreshToken = response.data.refresh_token;
      this.tokenExpiresAt =
        Date.now() + parseInt(response.data.expires_in, 10) * 1000;

      // Save refreshed token to Firestore
      await this.saveTokenToFirestore();

      this.logger.debug('Firebase token refreshed successfully');
    } catch (error: any) {
      this.logger.error(`Token refresh failed: ${error.message}`);
      this.cachedToken = null;
      this.cachedRefreshToken = null;
      this.tokenExpiresAt = 0;
      throw error;
    }
  }

  isConfigured(): boolean {
    return !!this.firebaseAuthEmail && !!this.firebaseAuthPassword;
  }
}
