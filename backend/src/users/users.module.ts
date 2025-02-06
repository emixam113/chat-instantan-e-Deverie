import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersService } from './users.service';

@Module({
    imports: [TypeOrmModule.forFeature([User])], // Import (pour configurer UserRepository dans ce module)
    providers: [UsersService],
    exports: [UsersService, TypeOrmModule.forFeature([User])], //  <--- EXPORT INDISPENSABLE (pour que d'autres modules puissent utiliser UserRepository)
})
export class UsersModule {}