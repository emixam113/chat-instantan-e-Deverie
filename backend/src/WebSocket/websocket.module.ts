import { Module } from '@nestjs/common';
import { WebSocketService } from './WebSocket.service';

@Module({
  providers: [WebSocketService],
  exports: [WebSocketService], 
})
export class WebSocketModule {}