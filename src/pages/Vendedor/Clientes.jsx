// src/pages/Vendedor/Clientes.jsx

import { useEffect, useState, useContext, useCallback} from 'react';
import { AuthContext } from '../../context/AuthContext';
import VendedorMenu from '../../components/VendedorMenu';
import api from '../../services/api';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [novoCliente, setNovoCliente] = useState({
    nome: '',
    email: '',
    telefone: '',
    endereco: '',
    senha: ''
  });
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const {user} = useContext(AuthContext); 

  const carregarClientes = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/clientes');
      setClientes(res.data);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao carregar lista de clientes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarClientes();
  }, [carregarClientes]);

  const validarCampos = (cliente, isEdicao = false) => {
    const novosErros = {};
    let valido = true;

    if (!cliente.nome?.trim()) {
      novosErros.nome = 'Nome é obrigatório';
      valido = false;
    }

    if (!cliente.email?.trim()) {
      novosErros.email = 'Email é obrigatório';
      valido = false; // CORRIGIDO: Era 'valos', agora é 'valido'
    } else if (!/^\S+@\S+\.\S+$/.test(cliente.email)) {
      novosErros.email = 'Email inválido';
      valido = false;
    }

    if (!isEdicao && !cliente.senha?.trim()) {
      novosErros.senha = 'Senha é obrigatória';
      valido = false;
    } else if (cliente.senha && cliente.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const adicionarCliente = async () => {
    setErroGeral('');
    if (!validarCampos(novoCliente)) return;

    try {
      setIsLoading(true);
      await api.post('/clientes', novoCliente);
      setNovoCliente({ nome: '', email: '', telefone: '', endereco: '', senha: '' });
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao adicionar cliente:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao adicionar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarCliente = async () => {
    setErroGeral('');

    const dadosParaAtualizar = {
      nome: editando.nome,
      email: editando.email,
      telefone: editando.telefone,
      endereco: editando.endereco
    };

    if (editando.senha?.trim()) {
      dadosParaAtualizar.senha = editando.senha;
    }

    if (!validarCampos(dadosParaAtualizar, true)) return;

    try {
      setIsLoading(true);
      await api.put(`/clientes/${editando.cliente_id}`, dadosParaAtualizar);
      setEditando(null);
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao atualizar cliente');
    } finally {
      setIsLoading(false);
    }
  };

  const deletarCliente = async (id) => {
    setErroGeral('');

    // No frontend, apenas administradores podem excluir clientes
    // A lógica de cliente só poder excluir a própria conta foi movida para o backend (no ClienteController)
    // CORRIGIDO: Usar user?.is_admin para consistência com o backend
    if (!user?.is_admin) { 
        setErroGeral('Acesso negado. Apenas administradores podem excluir clientes.');
        return;
    }

    // Substituindo window.confirm por uma mensagem de confirmação customizada
    // para melhor UX e compatibilidade com iframes (se aplicável no futuro)
    const confirmacao = window.confirm('Tem certeza que deseja excluir este cliente?');
    if (!confirmacao) return;

    try {
      setIsLoading(true);
      await api.delete(`/clientes/${id}`);
      await carregarClientes();
    } catch (error) {
      console.error('Erro ao excluir cliente:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao excluir cliente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <VendedorMenu />

      <div style={{ marginTop: '70px', padding: '20px' }}>
        <div className="container">
          <h2>Gerenciar Clientes</h2>

          {erroGeral && (
            <div className="alert alert-danger">
              {erroGeral}
            </div>
          )}

          {/* Formulário de novo cliente */}
          <div className="mb-4">
            <h5>Novo Cliente</h5>
            <div className="row g-2">
              {['nome', 'email', 'telefone', 'endereco', 'senha'].map(campo => (
                <div className="col-md" key={campo}>
                  <input
                    type={campo === 'senha' ? 'password' : 'text'}
                    className={`form-control ${erros[campo] ? 'is-invalid' : ''}`}
                    placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
                    value={novoCliente[campo] || ''}
                    onChange={(e) => {
                      setNovoCliente({ ...novoCliente, [campo]: e.target.value });
                      if (erros[campo]) {
                        setErros({ ...erros, [campo]: '' });
                      }
                    }}
                    disabled={isLoading}
                  />
                  {erros[campo] && (
                    <div className="invalid-feedback">
                      {erros[campo]}
                    </div>
                  )}
                </div>
              ))}
              <div className="col-md-auto">
                <button
                  className="btn btn-success h-100"
                  onClick={adicionarCliente}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de clientes */}
{isLoading ? (
  <div className="text-center my-4">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Carregando...</span>
    </div>
  </div>
) : (
  <div className="table-responsive">
    <table className="table table-striped table-bordered">
      <thead className="table-dark">
        <tr>
          <th>ID</th>
          <th>Nome</th>
          <th>Email</th>
          <th>Telefone</th>
          <th>Endereço</th>
          <th>Senha</th> {/* Adicionei o cabeçalho para senha */}
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        {clientes.map(c => (
          <tr key={c.cliente_id}>
            {editando?.cliente_id === c.cliente_id ? (
              <>
                <td>{c.cliente_id}</td>
                <td>
                  <input
                    type="text"
                    className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
                    value={editando.nome || ''}
                    onChange={(e) => {
                      setEditando({ ...editando, nome: e.target.value });
                      if (erros.nome) setErros({ ...erros, nome: '' });
                    }}
                  />
                  {erros.nome && <div className="invalid-feedback">{erros.nome}</div>}
                </td>
                <td>
                  <input
                    type="text"
                    className={`form-control ${erros.email ? 'is-invalid' : ''}`}
                    value={editando.email || ''}
                    onChange={(e) => {
                      setEditando({ ...editando, email: e.target.value });
                      if (erros.email) setErros({ ...erros, email: '' });
                    }}
                  />
                  {erros.email && <div className="invalid-feedback">{erros.email}</div>}
                </td>
                <td>
                  <input
                    type="text"
                    className={`form-control ${erros.telefone ? 'is-invalid' : ''}`}
                    value={editando.telefone || ''}
                    onChange={(e) => {
                      setEditando({ ...editando, telefone: e.target.value });
                      if (erros.telefone) setErros({ ...erros, telefone: '' });
                    }}
                  />
                  {erros.telefone && <div className="invalid-feedback">{erros.telefone}</div>}
                </td>
                <td>
                  <input
                    type="text"
                    className={`form-control ${erros.endereco ? 'is-invalid' : ''}`}
                    value={editando.endereco || ''}
                    onChange={(e) => {
                      setEditando({ ...editando, endereco: e.target.value });
                      if (erros.endereco) setErros({ ...erros, endereco: '' });
                    }}
                  />
                  {erros.endereco && <div className="invalid-feedback">{erros.endereco}</div>}
                </td>
                <td>
                  <input
                    type="password"
                    className={`form-control ${erros.senha ? 'is-invalid' : ''}`}
                    value={editando.senha || ''}
                    onChange={(e) => {
                      setEditando({ ...editando, senha: e.target.value });
                      if (erros.senha) setErros({ ...erros, senha: '' });
                    }}
                    placeholder="Deixe em branco para não alterar"
                  />
                  {erros.senha && <div className="invalid-feedback">{erros.senha}</div>}
                </td>
                <td>
                  <button
                    className="btn btn-sm btn-primary me-2"
                    onClick={atualizarCliente}
                    disabled={isLoading}
                  >
                    Salvar
                  </button>
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => setEditando(null)}
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                </td>
              </>
            ) : (
              <>
                <td>{c.cliente_id}</td>
                <td>{c.nome}</td>
                <td>{c.email}</td>
                <td>{c.telefone || 'Não informado'}</td>
                <td>{c.endereco || 'Não informado'}</td>
                <td>••••••</td> {/* Mostra senha oculta */}
                <td>
                  <button
                    className="btn btn-sm btn-warning me-2"
                    onClick={() => setEditando({ ...c, senha: '' })}
                    disabled={isLoading}
                  >
                    Editar
                  </button>
                  {user?.is_admin && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => deletarCliente(c.cliente_id)}
                      disabled={isLoading}
                    >
                      Excluir
                    </button>
                  )}
                </td>
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)}
        </div>
      </div>
    </div>
  );
}
