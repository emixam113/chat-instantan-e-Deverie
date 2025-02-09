import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const Login: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Détection de l'onglet en fonction de l'URL
  const initialTab = location.pathname === '/signup' ? 'signup' : 'login';
  const [activeTab, setActiveTab] = useState<'signup' | 'login'>(initialTab);
  const [sender, setSender] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mise à jour de l'onglet si l'utilisateur change d'URL manuellement
  useEffect(() => {
    setActiveTab(location.pathname === '/signup' ? 'signup' : 'login');
  }, [location.pathname]);

  // Changer d'onglet + Mettre à jour l'URL
  const handleTabClick = (tab: 'signup' | 'login') => {
    setActiveTab(tab);
    setError(null);
    navigate(tab === 'signup' ? '/signup' : '/login'); // Change l'URL
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log(`Envoi de la requête à /auth/${activeTab}`);
      const response = await fetch(`http://localhost:3000/auth/${activeTab}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: activeTab === 'signup' ? sender : undefined,
          email: activeTab === 'signup' ? signupEmail : email,
          password: activeTab === 'signup' ? signupPassword : password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        sessionStorage.setItem('token', data.access_token);
        if (activeTab === 'login') {
          navigate('/chat');
        } else {
          handleTabClick('login'); // Redirige vers login après inscription
        }
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Une erreur est survenue.');
      }
    } catch (error) {
      setError('Erreur de connexion au serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96 border border-gray-300">
        {/* Tabs Login / Signup */}
        <div className="flex border-b border-gray-200 font-poppins">
          <button
            className={`px-4 py-2 font-medium transition duration-300 ${activeTab === 'signup' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabClick('signup')}
          >
            Signup
          </button>
          <button
            className={`px-4 py-2 font-medium transition duration-300 font-Poppins ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
            onClick={() => handleTabClick('login')}
          >
            Login
          </button>
        </div>

        {/* Formulaire */}
        <div className="mt-4">
          <form onSubmit={handleSubmit}>
            {activeTab === 'signup' && (
              <>
                <div className="mb-4">
                  <input
                    type="text"
                    id="signup-name"
                    placeholder="Name"
                    className="border border-gray-400 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-poppins"
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="email"
                    id="signup-email"
                    placeholder="Email"
                    className="border border-gray-400 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-Poppins"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    id="signup-password"
                    placeholder="Password"
                    className="border border-gray-400 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-Poppins"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {activeTab === 'login' && (
              <>
                <div className="mb-4">
                  <input
                    type="email"
                    id="login-email"
                    placeholder="Email"
                    className="border border-gray-400 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-Poppins"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input
                    type="password"
                    id="login-password"
                    placeholder="Password"
                    className="border border-gray-400 p-2 w-full rounded focus:outline-none focus:ring-2 focus:ring-blue-400 font-Poppins"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Bouton de soumission */}
            <button
              type="submit"
              className="bg-blue-500 text-white py-2 px-4 rounded w-full hover:bg-blue-700 transition duration-300"
              disabled={loading}
            >
              {loading ? 'Chargement...' : activeTab === 'signup' ? 'Signup' : 'Login'}
            </button>
          </form>
        </div>

        {/* Affichage des erreurs */}
        {error && <div className="text-red-500 mt-2 font-Poppins">{error}</div>}
      </div>
    </div>
  );
};

export default Login;
