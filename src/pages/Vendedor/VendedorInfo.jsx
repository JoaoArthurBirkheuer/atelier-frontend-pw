import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';

export default function VendedorInfo() {
  const [vendedor, setVendedor] = useState({
    nome: '',
    email: '',
    telefone: '',
    data_admissao: '',
    senha: ''
  });
  const [editando, setEditando] = useState(false);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sucesso, setSucesso] = useState('');
  const { user, token, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Configuração do Axios com o token
  const api = axios.create({
    baseURL: 'http://localhost:3002',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  useEffect(() => {
    const carregarVendedor = async () => {
      try {
        setIsLoading(true);
        const res = await api.get(`/vendedores/${user.id}`);
        setVendedor(res.data);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setErroGeral('Erro ao carregar informações do vendedor');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      carregarVendedor();
    }
  }, [user?.id]);

  const validarCampos = () => {
    const novosErros = {};
    let valido = true;

    if (!vendedor.nome?.trim()) {
      novosErros.nome = 'Nome é obrigatório';
      valido = false;
    }

    if (!vendedor.email?.trim()) {
      novosErros.email = 'Email é obrigatório';
      valido = false;
    } else if (!/^\S+@\S+\.\S+$/.test(vendedor.email)) {
      novosErros.email = 'Email inválido';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVendedor(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpa o erro quando o usuário começa a digitar
    if (erros[name]) {
      setErros(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErroGeral('');
    setSucesso('');

    if (!validarCampos()) return;

    try {
      setIsLoading(true);
      
      // Remove a senha se estiver vazia para não atualizar
      const dadosParaAtualizar = { ...vendedor };
      if (!dadosParaAtualizar.senha) {
        delete dadosParaAtualizar.senha;
      }

      await api.put(`/vendedores/${user.id}`, dadosParaAtualizar);
      setSucesso('Informações atualizadas com sucesso!');
      setEditando(false);
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao atualizar informações');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcluirConta = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setIsLoading(true);
      await api.delete(`/vendedores/${user.id}`);
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      setErroGeral('Erro ao excluir conta. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h2 className="mb-0">Minhas Informações</h2>
        </div>
        
        <div className="card-body">
          {erroGeral && (
            <div className="alert alert-danger">
              {erroGeral}
            </div>
          )}

          {sucesso && (
            <div className="alert alert-success">
              {sucesso}
            </div>
          )}

          {isLoading ? (
            <div className="text-center my-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : editando ? (
            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Nome</label>
                  <input
                    type="text"
                    className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
                    name="nome"
                    value={vendedor.nome}
                    onChange={handleChange}
                  />
                  {erros.nome && (
                    <div className="invalid-feedback">
                      {erros.nome}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className={`form-control ${erros.email ? 'is-invalid' : ''}`}
                    name="email"
                    value={vendedor.email}
                    onChange={handleChange}
                  />
                  {erros.email && (
                    <div className="invalid-feedback">
                      {erros.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label className="form-label">Telefone</label>
                  <input
                    type="text"
                    className="form-control"
                    name="telefone"
                    value={vendedor.telefone}
                    onChange={handleChange}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Data de Admissão</label>
                  <input
                    type="text"
                    className="form-control"
                    name="data_admissao"
                    value={vendedor.data_admissao}
                    onChange={handleChange}
                    disabled
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Nova Senha (deixe em branco para não alterar)</label>
                <input
                  type="password"
                  className="form-control"
                  name="senha"
                  value={vendedor.senha}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="d-flex justify-content-between">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditando(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Nome</h5>
                  <p>{vendedor.nome}</p>
                </div>

                <div className="col-md-6">
                  <h5>Email</h5>
                  <p>{vendedor.email}</p>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <h5>Telefone</h5>
                  <p>{vendedor.telefone || 'Não informado'}</p>
                </div>

                <div className="col-md-6">
                  <h5>Data de Admissão</h5>
                  <p>{vendedor.data_admissao}</p>
                </div>
              </div>

              <div className="d-flex justify-content-between">
                <button
                  className="btn btn-danger"
                  onClick={handleExcluirConta}
                  disabled={isLoading}
                >
                  Excluir Minha Conta
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => setEditando(true)}
                >
                  Editar Informações
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}