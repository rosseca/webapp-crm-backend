import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from './repositories/auth.repository.interface';

describe('AuthService', () => {
  let service: AuthService;

  const mockAuthRepository = {
    register: jest.fn(),
    login: jest.fn(),
    verifyToken: jest.fn(),
    refreshToken: jest.fn(),
    revokeToken: jest.fn(),
    getUserById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
