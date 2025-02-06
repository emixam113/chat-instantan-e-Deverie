import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatGateway } from './ChatGateway'; // Import du ChatGateway
import { ChatService } from './chat.service'; // Import du ChatService
import { Message } from './entity/message.entity';
import { AuthModule } from '../auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';


@Module({
  imports: [TypeOrmModule.forFeature([Message])
    , AuthModule,
    UsersModule
  ],
  providers: [ChatGateway, ChatService, JwtService],
  exports: [ChatService],
})
export class ChatModule { }
