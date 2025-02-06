import { Module } from '@nestjs/common';
import { WebSocketService } from './WebSocket.service';

@Module({
  providers: [WebSocketService],
  exports: [WebSocketService], // Si tu veux utiliser le service ailleurs dans ton application
})
export class WebSocketModule {}