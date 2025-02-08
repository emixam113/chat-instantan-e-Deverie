import { useNavigate } from 'react-router-dom';

const Forbidden403: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <p className="text-xl text-gray-700 mt-2">Accès refusé</p>
      <p className="text-md text-gray-600 mt-2">Vous devez être connecté pour accéder au chat.</p>
      <div className="mt-6 flex space-x-4">
        <button 
          onClick={() => navigate('/login')} 
          className="bg-blue-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700 transition duration-300"
        >
          Se connecter
        </button>
        <button 
          onClick={() => navigate('/signup')} 
          className="bg-green-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-green-700 transition duration-300"
        >
          S'inscrire
        </button>
      </div>
    </div>
  );
};

export default Forbidden403;
