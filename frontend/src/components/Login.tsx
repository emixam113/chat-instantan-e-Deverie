  import React, { useState } from 'react';
  import {useNavigate} from 'react-router-dom';

  const Login: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'signup' | 'login'>('login');
    const [sender, setSender] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [signupEmail,setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    
    const navigate = useNavigate();
    
    const handleTabClick = (tab: 'signup' | 'login') => {
      setActiveTab(tab);
      setError(null); 
    };

    const handleSubmit = async (event: React.FormEvent) => {
      event.preventDefault();
      setError(null);

      try {
        console.log(`Envoi de la requête à /auth/${activeTab}`)
        const response = await fetch(`http://localhost:3000/auth/${activeTab}`,{
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 

            sender: activeTab === 'signup' ? sender : undefined,
            email: activeTab === 'signup' ?  signupEmail: email, 
            password: activeTab === 'signup' ? signupPassword: password,
            
          }),
        });

        if (response.ok) {
          const data = await response.json();
          sessionStorage.setItem('token', data.access_token); 
          if (activeTab === 'login'){
            navigate('/chat')
          } else{
            setActiveTab('login')
          }
          
        } else {
          const errorData = await response.json();
          setError(errorData.message || 'Une erreur est survenue.');
        }
      } catch (error) {
        setError('Erreur de connexion au serveur.');
      }
    };

    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-200">
        <div className="bg-gray-200 p-8 rounded shadow-md w-96 border-black">
          <div className="flex border-b border-gray-200 ">
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'signup' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabClick('signup')}
            >
              Signup
            </button>
            <button
              className={`px-4 py-2 font-medium ${activeTab === 'login' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
              onClick={() => handleTabClick('login')}
            >
              Login
            </button>
          </div>

          <div className="mt-4">
            {activeTab === 'signup' && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input 
                    type="text" 
                    id="signup-name" 
                    placeholder="Name"
                    className="border border-gray-400 p-2 w-full rounded" 
                    value={sender}
                    onChange={(e) => setSender(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input 
                    type="email" 
                    id="signup-email" 
                    placeholder="Email"
                    className="border border-gray-400 p-2 w-full rounded" 
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input 
                    type="password" 
                    id="signup-password" 
                    placeholder="Password"
                    className="border border-gray-400 p-2 w-full rounded" 
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 w-full">
                  Sign up
                </button>
              </form>
            )}

            {activeTab === 'login' && (
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <input 
                    type="email" 
                    id="login-email" 
                    placeholder="Email"
                    className="border border-gray-400 p-2 w-full rounded" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="mb-4">
                  <input 
                    type="password" 
                    id="login-password" 
                    placeholder="Password"
                    className="border border-gray-400 p-2 w-full rounded" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700 w-full">
                  Login
                </button>
              </form>
            )}
          </div>
          {error && <div className="text-red-500 mt-2">{error}</div>} 
        </div>
      </div>
    );
  };

  export default Login