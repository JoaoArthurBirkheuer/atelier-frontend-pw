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

  // Formata data ISO para exibição (dd/MM/yyyy)
  const formatarDataExibicao = (dataISO) => {
    if (!dataISO) return '';
    try {
      const date = new Date(dataISO);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dataISO; // Retorna original se não puder formatar
    }
  };

  // Valida formato dd/MM/yyyy
  const validarFormatoData = (dataString) => {
    return /^\d{2}\/\d{2}\/\d{4}$/.test(dataString);
  };

  // Converte dd/MM/yyyy para Date object (para enviar ao backend)
  const parseDataParaEnvio = (dataString) => {
    if (!dataString || !validarFormatoData(dataString)) return null;
    const [day, month, year] = dataString.split('/');
    return new Date(`${year}-${month}-${day}T00:00:00`);
  };

  // Manipulador de input de data com formatação automática
  const handleDataChange = (e, isEditing = false) => {
    let value = e.target.value.replace(/[^0-9/]/g, '');
    
    // Auto-insere barras
    if (value.length > 2 && !value.includes('/')) {
      value = `${value.slice(0, 2)}/${value.slice(2)}`;
    }
    if (value.length > 5 && value.split('/').length < 3) {
      value = `${value.slice(0, 5)}/${value.slice(5)}`;
    }
    
    // Limita tamanho
    if (value.length > 10) value = value.slice(0, 10);
    
    if (isEditing) {
      setEditando({ ...editando, data_admissao: value });
    } else {
      setNovoVendedor({ ...novoVendedor, data_admissao: value });
    }
    
    // Limpa erro se existir
    if (erros.data_admissao) {
      setErros({ ...erros, data_admissao: '' });
    }
  };

  const carregarVendedores = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/vendedores');
      
      const vendedoresFormatados = res.data
        .filter(v => v.vendedor_id !== user.id)
        .map(v => ({
          ...v,
          data_admissao: formatarDataExibicao(v.data_admissao)
        }));
      
      setVendedores(vendedoresFormatados);
    } catch (error) {
      setErroGeral(error.response?.data?.message || 'Erro ao carregar vendedores');
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

    // Valida data apenas na edição
    if (isEdicao && vendedor.data_admissao && !validarFormatoData(vendedor.data_admissao)) {
      novosErros.data_admissao = 'Formato inválido (dd/MM/yyyy)';
      valido = false;
    }

    if (!isEdicao && !vendedor.senha?.trim()) {
      novosErros.senha = 'Senha é obrigatória';
      valido = false;
    } else if (vendedor.senha && vendedor.senha.length < 6) {
      novosErros.senha = 'Mínimo 6 caracteres';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const adicionarVendedor = async () => {
    setErroGeral('');
    
    // Validação básica dos campos
    if (!novoVendedor.nome || !novoVendedor.email || !novoVendedor.senha) {
      setErroGeral('Preencha todos os campos obrigatórios');
      return;
    }
  
    try {
      setIsLoading(true);
      
      // Prepara os dados para envio
      const dadosParaEnviar = {
        ...novoVendedor,
        // Converte a data para o formato esperado pelo backend
        data_admissao: novoVendedor.data_admissao 
          ? formatarDataParaBackend(novoVendedor.data_admissao)
          : null
      };
  
      const response = await api.post('/vendedores', dadosParaEnviar);
      
      // Atualiza a lista de vendedores
      setNovoVendedor({ nome: '', email: '', telefone: '', data_admissao: '', senha: '' });
      await carregarVendedores();
      
    } catch (error) {
      console.error('Erro detalhado:', error.response);
      setErroGeral(
        error.response?.data?.message || 
        error.response?.data?.error || 
        'Erro ao adicionar vendedor. Verifique os dados e tente novamente.'
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  // Função auxiliar para formatar a data para o backend
  const formatarDataParaBackend = (dataString) => {
    if (!dataString) return null;
    
    // Converte de dd/MM/yyyy para yyyy-MM-dd
    if (dataString.includes('/')) {
      const [day, month, year] = dataString.split('/');
      return `${year}-${month}-${day}`;
    }
    
    return dataString; // Já está no formato correto
  };

  const atualizarVendedor = async () => {
    setErroGeral('');
    if (!validarCampos(editando, true)) return;

    try {
      setIsLoading(true);
      await api.put(`/vendedores/${editando.vendedor_id}`, {
        ...editando,
        data_admissao: parseDataParaEnvio(editando.data_admissao)
      });
      setEditando(null);
      await carregarVendedores();
    } catch (error) {
      setErroGeral(error.response?.data?.message || 'Erro ao atualizar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const deletarVendedor = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este vendedor?')) return;
    
    try {
      setIsLoading(true);
      await api.delete(`/vendedores/${id}`);
      await carregarVendedores();
    } catch (error) {
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

          {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}

          {/* Formulário de novo vendedor */}
          <div className="mb-4">
            <h5>Novo Vendedor</h5>
            <div className="row g-2">
              {['nome', 'email', 'telefone'].map(campo => (
                <div className="col-md" key={campo}>
                  <input
                    type="text"
                    className={`form-control ${erros[campo] ? 'is-invalid' : ''}`}
                    placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
                    value={novoVendedor[campo]}
                    onChange={(e) => {
                      setNovoVendedor({ ...novoVendedor, [campo]: e.target.value });
                      if (erros[campo]) setErros({ ...erros, [campo]: '' });
                    }}
                    disabled={isLoading}
                  />
                  {erros[campo] && <div className="invalid-feedback">{erros[campo]}</div>}
                </div>
              ))}
              <div className="col-md">
                <input
                  type="text"
                  className={`form-control ${erros.data_admissao ? 'is-invalid' : ''}`}
                  placeholder="Data Admissão (dd/MM/yyyy)"
                  value={novoVendedor.data_admissao}
                  onChange={(e) => handleDataChange(e)}
                  disabled={isLoading}
                />
                {erros.data_admissao && <div className="invalid-feedback">{erros.data_admissao}</div>}
              </div>
              <div className="col-md">
                <input
                  type="password"
                  className={`form-control ${erros.senha ? 'is-invalid' : ''}`}
                  placeholder="Senha"
                  value={novoVendedor.senha}
                  onChange={(e) => {
                    setNovoVendedor({ ...novoVendedor, senha: e.target.value });
                    if (erros.senha) setErros({ ...erros, senha: '' });
                  }}
                  disabled={isLoading}
                />
                {erros.senha && <div className="invalid-feedback">{erros.senha}</div>}
              </div>
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
                          <td>
                            <input
                              type="text"
                              className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
                              value={editando.nome}
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
                              value={editando.email}
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
                              value={editando.telefone}
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
                              className={`form-control ${erros.data_admissao ? 'is-invalid' : ''}`}
                              value={editando.data_admissao}
                              onChange={(e) => handleDataChange(e, true)}
                              placeholder="dd/MM/yyyy"
                            />
                            {erros.data_admissao && <div className="invalid-feedback">{erros.data_admissao}</div>}
                          </td>
                          <td>
                            <input
                              type="password"
                              className={`form-control ${erros.senha ? 'is-invalid' : ''}`}
                              value={editando.senha}
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
                          <td>••••••</td>
                          <td>
                            <button 
                              className="btn btn-sm btn-warning me-2" 
                              onClick={() => setEditando({ 
                                ...v, 
                                senha: '',
                                data_admissao: v.data_admissao // Já está formatado
                              })}
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