import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatService } from './chat.service';
import { SendMessageDto } from './DTO/send-message.dto';
import { validateOrReject } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import * as WebSocket from 'ws';
import { parse } from 'url';
import { User } from 'src/users/user.entity';

@Injectable()
export class ChatGateway implements OnModuleInit {
  [x: string]: any;

  private clients = new Set<WebSocket>();
  
  constructor(
    private readonly chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    if(process.env.NODE_ENV ==="test") return;
    const wss = new WebSocket.Server({ port: 3001 });

    wss.on('connection', (ws: WebSocket, req: any) => {
      console.log('Nouvelle connexion WebSocket'); 

      // 1. Récupérer le token JWT depuis les headers de la requête
      
      const url = new URL(req.url, `http://${req.headers.host}`);
      const token = url.searchParams.get('token'); // Récupérer le token
    
      if (!token) {
        console.log('Token manquant. Connexion refusée.');
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Token manquant.' }));
        ws.close();
        return;
      }

      try {
        // 2. Vérifier la validité du token
        const payload = this.jwtService.verify(token, {
          secret: process.env.JWT_SECRET_KEY, 
        });

        // Stocker l'ID de l'utilisateur dans le socket
        (ws as any).user = { id: payload.id };  

        // Envoyer un message au client pour indiquer que l'authentification a réussi
        ws.send(JSON.stringify({ type: 'auth_success' }));

        this.clients.add(ws);
        console.log('Client authentifié :', (ws as any).user.id);
        this.sendHistory(ws); 

      } catch (error) {
        console.log('Authentification échouée:', error);
        
        // Envoyer un message au client pour indiquer que l'authentification a échoué
        ws.send(JSON.stringify({ type: 'auth_error', message: 'Token invalide.' })); 

        ws.close(); 
        return;
      }

      ws.on('message', async (data: any) => {
        try {
          const messageString = data.toString();
          const message = JSON.parse(messageString);
          console.log(messageString);

          // Vérifier si l'utilisateur est authentifié
          if (!(ws as any).user) {
            console.log('Message reçu d\'un utilisateur non authentifié. Connexion fermée.');
            ws.send(JSON.stringify({ type: 'error', message: 'Vous devez être authentifié pour envoyer un message.' }));
            ws.close();
            return;
          }
          
          const dto = new SendMessageDto();
          dto.content = message.content; 
          dto.sender = (ws as any).user.id 
          
         const messageData = {
          senderId: Number((ws as any).user.id),
          content: message.content,
         }
         const savedMessage = await this.chatService.addMessage(messageData)

          this.broadcast(JSON.stringify({ type: 'message', data: savedMessage }), ws);
        } catch (error) {
          console.error('Erreur lors de la réception du message:', error);
          ws.send(
            JSON.stringify({
              type: 'error',
              message: 'Erreur lors de l\'envoi du message.',
            }),
          );
        }
      });

      ws.on('close', () => {
        console.log('Client déconnecté :', (ws as any).user?.id);
        this.clients.delete(ws);
      });

      ws.on('error', (err) => {
        console.error('Erreur WebSocket:', err);
        this.clients.delete(ws);
      });
    });

    console.log('Serveur WebSocket en écoute sur ws://localhost:3001');
  }

  public async sendHistory(ws: any) {
    try {
      const history = await this.chatService.getAllMessage();
      ws.send(JSON.stringify({ type: 'history', data: history }));
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'historique:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Erreur lors du chargement de l\'historique des messages.' }));
    }
  }

  public broadcast(message: string, sender: WebSocket) {
    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
  
}