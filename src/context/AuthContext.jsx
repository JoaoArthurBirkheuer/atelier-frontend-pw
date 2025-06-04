// src/context/AuthContext.jsx

import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isTokenExpired = (token) => {
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 < Date.now();
    } catch (e) {
      console.error('Erro ao verificar token:', e);
      return true;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        
        if (storedUser && storedToken && !isTokenExpired(storedToken)) {
          const parsedUser = JSON.parse(storedUser);
          
          // Validação mais flexível para is_admin:
          // Se parsedUser.is_admin for undefined, assume false.
          // Isso é importante para compatibilidade com dados antigos no localStorage
          // ou se o backend, por algum motivo, não enviar a flag.
          const userWithAdminStatus = {
            ...parsedUser,
            is_admin: parsedUser.is_admin === true // Garante que é um booleano
          };

          if (!userWithAdminStatus?.id || !userWithAdminStatus?.tipo) { 
            throw new Error('Dados de usuário inválidos ou incompletos no armazenamento local.');
          }

          setUser(userWithAdminStatus);
          setToken(storedToken);
        } else {
          // Limpeza segura
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Erro na inicialização:', err);
        setError(err.message);
        localStorage.clear(); // Limpa tudo se houver erro na inicialização
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, newToken) => {
    try {
      // Validação mais flexível para is_admin:
      // Se userData.is_admin for undefined ou null, assume false.
      // Isso impede o erro "Dados de autenticação incompletos"
      // quando o backend envia is_admin: false ou não envia a propriedade para não-admins.
      const isAdminStatus = userData.is_admin === true; // Garante que é um booleano

      if (!userData?.id || !userData?.tipo || newToken === undefined) { 
        throw new Error('Dados de autenticação incompletos recebidos do servidor.');
      }

      const userToStore = {
        id: userData.id,
        tipo: userData.tipo,
        nome: userData.nome || '',
        email: userData.email || '',
        is_admin: isAdminStatus // Usa o status booleano garantido
      };

      localStorage.setItem('user', JSON.stringify(userToStore));
      localStorage.setItem('token', newToken);
      setUser(userToStore);
      setToken(newToken);
      setError(null);
      
      return true;
    } catch (err) {
      console.error('Erro no login:', err);
      setError(err.message);
      throw err;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      setUser(null);
      setToken(null);
      setError(null);
    } catch (err) {
      console.error('Erro no logout:', err);
      setError(err.message);
    }
  };

  const isAuthenticated = () => {
    return !!user && !!token && !isTokenExpired(token);
  };

  const atualizarUsuario = (novosDados) => {
    if (!user) return;
    
    // Garante que is_admin seja booleano ao atualizar também
    const updatedUser = { 
      ...user, 
      ...novosDados,
      is_admin: novosDados.is_admin === true // Garante booleano ao atualizar
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const register = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3002/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.erro || 'Falha no registro');
      }

      if (data.token && data.id && data.tipo) {
        const userToStore = {
          id: data.id,
          tipo: data.tipo,
          nome: formData.nome || '', 
          email: formData.email || '',
          is_admin: data.is_admin === true // Garante que é um booleano
        };
        localStorage.setItem('user', JSON.stringify(userToStore));
        localStorage.setItem('token', data.token);
        setUser(userToStore);
        setToken(data.token);
      }
      return data; 
    } catch (err) {
      console.error('Erro no registro:', err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };


  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        loading, 
        error,
        login, 
        logout,
        isAuthenticated,
        atualizarUsuario,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
