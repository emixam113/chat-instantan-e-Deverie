import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <header className="mb-2"> {/* Ajout d'un en-tête */}
        <img
          className="h-20 mt-10 m-12 rounded-md"
          src="/logo-homepage.png"
          alt="Logo Deverie" 
        />
      </header>

      <main className="bg-white p-8 rounded shadow-md text-center max-w-sm "> 
        <h1 className="text-3xl font-bold mb-4 font-poppins">
          Chattez avec des Passionnés et Devenez membre de la communauté
        </h1>
        <p className="text-gray-700 mb-6 font-poppins">
          Connectez-vous instantanément avec des personnes qui partagent votre
          centre d'intérêt ou votre passion.
        </p>
        <Link to="/login">
          <button className="bg-deverie-blue hover:bg-bleu-scarabee text-white font-bold py-2 px-4 rounded mx-auto font-poppins">
            Connexion
          </button>
        </Link>
      </main>
    </div>
  );
}

export default Home;