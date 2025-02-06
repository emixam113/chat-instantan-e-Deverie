import { IsNotEmpty, IsEmail, MinLength } from "class-validator";

export class SignUpDto{
    @IsNotEmpty({message: 'Le nom d\'utilisateur est requis.'})
    sender: string;

    @IsNotEmpty({message: 'L\'email est requis.'})
    @IsEmail({}, { message: 'L\'email n\'est pas valide.'})
    email: string


    @IsNotEmpty({message: 'Le mot de passe doit être requis'})
    @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caractères.'})
    password: string;
}
