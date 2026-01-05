import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AUTH_REPOSITORY } from './repositories/auth.repository.interface';

describe('AuthController', () => {
  let controller: AuthController;

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
      controllers: [AuthController],
      providers: [
        AuthService,
        {
          provide: AUTH_REPOSITORY,
          useValue: mockAuthRepository,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
