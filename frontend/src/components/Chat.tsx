import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import ReconnectingWebSocket from 'reconnecting-websocket';

interface Sender {
  sender?: string;
  email?: string;
}

interface Message {
  id: string;
  sender: string | Sender;
  content: string;
}

const Chat: React.FC = () =>{
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<ReconnectingWebSocket | null>(null);

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    console.log('Token récupéré :', token);

    if (token) {
      ws.current = new ReconnectingWebSocket(`ws://localhost:3001?token=${token}`);

      ws.current.onopen = () => {
        console.log('WebSocket connecté');
        setIsConnected(true);
        setError(null);
      };

      // Recevoir les messages en temps réel
      ws.current.onmessage = (event) => {
        console.log('Message reçu du serveur :', event.data);
        try {
          const data = JSON.parse(event.data);
          console.log('Message parsé :', data);

          if (data.type === 'history' && Array.isArray(data.data)) {
            // Mettre à jour l'historique des messages lors de la connexion
            setMessages(data.data);
          } else if (data.type === 'message' && typeof data.data === 'object') {
            // Ajouter les nouveaux messages reçus
            setMessages((prevMessages) => [...prevMessages, data.data]);
          } else if (data.type === 'error' && data.message) {
            setError(data.message);
          }
        } catch (err) {
          console.error("Erreur lors de l'analyse des données WebSocket :", err);
          setError("Erreur lors de l'analyse de la réponse du serveur.");
        }
      };

      ws.current.onerror = () => {
        console.error('Erreur WebSocket');
        setError('Une erreur est survenue avec la connexion WebSocket.');
      };

      ws.current.onclose = () => {
        console.log('Connexion WebSocket fermée');
        setIsConnected(false);
        setError('Connexion WebSocket fermée.');
      };

      return () => {
        if (ws.current) {
          ws.current.close();
        }
      };
    } else {
      console.error('Pas de token. Redirection vers la page de login.');
      setError('Vous devez être connecté pour utiliser le chat.');
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = () => {
    if (!message.trim()) {
      setError('Le message ne peut pas être vide.');
      return;
    }

    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      setError('Connexion au serveur perdue. Veuillez réessayer.');
      return;
    }

    const messageData = {
      content: DOMPurify.sanitize(message),
    };

    // Envoi du message au serveur
    ws.current.send(JSON.stringify(messageData));
    setMessage('');
    setError(null);
  }

    return (
      <div className="chat-container max-w-3xl mx-auto p-6 bg-gray-100 rounded-lg shadow-md overflow-hidden opacity-98"> 
        <div className="chat-header mb-4 flex items-center justify-between font-Poppins"> 
          <h1 className="text-3xl font-bold text-gray-800 font-poppins">Chat en direct</h1>
          <div className="chat-status">
            {isConnected ? (
              <span className="text-green-600 font-semibold inline-flex items-center"> {/* Style inline-flex pour l'icône */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 6.586 7.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
                Connecté
              </span>
            ) : (
              <span className="text-red-600 font-semibold inline-flex items-center font-poppins">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Déconnecté
              </span>
            )}
          </div>
        </div>
    
    
        <div className="chat-messages border border-gray-200 rounded-lg p-4 h-96 overflow-y-auto mb-4 bg-white shadow-inner">
          {messages.map((msg) => (
            <div key={msg.id} className={`message mb-3 p-3 rounded-lg ${typeof msg.sender === 'object' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}> 
              <div className="font-semibold">
                {typeof msg.sender === 'object'
                  ? msg.sender.sender || msg.sender.email || 'Inconnu'
                  : msg.sender}
                :
              </div>
              <div className="mt-1">{msg.content}</div> 
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
    
        <div className="chat-input-section flex items-center"> 
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="w-full p-3 border border-gray-300 rounded-lg mr-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" 
            rows={3} 
          />
          <button
            onClick={sendMessage}
            className="bg-blue-700 text-white rounded-lg px-5 py-3 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 font-medium" 
          >
            Envoyer
          </button>
        </div>
        {error && <div className="chat-error text-red-500 mt-2 font-poppins">{error}</div>}
      </div>
    )
  }
export default Chat
