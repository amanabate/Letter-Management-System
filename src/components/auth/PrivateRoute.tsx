import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface PrivateRouteProps {
  children: React.ReactNode;
  adminRequired?: boolean;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({
  children,
  adminRequired = false,
}) => {
  const navigate = useNavigate();
  const isAuthenticated = !!localStorage.getItem('user');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (adminRequired && !isAdmin) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isAdmin, adminRequired, navigate]);

  if (!isAuthenticated || (adminRequired && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}; 