import { IsNotEmpty, IsString, IsInt, IsNumber } from 'class-validator';

export class SendMessageDto {
    @IsNotEmpty()
    @IsNumber()
    sender: number;

    @IsString()
    @IsNotEmpty()
    content: string;
}