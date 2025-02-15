import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from './DTO/Signup.dto';
import * as request from 'supertest';
import { ValidationPipe } from '@nestjs/common';

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
            SignUp: jest.fn().mockResolvedValue({ message: 'User successfully registered' }),
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
    await app.close(); // Ferme l'application après les tests
  });

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

    // Vérifie si le message d'erreur est bien présent dans le tableau d'erreurs retourné
    expect(response.body.message).toEqual(expect.arrayContaining(["L'email n'est pas valide."]));
  });
});
