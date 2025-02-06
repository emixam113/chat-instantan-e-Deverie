import {IsNotEmpty, IsEmail, IsString} from 'class-validator';

export class LoginDTO{
  @IsNotEmpty({message:"l'email est requis"})
  @IsEmail({}, {message:"l'email n'est pas valide"})
  email: string;

  @IsNotEmpty({message:"le mot de passe est requis"})
  @IsString()
  password: string;
}
