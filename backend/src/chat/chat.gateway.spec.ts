import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import * as WebSocket from 'ws';

// Mock des services
const mockChatService = {
  addMessage: jest.fn(),
  getAllMessage: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
};

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let client: WebSocket;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: ChatService, useValue: mockChatService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);

    client = {
      send: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
    } as unknown as WebSocket;
  });

  afterEach(() => {
    jest.clearAllMocks(); // Réinitialiser les mocks après chaque test
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should authenticate user with valid token', () => {
      const mockPayload = { id: 1 };
      mockJwtService.verify.mockReturnValue(mockPayload);

      gateway.handleConnection(client, { url: '/?token=validToken', headers: { host: 'localhost:3001' } } as any);

      expect(mockJwtService.verify).toHaveBeenCalledWith('validToken', { secret: process.env.JWT_SECRET_KEY });
      expect((client as any).user).toEqual({ id: 1 });
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_success' }));
    });

    it('should reject connection with missing token', () => {
      gateway.handleConnection(client, { url: '/', headers: { host: 'localhost:3001' } } as any);

      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_error', message: 'Token manquant.' }));
      expect(client.close).toHaveBeenCalled();
    });

    it('should reject connection with invalid token', () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      gateway.handleConnection(client, { url: '/?token=invalidToken', headers: { host: 'localhost:3001' } } as any);

      expect(mockJwtService.verify).toHaveBeenCalledWith('invalidToken', { secret: process.env.JWT_SECRET_KEY });
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_error', message: 'Token invalide.' }));
      expect(client.close).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnection', () => {
      gateway['clients'].add(client);
      gateway.handleDisconnect(client);
      expect(gateway['clients'].has(client)).toBe(false);
    });
  });

  describe('handleMessage', () => {
    it('should broadcast message to all clients', async () => {
      const mockMessageData = { senderId: 1, content: 'Hello!' };
      mockChatService.addMessage.mockResolvedValue(mockMessageData);
    
      const message = { content: 'Hello!' };
      (client as any).user = { id: 1 }; // Assurez-vous que le client est authentifié
    
      const mockClient2 = { send: jest.fn(), readyState: WebSocket.OPEN } as unknown as WebSocket;
      gateway['clients'].add(client);
      gateway['clients'].add(mockClient2);
    
      await gateway.handleMessage(client, JSON.stringify(message));
    
      expect(mockChatService.addMessage).toHaveBeenCalledWith({ senderId: 1, content: 'Hello!' });
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'message', data: mockMessageData }));
      expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'message', data: mockMessageData }));
    });
    
    it('should not send message if client is not authenticated', async () => {
      const message = { content: 'Hello!' };
      delete (client as any).user; // ✅ Supprime explicitement l'utilisateur

      await gateway.handleMessage(client, JSON.stringify(message));

      expect(client.send).toHaveBeenCalledWith(
          JSON.stringify({ type: 'error', message: 'Vous devez être authentifié pour envoyer un message.' })
      );
      expect(mockChatService.addMessage).toHaveBeenCalledTimes(0); // Plus fiable que .not.toHaveBeenCalled()
    });
  });

  describe('sendHistory', () => {
    it('should send chat history to client', async () => {
      const mockHistory = [{ content: 'Message 1' }, { content: 'Message 2' }];
      mockChatService.getAllMessage.mockResolvedValue(mockHistory);

      await gateway.sendHistory(client);

      expect(mockChatService.getAllMessage).toHaveBeenCalled();
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'history', data: mockHistory }));
    });
  });
});
