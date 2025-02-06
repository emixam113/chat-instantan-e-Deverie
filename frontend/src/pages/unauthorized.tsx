import { useNavigate } from 'react-router-dom';

const Forbidden403: React.FC = () => {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 font-poppins text-center">
      <h1 className="text-6xl font-bold text-red-500">403</h1>
      <p className="text-xl text-gray-700 font-poppins mt-2">Accès refusé</p>
      <p className="text-md text-gray-600 font-poppins mt-2">Vous devez être connecté pour accéder au chat.</p>
      <div className="mt-6">
        <button 
          onClick={() => navigate('/login')} 
          className="bg-blue-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-blue-700 mr-2">
          Se connecter
        </button>
        <button 
          onClick={() => navigate('/login')} 
          className="bg-green-500 text-white px-6 py-2 rounded-md shadow-md hover:bg-green-700">
          S'inscrire
        </button>
      </div>
    </div>
  );
};

export default Forbidden403;
