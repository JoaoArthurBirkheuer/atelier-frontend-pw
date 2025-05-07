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
          
          // Verificação robusta dos dados
          if (!parsedUser?.id || !parsedUser?.tipo) {
            throw new Error('Dados de usuário inválidos');
          }

          setUser(parsedUser);
          setToken(storedToken);
        } else {
          // Limpeza segura
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      } catch (err) {
        console.error('Erro na inicialização:', err);
        setError(err.message);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (userData, newToken) => {
    try {
      // Validação completa
      if (!userData?.id || !userData?.tipo || !newToken) {
        throw new Error('Dados de autenticação incompletos');
      }

      const userToStore = {
        id: userData.id,
        tipo: userData.tipo,
        nome: userData.nome || '',
        email: userData.email || ''
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
    
    const updatedUser = { ...user, ...novosDados };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}