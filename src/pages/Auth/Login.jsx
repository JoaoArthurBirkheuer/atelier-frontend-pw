// src/pages/Auth/Login.jsx

import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Importar Link
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import HomeMenu from '../../components/HomeMenu';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('cliente');
  const [erro, setErro] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login, error: authError } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', {
        email,
        senha,
        tipo
      });

      // CORREÇÃO: Usar 'is_admin' conforme o backend retorna
      const { token, tipo: tipoUsuario, id, nome, email: userEmail, is_admin } = response.data; 
      await login({ tipo: tipoUsuario, id, nome, email: userEmail, is_admin }, token); // Passar is_admin para o AuthContext
      navigate(tipoUsuario === 'cliente' ? '/clientes' : '/vendedores');

    } catch (error) {
      console.error('Erro no login:', error);
      let errorMessage = 'Erro ao fazer login';

      if (error.response) {
        // O backend agora retorna 'erro' em vez de 'message' para erros
        if (error.response.data?.erro) { 
          errorMessage = error.response.data.erro;
        } else if (error.response.status === 401) {
          errorMessage = 'Credenciais inválidas (senha incorreta).'; // Mensagem mais específica
        } else if (error.response.status === 404) {
          errorMessage = 'Usuário não encontrado.';
        }
      } else if (error.message) {
        errorMessage = error.message;
      } else if (authError) {
        errorMessage = authError;
      }

      setErro(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HomeMenu /> 
      <div className="container mt-5" style={{ paddingTop: '70px' }}>
        <h2 className="mb-4">Login</h2>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <div className="form-group mb-3">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="form-control"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group mb-3">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              className="form-control"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group form-check form-switch mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="tipoSwitch"
              checked={tipo === 'vendedor'}
              onChange={() => setTipo(tipo === 'cliente' ? 'vendedor' : 'cliente')}
              disabled={isLoading}
            />
            <label className="form-check-label" htmlFor="tipoSwitch">
              Entrar como {tipo === 'cliente' ? 'Cliente' : 'Vendedor'}
            </label>
          </div>

          {erro && (
            <div className="alert alert-danger">
              {erro}
              {/* authError já é capturado e exibido em 'erro' se for o caso */}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={isLoading}
            style ={{ backgroundColor: '#5C4033', borderColor: '#5C4033' }}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Carregando...
              </>
            ) : (
              'Entrar'
            )}
          </button>
          {/* NOVO: Link para a página de registro */}
          <div className="text-center mt-3">
            Não tem uma conta? <Link to="/register">Crie uma aqui</Link>
          </div>
        </form>
      </div>
    </>
  );
}
