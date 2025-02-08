// src/guards/AuthGuard.tsx
import React from 'react';
import {Navigate} from 'react-router-dom';
interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const token = sessionStorage.getItem('token');

  if (!token) {
    // si le token n'existe pas alors on redirige vers la page 403
    return <Navigate to ="/unauthorized" replace/>  
  }

  // Si le token est présent, affiche les enfants (le composant protégé)
  return <>{children}</>;
};
