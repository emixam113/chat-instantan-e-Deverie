
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Login from './components/Login';
import Chat from './components/Chat';
import { AuthGuard } from './components/Guards/AuthGuard';
import Unauthorized from './pages/unauthorized'

function App() {
  return (
    <div>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />}/>
        <Route
          path="/chat"
          element={
            <AuthGuard>
              <Chat />
            </AuthGuard>
          }
        />
        <Route path="/signup" element={<Login/>}/>
        <Route path="*" element={<Navigate to="/login" />}/>
        <Route path="/" element={<Navigate to="/home"/>}/>
        <Route path="/unauthorized" element={<Unauthorized/>}/>
      </Routes>
    </div>
  );
}

export default App;
