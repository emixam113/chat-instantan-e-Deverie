import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SignUpDto } from '../auth/DTO/Signup.dto';
import * as request from 'supertest';
import { ValidationPipe } from '@nestjs/common'; // Importez ValidationPipe

describe('AuthController (e2e)', () => { // Test d'intégration (e2e) car on teste le contrôleur et ses dépendances
  let app;
  let authService: AuthService; // Instance du service pour les vérifications

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { // Mock du service (important !)
          provide: AuthService,
          useValue: {
            SignUp: jest.fn().mockResolvedValue({ /* Valeur de retour simulée */ }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe()); // Activez ValidationPipe globalement
    await app.init();

    authService = moduleFixture.get<AuthService>(AuthService); // Récupérez l'instance du service
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

    expect(response.body).toEqual({ /* Valeur de retour attendue */ }); // Vérifiez le contenu de la réponse

    // Vérifiez que la méthode SignUp du service a été appelée avec les bonnes données
    expect(authService.SignUp).toHaveBeenCalledWith(
      signupDto.sender,
      signupDto.password,
      signupDto.email,
    );
  });

  it('should return an error if email is invalid', async () => {
    const signupDto: SignUpDto = {
      sender: 'testuser',
      email: 'invalid-email', // Email invalide
      password: 'testpassword',
    };

    const response = await request(app.getHttpServer())
      .post('/auth/signup')
      .send(signupDto)
      .expect(400)

    expect(response.body.message).toContain('email must be a valid email'); 
  });
})