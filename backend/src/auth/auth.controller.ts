import { Controller, Body, Post,UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { CreateUserDTO } from 'src/users/DTO/create-user.dto';
import {SignUpDto} from '../auth/DTO/Signup.dto';
import {LoginDTO} from '../auth/DTO/Login.dto'



@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService){}
  @Post('login')
  async login(@Body() loginDto: LoginDTO) {
    const { 
      email, 
      password 
    } = loginDto; 
  
    return await this.authService.login(email, password);
  }

@Post('signup')
async SignUp(@Body() signupDto:SignUpDto) {
const {
      sender, 
      email,
      password,
    }= signupDto
    console.log(signupDto)
    return await this.authService.SignUp(sender,password, email)
   
  }
  
}
