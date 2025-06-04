// src/pages/Vendedor/Vendedores.jsx

import { useEffect, useState, useContext, useCallback } from 'react';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext'; // Importar AuthContext
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
  const { user } = useContext(AuthContext); // Obtendo o usuário do contexto

  // Formata data ISO para exibição (dd/MM/yyyy)
  const formatarDataExibicao = (dataISO) => {
    if (!dataISO) return '';
    try {
      const date = new Date(dataISO);
      // Ajuste para garantir que a data seja interpretada no fuso horário local
      return new Date(date.getTime() + date.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
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
    return `${year}-${month}-${day}`; // Formato YYYY-MM-DD para o backend
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

      // Filtra o próprio vendedor logado da lista, se ele não for admin
      // Apenas administradores podem ver e gerenciar outros vendedores
      const vendedoresFormatados = res.data
        // Se o usuário não for admin, ele não deve ver outros vendedores na lista
        .filter(v => user?.is_admin || v.vendedor_id === user.id) // Permite ver a si mesmo se não for admin (embora o menu já leve para perfil)
        .map(v => ({
          ...v,
          data_admissao: formatarDataExibicao(v.data_admissao)
        }));

      setVendedores(vendedoresFormatados);
    } catch (error) {
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao carregar vendedores');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.is_admin]); // Adicionado user.is_admin como dependência

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
    setErros({});

    // REQUISITO 5: Apenas administradores podem adicionar novos vendedores
    if (!user?.is_admin) {
      setErroGeral('Acesso negado. Apenas administradores podem adicionar novos vendedores.');
      return;
    }

    // Validação completa usando a função existente validarCampos
    if (!validarCampos(novoVendedor)) {
      return; // A função validarCampos já define os erros
    }

    try {
      setIsLoading(true);

      // Prepara os dados para envio com tratamento seguro
      const dadosParaEnviar = {
        nome: novoVendedor.nome.trim(),
        email: novoVendedor.email.trim(),
        telefone: novoVendedor.telefone?.trim() || null,
        senha: novoVendedor.senha,
        data_admissao: novoVendedor.data_admissao
          ? parseDataParaEnvio(novoVendedor.data_admissao)
          : null
      };

      // Chamada à API com timeout
      await api.post('/vendedores', dadosParaEnviar, { timeout: 10000 });

      // Reset do formulário
      setNovoVendedor({
        nome: '',
        email: '',
        telefone: '',
        data_admissao: '',
        senha: ''
      });

      // Recarrega a lista (com tratamento de erro interno)
      await carregarVendedores();

    } catch (error) {
      console.error('Erro ao adicionar vendedor:', error);

      // Tratamento detalhado de diferentes tipos de erro
      let mensagemErro = 'Erro ao adicionar vendedor';

      if (error.response) {
        // Erro do servidor (4xx/5xx)
        // Ajustado para 'erro'
        mensagemErro = error.response.data?.erro || 
                       error.response.data?.message ||
                       `Erro ${error.response.status}: ${error.response.statusText}`;

        // Tratamento específico para email duplicado
        if (error.response.status === 409) {
          setErros(prev => ({ ...prev, email: 'Email já está em uso' }));
        }
      } else if (error.request) {
        // Erro de conexão/timeout
        mensagemErro = 'Sem resposta do servidor - verifique sua conexão';
      } else {
        // Erro na configuração da requisição
        mensagemErro = error.message || 'Erro ao configurar a requisição';
      }

      setErroGeral(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarVendedor = async () => {
    setErroGeral('');
    // REQUISITO 4: Apenas administradores podem atualizar outros vendedores
    if (!user?.is_admin) {
      setErroGeral('Acesso negado. Apenas administradores podem atualizar outros vendedores.');
      return;
    }

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
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao atualizar vendedor');
    } finally {
      setIsLoading(false);
    }
  };

  const deletarVendedor = async (id) => {
    // REQUISITO 5: Apenas administradores podem excluir vendedores
    if (!user?.is_admin) { 
        setErroGeral('Acesso negado. Apenas administradores podem excluir vendedores.');
        return;
    }
    if (!window.confirm('Tem certeza que deseja excluir este vendedor?')) return;

    try {
      setIsLoading(true);
      await api.delete(`/vendedores/${id}`);
      await carregarVendedores();
    } catch (error) {
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao excluir vendedor');
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

          {/* Formulário de novo vendedor visível apenas para administradores */}
          {user?.is_admin && (
            <div className="mb-4">
              <h5>Novo Vendedor</h5>
              <div className="row g-2">
                {['nome', 'email', 'telefone'].map(campo => (
                  <div className="col-md" key={campo}>
                    <input
                      type="text"
                      className={`form-control ${erros[campo] ? 'is-invalid' : ''}`}
                      placeholder={campo.charAt(0).toUpperCase() + campo.slice(1)}
                      value={novoVendedor[campo] || ''}
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
          )}

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
                    {user?.is_admin && <th>Admin</th>} {/* Mostra coluna 'Admin' apenas se o usuário logado for admin */}
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
                              className={`form-control ${erros.data_admissao ? 'is-invalid' : ''}`}
                              value={editando.data_admissao || ''}
                              onChange={(e) => handleDataChange(e, true)}
                              placeholder="dd/MM/yyyy"
                            />
                            {erros.data_admissao && <div className="invalid-feedback">{erros.data_admissao}</div>}
                          </td>
                          {user?.is_admin && ( // Campo is_admin para edição, visível apenas para admins
                            <td>
                              <input
                                type="checkbox"
                                className="form-check-input"
                                checked={editando.is_admin}
                                onChange={(e) => setEditando({ ...editando, is_admin: e.target.checked })}
                              />
                            </td>
                          )}
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
                          <td>{v.telefone || 'Não informado'}</td>
                          <td>{v.data_admissao}</td>
                          {user?.is_admin && ( // Mostra o status de admin apenas se o usuário logado for admin
                            <td>{v.is_admin ? 'Sim' : 'Não'}</td>
                          )}
                          <td>••••••</td>
                          <td>
                            {/* REQUISITO 4: Botão de Editar visível apenas para administradores */}
                            {user?.is_admin && (
                              <button
                                className="btn btn-sm btn-warning me-2"
                                onClick={() => setEditando({ ...v, senha: '' })}
                                disabled={isLoading}
                              >
                                Editar
                              </button>
                            )}
                            {/* REQUISITO 5: Botão de Excluir visível apenas para administradores */}
                            {user?.is_admin && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => deletarVendedor(v.vendedor_id)}
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
