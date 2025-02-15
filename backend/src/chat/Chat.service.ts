import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entity/message.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepository: Repository<Message>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    // Récupérer les messages en base de donnée
    async getAllMessage(): Promise<Message[]> {
        return await this.messageRepository.find({
            order: {
                createdAt: 'ASC',
            },
            relations:[
                'sender',
            ]
        });
    }


    //ajouter un message à la base de donnée :
    
    async addMessage(messageData: { senderId: number; content: string }): Promise<Message> {
        console.log("Message Data received:", messageData);

        if (!messageData ||!messageData.senderId ||!messageData.content || messageData.content.trim() === "") {
            throw new Error("Invalid message data. senderId and content are requiread.");
        }

        const user = await this.userRepository.findOneBy({ id: messageData.senderId });

        if (!user) {
            throw new Error('User not found');
        }

        
        return await this.messageRepository.save(
            this.messageRepository.create({
                sender: user,
                content: messageData.content,
            }),
        );
    }
}