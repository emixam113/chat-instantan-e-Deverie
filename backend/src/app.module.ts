import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from './chat/chat.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';


@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'postgres',
      password: process.env.DB_PASSWORD || 'athao03200',
      database: process.env.DB_DATABASE || 'messages_db',
      autoLoadEntities: true,
      synchronize: false, // on n'active pas en production 
    }),
    ChatModule,
    AuthModule,
    UsersModule
  ],
})
export class AppModule {}
