import { useState, useEffect, useContext } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import ClienteMenu from '../../components/ClienteMenu'; // Importe o ClienteMenu

const initialClienteState = {
  nome: '',
  email: '',
  telefone: '',
  endereco: '',
  senha: ''
};

export default function ClienteInfo() {
  const [cliente, setCliente] = useState(initialClienteState);
  const [uiState, setUiState] = useState({
    editando: false,
    isLoading: false,
    erros: {},
    erroGeral: '',
    sucesso: ''
  });

  const { user, logout, atualizarUsuario } = useContext(AuthContext);
  const navigate = useNavigate();

  const setUiStateProp = (updates) => {
    setUiState(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    const carregarCliente = async () => {
      try {
        setUiStateProp({ isLoading: true });
        const res = await api.get(`/clientes/${user.id}`);
        setCliente({
          ...res.data,
          senha: ''
        });
      } catch (error) {
        setUiStateProp({
          erroGeral: error.response?.data?.message || 'Erro ao carregar informações'
        });
      } finally {
        setUiStateProp({ isLoading: false });
      }
    };

    user?.id && carregarCliente();
  }, [user?.id]);

  const validarCampos = () => {
    const novosErros = {};
    if (!cliente.nome?.trim()) novosErros.nome = 'Nome é obrigatório';
    if (!cliente.email?.trim()) {
      novosErros.email = 'Email é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(cliente.email)) {
      novosErros.email = 'Email inválido';
    }
    if (cliente.senha && cliente.senha.length < 6) {
      novosErros.senha = 'Mínimo 6 caracteres';
    }

    setUiStateProp({ erros: novosErros });
    return Object.keys(novosErros).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCliente(prev => ({ ...prev, [name]: value }));

    if (uiState.erros[name]) {
      setUiStateProp({
        erros: { ...uiState.erros, [name]: '' }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUiStateProp({ erroGeral: '', sucesso: '' });

    if (!validarCampos()) return;

    try {
      setUiStateProp({ isLoading: true });

      const dadosParaAtualizar = { ...cliente };
      if (!dadosParaAtualizar.senha) delete dadosParaAtualizar.senha;

      await api.put(`/clientes/${user.id}`, dadosParaAtualizar);

      setUiStateProp({
        sucesso: 'Informações atualizadas com sucesso!',
        editando: false,
        isLoading: false
      });

      if (user.nome !== cliente.nome || user.email !== cliente.email) {
        atualizarUsuario?.({
          nome: cliente.nome,
          email: cliente.email
        });
      }
    } catch (error) {
      setUiStateProp({
        erroGeral: error.response?.data?.message || 'Erro ao atualizar informações'
      });
    } finally {
      setUiStateProp({ isLoading: false });
    }
  };

  const handleExcluirConta = async () => {
    if (!window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setUiStateProp({ isLoading: true });
      await api.delete(`/clientes/${user.id}`);
      logout();
      navigate('/login');
    } catch (error) {
      setUiStateProp({
        erroGeral: error.response?.data?.message || 'Erro ao excluir conta. Tente novamente.'
      });
    } finally {
      setUiStateProp({ isLoading: false });
    }
  };

  const { editando, isLoading, erros, erroGeral, sucesso } = uiState;

  return (
    <>
      <ClienteMenu /> {/* Adicione o menu fixo aqui */}
      <div style={{ paddingTop: '70px' }}> {/* Espaço para o menu fixo */}
        <div className="container mt-4">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h2 className="mb-0">Minhas Informações</h2>
            </div>

            <div className="card-body">
              {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}
              {sucesso && <div className="alert alert-success">{sucesso}</div>}

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
                      <label className="form-label">Nome*</label>
                      <input
                        type="text"
                        className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
                        name="nome"
                        value={cliente.nome}
                        onChange={handleChange}
                        required
                      />
                      {erros.nome && <div className="invalid-feedback">{erros.nome}</div>}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email*</label>
                      <input
                        type="email"
                        className={`form-control ${erros.email ? 'is-invalid' : ''}`}
                        name="email"
                        value={cliente.email}
                        onChange={handleChange}
                        required
                      />
                      {erros.email && <div className="invalid-feedback">{erros.email}</div>}
                    </div>
                  </div>

                  <div className="row mb-3">
                    <div className="col-md-6">
                      <label className="form-label">Telefone</label>
                      <input
                        type="tel"
                        className="form-control"
                        name="telefone"
                        value={cliente.telefone}
                        onChange={handleChange}
                        pattern="[0-9]{10,11}"
                        title="Digite um telefone válido (DDD + número)"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Endereço</label>
                      <input
                        type="text"
                        className="form-control"
                        name="endereco"
                        value={cliente.endereco}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Nova Senha</label>
                    <input
                      type="password"
                      className={`form-control ${erros.senha ? 'is-invalid' : ''}`}
                      name="senha"
                      value={cliente.senha}
                      onChange={handleChange}
                      placeholder="Deixe em branco para não alterar"
                    />
                    {erros.senha && <div className="invalid-feedback">{erros.senha}</div>}
                    <small className="text-muted">Mínimo 6 caracteres</small>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setUiStateProp({ editando: false, erros: {} })}
                      disabled={isLoading}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={isLoading}>
                      {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h5>Nome</h5>
                      <p className="fs-5">{cliente.nome}</p>
                    </div>

                    <div className="col-md-6">
                      <h5>Email</h5>
                      <p className="fs-5">{cliente.email}</p>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <h5>Telefone</h5>
                      <p className="fs-5">{cliente.telefone || 'Não informado'}</p>
                    </div>

                    <div className="col-md-6">
                      <h5>Endereço</h5>
                      <p className="fs-5">{cliente.endereco || 'Não informado'}</p>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between mt-4">
                    <button
                      className="btn btn-outline-danger"
                      onClick={handleExcluirConta}
                      disabled={isLoading}
                    >
                      Excluir Minha Conta
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => setUiStateProp({ editando: true })}
                      disabled={isLoading}
                    >
                      Editar Informações
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}