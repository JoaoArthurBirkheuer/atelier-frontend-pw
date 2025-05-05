import { useEffect, useState, useContext, useCallback, useMemo } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import VendedorMenu from '../../components/VendedorMenu';

export default function Vendedores() {
  const [vendedores, setVendedores] = useState([]);
  const [novoVendedor, setNovoVendedor] = useState({ 
    nome: '', 
    email: '', 
    telefone: '', 
    data_admissao: '', 
    senha: '' 
  });
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, token } = useContext(AuthContext);

  const api = useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:3002',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }, [token]);

  const carregarVendedores = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/vendedores');
      setVendedores(res.data.filter(v => v.vendedor_id !== user.id));
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao carregar lista de vendedores');
    } finally {
      setIsLoading(false);
    }
  }, [api, user.id]);

  useEffect(() => {
    carregarVendedores();
  }, [carregarVendedores]);

  const validarCampos = (vendedor, isEdicao = false) => {
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

    // Validação da senha (obrigatória apenas para criação)
    if (!isEdicao && !vendedor.senha?.trim()) {
      novosErros.senha = 'Senha é obrigatória';
      valido = false;
    } else if (vendedor.senha && vendedor.senha.length < 6) {
      novosErros.senha = 'Senha deve ter pelo menos 6 caracteres';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const adicionarVendedor = async () => {
    setErroGeral('');
    if (!validarCampos(novoVendedor)) return;

    try {
      setIsLoading(true);
      await api.post('/vendedores', novoVendedor);
      setNovoVendedor({ nome: '', email: '', telefone: '', data_admissao: '', senha: '' });
      await carregarVendedores();
    } catch (error) {
      console.error('Erro ao adicionar vendedor:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao adicionar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarVendedor = async () => {
    setErroGeral('');
    
    // Se a senha estiver vazia, remove do objeto para não atualizar
    const dadosParaAtualizar = { ...editando };
    if (!dadosParaAtualizar.senha) {
      delete dadosParaAtualizar.senha;
    }

    if (!validarCampos(dadosParaAtualizar, true)) return;
    
    try {
      setIsLoading(true);
      await api.put(`/vendedores/${editando.vendedor_id}`, dadosParaAtualizar);
      setEditando(null);
      await carregarVendedores();
    } catch (error) {
      console.error('Erro ao atualizar vendedor:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao atualizar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const deletarVendedor = async (id) => {
    setErroGeral('');
    if (!window.confirm('Tem certeza que deseja excluir este vendedor?')) return;

    try {
      setIsLoading(true);
      await api.delete(`/vendedores/${id}`);
      await carregarVendedores();
    } catch (error) {
      console.error('Erro ao excluir vendedor:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao excluir vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <VendedorMenu />
      
      <div style={{ marginTop: '70px', padding: '20px' }}>
        <div className="container">
          <h2>Gerenciar Vendedores</h2>

          {erroGeral && (
            <div className="alert alert-danger">
              {erroGeral}
            </div>
          )}

          {/* Formulário de novo vendedor */}
          <div className="mb-4">
            <h5>Novo Vendedor</h5>
            <div className="row g-2">
              {['nome', 'email', 'telefone', 'data_admissao', 'senha'].map(campo => (
                <div className="col-md" key={campo}>
                  <input
                    type={campo === 'senha' ? 'password' : 'text'}
                    className={`form-control ${erros[campo] ? 'is-invalid' : ''}`}
                    placeholder={campo.charAt(0).toUpperCase() + campo.slice(1).replace('_', ' ')}
                    value={novoVendedor[campo]}
                    onChange={(e) => {
                      setNovoVendedor({ ...novoVendedor, [campo]: e.target.value });
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
                  onClick={adicionarVendedor}
                  disabled={isLoading}
                >
                  {isLoading ? 'Processando...' : 'Adicionar'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabela de vendedores */}
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
                    <th>Admissão</th>
                    <th>Senha</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {vendedores.map(v => (
                    <tr key={v.vendedor_id}>
                      {editando?.vendedor_id === v.vendedor_id ? (
                        <>
                          <td>{v.vendedor_id}</td>
                          {['nome', 'email', 'telefone', 'data_admissao', 'senha'].map(campo => (
                            <td key={campo}>
                              <input
                                type={campo === 'senha' ? 'password' : 'text'}
                                className={`form-control ${erros[campo] ? 'is-invalid' : ''}`}
                                value={editando[campo] || ''}
                                onChange={(e) => {
                                  setEditando({ ...editando, [campo]: e.target.value });
                                  if (erros[campo]) {
                                    setErros({ ...erros, [campo]: '' });
                                  }
                                }}
                                placeholder={campo === 'senha' ? 'Deixe em branco para não alterar' : ''}
                              />
                              {erros[campo] && (
                                <div className="invalid-feedback">
                                  {erros[campo]}
                                </div>
                              )}
                            </td>
                          ))}
                          <td>
                            <button 
                              className="btn btn-sm btn-primary me-2" 
                              onClick={atualizarVendedor}
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
                          <td>{v.vendedor_id}</td>
                          <td>{v.nome}</td>
                          <td>{v.email}</td>
                          <td>{v.telefone}</td>
                          <td>{v.data_admissao}</td>
                          <td>••••••</td> {/* Mostra senha oculta */}
                          <td>
                            <button 
                              className="btn btn-sm btn-warning me-2" 
                              onClick={() => setEditando({ ...v, senha: '' })}
                              disabled={isLoading}
                            >
                              Editar
                            </button>
                            <button 
                              className="btn btn-sm btn-danger" 
                              onClick={() => deletarVendedor(v.vendedor_id)}
                              disabled={isLoading}
                            >
                              Excluir
                            </button>
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