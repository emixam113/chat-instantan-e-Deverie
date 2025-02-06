import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './DTO/create-user.dto';
import { User } from '../users/user.entity'

@Injectable()
export class UsersService{
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>
    ){}

    findOneByEmail(email: string): Promise<User | undefined>{
        return this.usersRepository.findOneBy({email});
    };

    async save(user: CreateUserDTO): Promise<User>{
        const newUser = this.usersRepository.create(user)
        console.log(newUser)
        return this.usersRepository.save(newUser)
    }
}