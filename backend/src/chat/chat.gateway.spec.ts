import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './ChatGateway';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { WebSocket } from 'ws'; // Import WebSocket

// Mock necessary services and dependencies
const mockChatService = {
  addMessage: jest.fn(),
  getAllMessage: jest.fn(),
};

const mockJwtService = {
  verify: jest.fn(),
};

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let client: WebSocket; // Declare client here

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);

    // Mock WebSocket connection
    client = {
      send: jest.fn(),
      on: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN, // Simulate an open connection
    } as unknown as WebSocket; // Type assertion to bypass TypeScript checks
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should not initialize WebSocket server in test environment', () => {
        // Spy on the WebSocket.Server constructor
        const createWebSocketServerSpy = jest.spyOn(WebSocket.Server, 'EventEmitter');
        gateway.onModuleInit();
        expect(createWebSocketServerSpy).not.toHaveBeenCalled();
    })
  })

  describe('handleConnection', () => {
    it('should authenticate user with valid token', () => {
      const mockPayload = { id: 1 };
      mockJwtService.verify.mockReturnValue(mockPayload);

      gateway.handleConnection(client, { url: 'ws://localhost:3001/?token=validToken' } as any);

      expect(mockJwtService.verify).toHaveBeenCalledWith('validToken', { secret: process.env.JWT_SECRET_KEY });
      expect((client as any).user).toEqual({ id: 1 });
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_success' }));
    });

    it('should reject connection with missing token', () => {
      gateway.handleConnection(client, { url: 'ws://localhost:3001' } as any);

      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_error', message: 'Token manquant.' }));
      expect(client.close).toHaveBeenCalled();
    });

    it('should reject connection with invalid token', () => {
      mockJwtService.verify.mockRejectedValue(new Error('Invalid token'));

      gateway.handleConnection(client, { url: 'ws://localhost:3001/?token=invalidToken' } as any);

      expect(mockJwtService.verify).toHaveBeenCalledWith('invalidToken', { secret: process.env.JWT_SECRET_KEY });
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'auth_error', message: 'Token invalide.' }));
      expect(client.close).toHaveBeenCalled();
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnection', () => {
      gateway.handleDisconnect(client);
      expect(gateway['clients'].has(client)).toBe(false); // Check if client is removed
    });
  });

  describe('sendMessage', () => {
    it('should broadcast message to all clients', async () => {
        const mockMessageData = {
            senderId: 1,
            content: 'Hello!'
        }
        mockChatService.addMessage.mockResolvedValue(mockMessageData)

        const message = { content: 'Hello!' };
        const mockClient2 = { send: jest.fn(), readyState: WebSocket.OPEN} as unknown as WebSocket;
        gateway['clients'].add(client);
        gateway['clients'].add(mockClient2);

        await gateway.sendMessage(client, message);

        expect(mockChatService.addMessage).toHaveBeenCalledWith(mockMessageData)
        expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'message', data: mockMessageData }));
        expect(mockClient2.send).toHaveBeenCalledWith(JSON.stringify({ type: 'message', data: mockMessageData }));
    });

    it('should not broadcast message if client is not authenticated', async () => {
        const message = { content: 'Hello!' };
        (client as any).user = undefined

        await gateway.sendMessage(client, message);

        expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'error', message: 'Vous devez être authentifié pour envoyer un message.' }));
        expect(mockChatService.addMessage).not.toHaveBeenCalled()
    })
  });

  describe('sendHistory', () => {
    it('should send chat history to client', async () => {
      const mockHistory = [{ content: 'Message 1' }, { content: 'Message 2' }];
      mockChatService.getAllMessage.mockResolvedValue(mockHistory);

      await gateway.sendHistory(client);

      expect(mockChatService.getAllMessage).toHaveBeenCalled();
      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'history', data: mockHistory }));
    });

    it('should handle error when fetching history', async () => {
      mockChatService.getAllMessage.mockRejectedValue(new Error('Failed to fetch history'));

      await gateway.sendHistory(client);

      expect(client.send).toHaveBeenCalledWith(JSON.stringify({ type: 'error', message: 'Erreur lors du chargement de l\'historique des messages.' }));
    });
  });

  describe('broadcast', () => {
    it('should send message to all connected clients', () => {
      const message = 'Test message';
      const mockClient2 = { send: jest.fn(), readyState: WebSocket.OPEN} as unknown as WebSocket;

      gateway['clients'].add(client);
      gateway['clients'].add(mockClient2);

      gateway.broadcast(message, client);

      expect(client.send).toHaveBeenCalledWith(message);
      expect(mockClient2.send).toHaveBeenCalledWith(message);
    });

    it('should not send message to clients with closed connection', () => {
        const message = 'Test message';
        const mockClient2 = { send: jest.fn(), readyState: WebSocket.CLOSED} as unknown as WebSocket;

        gateway['clients'].add(client);
        gateway['clients'].add(mockClient2);

        gateway.broadcast(message, client);

        expect(client.send).toHaveBeenCalledWith(message);
        expect(mockClient2.send).not.toHaveBeenCalled();
    })
  });
});