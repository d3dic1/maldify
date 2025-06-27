import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../services/firebase';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    // If there's no user, redirect to the login page
    return <Navigate to="/login" replace />;
  }

  // If there is a user, render the children components
  return children;
};

export default ProtectedRoute; 