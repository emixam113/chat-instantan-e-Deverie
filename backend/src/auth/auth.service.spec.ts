import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException } from '@nestjs/common';

// Moquer bcrypt avec la signature appropriée
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true) as jest.MockedFunction<typeof bcrypt.compare>,
}));

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  beforeEach(() => {
    usersService = {
      findOneByEmail: jest.fn(),
      save: jest.fn(),
    } as any;

    jwtService = {
      sign: jest.fn(),
    } as any;

    authService = new AuthService(jwtService, usersService);
  });

  describe('SignUp', () => {
    it('should successfully sign up a user', async () => {
      const userDto = { sender: 'testuser', email: 'test@example.com', password: 'password' };
      const hashedPassword = 'hashedpassword';
      
      // Mock pour simuler qu'aucun utilisateur n'existe déjà
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      // Mock pour simuler l'enregistrement de l'utilisateur
      (usersService.save as jest.Mock).mockResolvedValue({ ...userDto, hashed_password: hashedPassword });

      const result = await authService.SignUp(userDto.sender, userDto.password, userDto.email);

      expect(result).toEqual({ sender: 'testuser', email: 'test@example.com', hashed_password: hashedPassword });
      expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({
        sender: 'testuser',
        email: 'test@example.com',
        hashed_password: hashedPassword,
      }));
    });

    it('should throw an error if the email already exists', async () => {
      const userDto = { sender: 'testuser', email: 'test@example.com', password: 'password' };
      
      // Mock pour simuler qu'un utilisateur existe déjà
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue({ email: 'test@example.com' });

      await expect(authService.SignUp(userDto.sender, userDto.password, userDto.email))
        .rejects
        .toThrowError('Email already exists');
    });
  });

  describe('Login', () => {
    it('should successfully log in a user and return a token', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const user = { id: 1, email, hashed_password: 'hashedpassword' };
      const payload = { id: 1 };
      const token = 'jwt.token';

      // Mock pour comparer le mot de passe (valide)
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);  // Le mot de passe est correct

      // Mock pour simuler la récupération de l'utilisateur
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      // Mock pour simuler la génération du token
      (jwtService.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.login(email, password);

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const email = 'test@example.com';
      const password = 'incorrectpassword';
      const user = { id: 1, email, hashed_password: 'hashedpassword' };

      // Mock pour simuler la récupération de l'utilisateur
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);

      // Mock pour simuler une comparaison du mot de passe incorrect
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);  // Le mot de passe est incorrect

      await expect(authService.login(email, password))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the user does not exist', async () => {
      const email = 'test@example.com';
      const password = 'password';

      // Mock pour simuler l'absence d'utilisateur
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(email, password))
        .rejects
        .toThrow(UnauthorizedException);
    });
  });
});
