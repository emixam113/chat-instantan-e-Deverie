import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './DTO/Signup.dto';
import { LoginDTO } from './DTO/Login.dto';
import * as request from 'supertest';
import { ValidationPipe, UnauthorizedException } from '@nestjs/common';

describe('AuthController (e2e)', () => {
  let app;
  let authService: AuthService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            // Méthode signup renvoie un message de succès
            SignUp: jest.fn().mockResolvedValue({ message: 'User successfully registered' }),
            // login renvoie un token fictif
            login: jest.fn().mockResolvedValue({ access_token: 'fake-jwt-token' }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should sign up a user', async () => {
      const signupDto: SignUpDto = {
        sender: 'testuser',
        email: 'test@example.com',
        password: 'testpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(201);

      expect(response.body).toEqual({ message: 'User successfully registered' });
      expect(authService.SignUp).toHaveBeenCalledWith(
        signupDto.sender,
        signupDto.password,
        signupDto.email,
      );
    });

    it('should return an error if email is invalid', async () => {
      const signupDto: SignUpDto = {
        sender: 'testuser',
        email: 'invalid-email',
        password: 'testpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(signupDto)
        .expect(400);

      // On vérifie que le message d'erreur inclut "L'email n'est pas valide."
      expect(response.body.message).toEqual(
        expect.arrayContaining(["L'email n'est pas valide."]),
      );
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user and return a token', async () => {
      const loginDto: LoginDTO = {
        email: 'test@example.com',
        password: 'testpassword',
      };

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        // Par défaut, POST renvoie 201 Created si @HttpCode n'est pas défini
        .expect(201);

      expect(response.body).toEqual({ access_token: 'fake-jwt-token' });
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });

    it('should return an error if credentials are invalid', async () => {
      const loginDto: LoginDTO = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      // On simule une erreur Unauthorized en castant la méthode en jest.Mock
      (authService.login as jest.Mock).mockRejectedValueOnce(
        new UnauthorizedException('Invalid credentials'),
      );

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('Invalid credentials');
      expect(authService.login).toHaveBeenCalledWith(loginDto.email, loginDto.password);
    });
  });
});
