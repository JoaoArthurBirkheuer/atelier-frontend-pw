import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

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

      const { token, tipo: tipoUsuario, id } = response.data;

      // Chama a função login do contexto (que agora inclui tratamento de erros)
      await login({ tipo: tipoUsuario, id }, token);

      // Redireciona apenas se o login foi bem-sucedido
      navigate(tipoUsuario === 'cliente' ? '/clientes' : '/vendedores');
      
    } catch (error) {
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response) {
        // Erros da API
        if (error.response.status === 401) {
          errorMessage = 'Senha inválida';
        } else if (error.response.status === 404) {
          errorMessage = 'Usuário não encontrado';
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.message) {
        // Erros do AuthContext (lançados na função login)
        errorMessage = error.message;
      } else if (authError) {
        // Erros capturados no AuthContext
        errorMessage = authError;
      }

      setErro(errorMessage);
      console.error('Erro no login:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-5">
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
            {authError && <div className="mt-2">Detalhes: {authError}</div>}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-primary w-100"
          disabled={isLoading}
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
      </form>
    </div>
  );
}