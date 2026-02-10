import React, { createContext, useState, useEffect } from 'react';
import { registerWithServer, loginWithServer, getCurrentUserProfile } from '../services/api';

export const ServerAuthContext = createContext();

export const ServerAuthProvider = ({ children }) => {
  const [serverToken, setServerToken] = useState(localStorage.getItem('serverToken'));
  const [serverUser, setServerUser] = useState(null);
  const [serverLoading, setServerLoading] = useState(true);
  const [serverError, setServerError] = useState(null);

  // Check if token exists and is valid on mount
  useEffect(() => {
    const checkToken = async () => {
      const token = localStorage.getItem('serverToken');
      if (token) {
        try {
          const user = await getCurrentUserProfile();
          setServerUser(user);
          setServerToken(token);
        } catch (error) {
          console.error('Token validation failed:', error);
          localStorage.removeItem('serverToken');
          setServerToken(null);
        }
      }
      setServerLoading(false);
    };
    checkToken();
  }, []);

  const serverRegister = async (name, email, password) => {
    try {
      setServerLoading(true);
      setServerError(null);
      const data = await registerWithServer(name, email, password);
      localStorage.setItem('serverToken', data.token);
      setServerToken(data.token);
      setServerUser(data.user);
      return data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Registration failed';
      setServerError(errorMsg);
      throw error;
    } finally {
      setServerLoading(false);
    }
  };

  const serverLogin = async (email, password) => {
    try {
      setServerLoading(true);
      setServerError(null);
      const data = await loginWithServer(email, password);
      localStorage.setItem('serverToken', data.token);
      setServerToken(data.token);
      setServerUser(data.user);
      return data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Login failed';
      setServerError(errorMsg);
      throw error;
    } finally {
      setServerLoading(false);
    }
  };

  const serverLogout = () => {
    localStorage.removeItem('serverToken');
    setServerToken(null);
    setServerUser(null);
    setServerError(null);
  };

  return (
    <ServerAuthContext.Provider value={{
      serverToken,
      serverUser,
      serverLoading,
      serverError,
      serverRegister,
      serverLogin,
      serverLogout,
    }}>
      {children}
    </ServerAuthContext.Provider>
  );
};
