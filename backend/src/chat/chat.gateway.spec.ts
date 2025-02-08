import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import { Server, WebSocket } from 'ws';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  private clients = new Set<WebSocket>();

  constructor(private jwtService: JwtService, private chatService: ChatService) {}

  handleConnection(client: WebSocket, ...args: any[]) {
    try {
      const token = this.extractToken(client);
      const decoded = this.jwtService.verify(token);
      this.clients.add(client);
      client.send(JSON.stringify({ type: 'auth_success', message: 'Authentifié avec succès' }));
    } catch (error) {
      client.send(JSON.stringify({ type: 'auth_error', message: 'Token invalide.' }));
      client.close();
    }
  }

  private extractToken(client: WebSocket): string {
    // Implémentation pour extraire le token de l'URL ou des headers
    return '';
  }

  broadcast(message: string) {
    this.clients.forEach(client => {
      try {
        client.send(message);
      } catch (error) {
        console.error('Erreur lors de l\envoi du message:', error);
      }
    });
  }

  async sendMessageHistory(client: WebSocket) {
    try {
      const messages = await this.chatService.getAllMessage();
      client.send(JSON.stringify({ type: 'history', data: messages }));
    } catch (error) {
      console.error('Erreur lors de l\envoi de l\historique:', error);
    }
  }
}
