import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Função para verificar se o token está expirado (opcional)
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
        const userData = localStorage.getItem('user');
        const userToken = localStorage.getItem('token');
        
        // Verifica se existem dados e se o token é válido
        if (userData && userToken && !isTokenExpired(userToken)) {
          setUser(JSON.parse(userData));
          setToken(userToken);
          
          // Verificação adicional para garantir que os dados são válidos
          if (!JSON.parse(userData)?.id || !JSON.parse(userData)?.tipo) {
            throw new Error('Dados de usuário inválidos no localStorage');
          }
        } else {
          // Limpa dados inválidos/vencidos
          if (userData || userToken) {
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar autenticação:', err);
        setError(err.message);
        localStorage.clear();
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = (userData, newToken) => {
    try {
      // Validação básica dos dados
      if (!userData?.id || !userData?.tipo || !newToken) {
        throw new Error('Dados de login inválidos');
      }

      const userToStore = {
        id: userData.id,
        tipo: userData.tipo
      };

      localStorage.setItem('user', JSON.stringify(userToStore));
      localStorage.setItem('token', newToken);
      setUser(userToStore);
      setToken(newToken);
      setError(null);
    } catch (err) {
      console.error('Erro ao fazer login:', err);
      setError(err.message);
      throw err; // Rejeita a promise para tratamento no componente
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
      console.error('Erro ao fazer logout:', err);
      setError(err.message);
    }
  };

  // Função para verificar se o usuário está autenticado
  const isAuthenticated = () => {
    return !!user && !!token && !isTokenExpired(token);
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
        isAuthenticated
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}