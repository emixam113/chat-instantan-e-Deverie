import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import * as WebSocket from 'ws';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let chatService: ChatService;
  let jwtService: JwtService;

  const mockChatService = {
    addMessage: jest.fn(),
    getAllMessage: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: mockChatService },
        JwtService,
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    chatService = module.get<ChatService>(ChatService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('WebSocket communication', () => {
    it('should authenticate a user and allow message sending', async () => {
      // Mock a valid JWT token
      const mockToken = 'valid-token';
      const mockPayload = { id: 1 }; // Simulate a valid payload returned by jwtService
      
      // Espionner la méthode verify et lui fournir une implémentation
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload); // Spying and mock implementation

      // Mock WebSocket connection
      const ws = {
        send: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;

      // Simuler une requête avec un token valide
      const mockReq = { headers: { host: 'localhost' }, url: `?token=${mockToken}` };
      const connectionHandler = jest.fn();
      const server = new WebSocket.Server({ port: 3001 });
      server.on('connection', connectionHandler);

      // Simuler la connexion d'un client
      gateway.onModuleInit(); // On initialise le serveur WebSocket
      const connectionCallback = connectionHandler.mock.calls[0][1]; // Callback de connexion
      connectionCallback(ws, mockReq); // Simuler la connexion du client

      // Vérifier que le token est vérifié et que le client est authentifié
      expect(jwtService.verify).toHaveBeenCalledWith(mockToken, {
        secret: process.env.JWT_SECRET_KEY,
      });

      // Simuler l'envoi d'un message
      const message = { content: 'Hello, world!' };
      const sendMessageDto = {
        content: message.content,
        sender: mockPayload.id,
      };
      mockChatService.addMessage.mockResolvedValue(sendMessageDto);

      // Tester la réception et l'envoi du message
      ws.emit('message', JSON.stringify(message));

      // Vérifier que le message a été envoyé
      expect(mockChatService.addMessage).toHaveBeenCalledWith({
        senderId: mockPayload.id,
        content: message.content,
      });
      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'message',
          data: sendMessageDto,
        }),
      );
    });

    it('should reject connection with invalid token', async () => {
      const ws = {
        send: jest.fn(),
        close: jest.fn(),
      } as unknown as WebSocket;

      const mockReq = { headers: { host: 'localhost' }, url: `?token=invalid-token` };

      // Espionner la méthode verify et simuler une erreur
      jest.spyOn(jwtService, 'verify').mockImplementation(() => { throw new Error('Invalid token'); });

      gateway.onModuleInit();
      const connectionHandler = jest.fn();
      const server = new WebSocket.Server({ port: 3001 });
      server.on('connection', connectionHandler);

      const connectionCallback = connectionHandler.mock.calls[0][1];
      connectionCallback(ws, mockReq);

      expect(ws.send).toHaveBeenCalledWith(
        JSON.stringify({ type: 'auth_error', message: 'Token invalide.' }),
      );
      expect(ws.close).toHaveBeenCalled();
    });
  });
});
