// src/guards/AuthGuard.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const navigate = useNavigate();
  const token = sessionStorage.getItem('token');

  if (!token) {
    // Si le token n'est pas présent, redirige vers la page unauthorize
    navigate('/unauthorized');
  
  }

  // Si le token est présent, affiche les enfants (le composant protégé)
  return <>{children}</>;
};
