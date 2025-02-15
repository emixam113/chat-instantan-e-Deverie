import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './DTO/send-message.dto';
import { JwtService } from '@nestjs/jwt';
import * as WebSocket from 'ws';

@Injectable()
export class ChatGateway implements OnModuleInit, OnModuleDestroy {
  [x: string]: any;
  private clients = new Set<WebSocket>();
  private wss: WebSocket.Server;

  constructor(
    private readonly chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    if (process.env.NODE_ENV === 'test') return; // Désactiver WebSocket en test
    this.wss = new WebSocket.Server({ port: 3001 });

    this.wss.on('connection', (ws: WebSocket, req: any) => {
      this.handleConnection(ws, req);
    });

    console.log('Serveur WebSocket en écoute sur ws://localhost:3001');
  }

  onModuleDestroy() {
    if (this.wss) {
      this.wss.close();
    }
  }

  /**
   * Gère la connexion d'un utilisateur via WebSocket.
   */
  handleConnection(client: WebSocket, req: any) {
    console.log('Nouvelle connexion WebSocket');

    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      console.log('Token manquant. Connexion refusée.');
      client.send(JSON.stringify({ type: 'auth_error', message: 'Token manquant.' }));
      client.close();
      return;
    }

    try {
      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET_KEY });
      (client as any).user = { id: payload.id };

      client.send(JSON.stringify({ type: 'auth_success' }));
      this.clients.add(client);
      console.log('Client authentifié :', (client as any).user.id);

      this.sendHistory(client);

      client.on('message', async (data) => {
        await this.handleMessage(client, data);
      });

      client.on('close', () => this.handleDisconnect(client));
      client.on('error', (err) => this.handleError(client, err));

    } catch (error) {
      console.log('Authentification échouée:', error);
      client.send(JSON.stringify({ type: 'auth_error', message: 'Token invalide.' }));
      client.close();
    }
  }

  /**
   * Gère la déconnexion d'un utilisateur.
   */
  handleDisconnect(client: WebSocket) {
    console.log('Client déconnecté :', (client as any).user?.id);
    this.clients.delete(client);
  }

  /**
   * Gère l'envoi d'un message par un utilisateur.
   */
  async handleMessage(client: WebSocket, data: any) {
    try {
      const messageString = data.toString();
      const message = JSON.parse(messageString);

      if (!(client as any)?.user) {
        console.log('Client non authentifié - message rejeté');
        client.send(JSON.stringify({ type: 'error', message: 'Vous devez être authentifié pour envoyer un message.' }));
        return;  // On stoppe l'exécution ici sans fermer la connexion
      }
    
      const dto = new SendMessageDto();
      dto.content = message.content;
      dto.sender = (client as any).user.id;

      const messageData = {
        senderId: Number((client as any).user.id),
        content: message.content,
      };
      
      const savedMessage = await this.chatService.addMessage(messageData);

      this.broadcast(JSON.stringify({ type: 'message', data: savedMessage }), client);
    } catch (error) {
      console.error('Erreur lors de la réception du message:', error);
      client.send(JSON.stringify({ type: 'error', message: 'Erreur lors de l\'envoi du message.' }));
    }
  }

  /**
   * Gère les erreurs WebSocket.
   */
  handleError(client: WebSocket, err: Error) {
    console.error('Erreur WebSocket:', err);
    this.clients.delete(client);
  }

  /**
   * Envoie l'historique des messages au client connecté.
   */
  async sendHistory(client: WebSocket) {
    try {
      const history = await this.chatService.getAllMessage();
      client.send(JSON.stringify({ type: 'history', data: history }));
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'historique:', error);
      client.send(JSON.stringify({ type: 'error', message: 'Erreur lors du chargement de l\'historique des messages.' }));
    }
  }

  /**
   * Diffuse un message à tous les clients connectés.
   */
  broadcast(message: string, sender: WebSocket) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
