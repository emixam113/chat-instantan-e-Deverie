import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedException, BadRequestException } from '@nestjs/common'; // Importez BadRequestException
import { CreateUserDTO } from '../users/DTO/create-user.dto';
import { User } from '../users/user.entity';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashedpassword'),
  compare: jest.fn().mockResolvedValue(true),
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
      const userDto: CreateUserDTO = { sender: 'testuser', email: 'test@example.com', hashed_password: 'password' };
      const hashedPassword = 'hashedpassword';
      const createdUser: User = { id: 1, ...userDto, hashed_password: hashedPassword } as User; // Cast to User

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
      (usersService.save as jest.Mock).mockResolvedValue(createdUser); // Mock with the User object

      const result = await authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email);

      expect(result).toEqual(createdUser); // Check if the returned object is a User
      expect(usersService.save).toHaveBeenCalledWith(expect.objectContaining({
        sender: userDto.sender,
        email: userDto.email,
        hashed_password: hashedPassword,
      }));
    });

    it('should throw an error if the email already exists', async () => {
      const userDto: CreateUserDTO = { sender: 'testuser', email: 'test@example.com', hashed_password: 'password' };

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue({ email: userDto.email });

      await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
        .rejects
        .toThrowError('Email already exists');
    });

    it('should throw an error if sender is empty', async () => {
      const userDto: CreateUserDTO = { sender: '', email: 'test@example.com', hashed_password: 'password' };

      await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
        .rejects
        .toThrowError('Sender is required'); // Or your specific error message
    });

    it('should throw an error if email is empty', async () => {
        const userDto: CreateUserDTO = { sender: 'testuser', email: '', hashed_password: 'password' };

        await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
            .rejects
            .toThrowError('Email is required'); // Or your specific error message
    });

    it('should throw an error if email format is invalid', async () => {
        const userDto: CreateUserDTO = { sender: 'testuser', email: 'invalid-email', hashed_password: 'password' };

        await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
            .rejects
            .toThrowError(BadRequestException); // Or your specific error message/exception
    });


    it('should throw an error if password is empty', async () => {
        const userDto: CreateUserDTO = { sender: 'testuser', email: 'test@example.com', hashed_password: '' };

        await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
            .rejects
            .toThrowError('Password is required'); // Or your specific error message
    });

      it('should handle database errors during signup', async () => {
          const userDto: CreateUserDTO = { sender: 'testuser', email: 'test@example.com', hashed_password: 'password' };

          (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);
          (usersService.save as jest.Mock).mockRejectedValue(new Error('Database error')); // Simulate DB error

          await expect(authService.SignUp(userDto.sender, userDto.hashed_password, userDto.email))
              .rejects
              .toThrowError('Database error'); // Expect the specific DB error
      });
  });

  describe('Login', () => {
    it('should successfully log in a user and return a token', async () => {
      const user: User = { id: 1, email: 'test@example.com', hashed_password: 'hashedpassword' } as User;
      const payload = { id: 1 };
      const token = 'jwt.token';

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (jwtService.sign as jest.Mock).mockReturnValue(token);

      const result = await authService.login(user.email, 'password');

      expect(result).toEqual({ access_token: token });
      expect(jwtService.sign).toHaveBeenCalledWith(payload);
    });

    it('should throw an UnauthorizedException if the password is incorrect', async () => {
      const user: User = { id: 1, email: 'test@example.com', hashed_password: 'hashedpassword' } as User;

      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(user);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(user.email, 'incorrectpassword'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw an UnauthorizedException if the user does not exist', async () => {
      (usersService.findOneByEmail as jest.Mock).mockResolvedValue(null);

      await expect(authService.login('test@example.com', 'password'))
        .rejects
        .toThrow(UnauthorizedException);
    });

    it('should throw a BadRequestException if the email format is invalid', async () => {
        await expect(authService.login('invalid-email', 'password'))
            .rejects
            .toThrowError(BadRequestException); // Or your specific error message/exception
    });


        it('should handle database errors during login', async () => {
            (usersService.findOneByEmail as jest.Mock).mockRejectedValue(new Error('Database error'));

            await expect(authService.login('test@example.com', 'password'))
                .rejects
                .toThrowError('Database error');
        });
  });
});