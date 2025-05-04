import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [tipo, setTipo] = useState('cliente');
  const [erro, setErro] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErro('');

    try {
      const response = await api.post('/auth/login', {
        email,
        senha,
        tipo
      });

      const { token, tipo: tipoUsuario, id } = response.data;

      login({ tipo: tipoUsuario, id }, token);

      if (tipoUsuario === 'cliente') {
        navigate('/clientes');
      } else {
        navigate('/vendedores');
      }
    } catch (error) {
      if (error.response?.status === 401) {
        setErro('Senha inválida');
      } else if (error.response?.status === 404) {
        setErro('Usuário não encontrado');
      } else {
        setErro('Erro ao fazer login');
      }
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
        <div className="form-group mb-3">
          <label>Email</label>
          <input
            type="email"
            className="form-control"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group mb-3">
          <label>Senha</label>
          <input
            type="password"
            className="form-control"
            required
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />
        </div>

        <div className="form-group form-check form-switch mb-3">
          <input
            type="checkbox"
            className="form-check-input"
            id="tipoSwitch"
            checked={tipo === 'vendedor'}
            onChange={() => setTipo(tipo === 'cliente' ? 'vendedor' : 'cliente')}
          />
          <label className="form-check-label" htmlFor="tipoSwitch">
            Entrar como {tipo === 'cliente' ? 'Cliente' : 'Vendedor'}
          </label>
        </div>

        {erro && <div className="alert alert-danger">{erro}</div>}

        <button type="submit" className="btn btn-primary w-100">
          Entrar
        </button>
      </form>
    </div>
  );
}
