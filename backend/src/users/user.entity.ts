import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToMany, ManyToOne } from 'typeorm';
import { Message } from '../chat/entity/message.entity';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    sender: string;

    @Column({ unique: true })
    email: string;

    @Column({})
    hashed_password: string;

    @OneToMany(() => Message, (message) => message.sender)
    messages: Message[];

}