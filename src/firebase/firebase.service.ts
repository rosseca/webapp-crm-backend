import { Injectable, OnModuleInit } from '@nestjs/common';
import { initializeApp, App } from 'firebase-admin/app';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app: App;

  onModuleInit() {
    this.app = initializeApp();
  }

  getApp(): App {
    return this.app;
  }
}
