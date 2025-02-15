import { Injectable, OnModuleInit } from '@nestjs/common';
import * as WebSocket from 'ws';
import { SendMessageDto } from '../chat/DTO/send-message.dto';
import { validateOrReject } from 'class-validator';

@Injectable()
export class WebSocketService implements OnModuleInit {
  private wss: WebSocket.Server;
  private clients: Set<WebSocket> = new Set();

  onModuleInit() {
    // Crée un serveur WebSocket qui écoute sur le port 3001
    this.wss = new WebSocket.Server({ port: 3001 });
    console.log('Serveur WebSocket démarré sur le port 3001');

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Un client est connecté');
      this.clients.add(ws);

      // Gérer les messages venant des clients
      ws.on('message', async (message: string) => {
        try {
          console.log('Message reçu :', message);

          // Valider et désérialiser le message
          const parsedMessage = JSON.parse(message);
          const dto = Object.assign(new SendMessageDto(), parsedMessage);

          // Valider le message avec class-validator
          await validateOrReject(dto);

          // Diffuser le message à tous les autres clients
          this.broadcast(JSON.stringify({
            type: 'message',
            sender: dto.sender,
            content: dto.content
          }), ws);

        } catch (error) {
          console.error('Erreur de validation ou de traitement du message :', error);

          // Répondre avec une erreur si validation échoue
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Le message est invalide.'
          }));
        }
      });

      // Gérer la déconnexion d’un client
      ws.on('close', () => {
        console.log('Un client s’est déconnecté');
        this.clients.delete(ws);
      });

      // Gérer les erreurs WebSocket
      ws.on('error', (err) => {
        console.error('Erreur WebSocket :', err);
      });
    });
  }

  // Diffuser un message à tous les clients
  private broadcast(message: string, sender: WebSocket) {
    for (const client of this.clients) {
      if (client !== sender && client.readyState === WebSocket.OPEN) {
        try {
          // Envoi du message à tous les clients connectés
          client.send(message);
        } catch (err) {
          console.error('Erreur lors de l\'envoi du message :', err);
        }
      }
    }
  }
}
