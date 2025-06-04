// src/pages/Auth/Registro.jsx

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../services/api'; // Importação do serviço de API (axios configurado)
import HomeMenu from '../../components/HomeMenu'; 

export default function Registro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState(''); 
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [senha, setSenha] = useState('');
  const [tipoUsuario, setTipoUsuario] = useState('cliente'); 
  
  const [querSerAdmin, setQuerSerAdmin] = useState(false); 
  const [jwtSecretInput, setJwtSecretInput] = useState(''); 

  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validarCampos = () => {
    const novosErros = {};
    let valido = true;

    if (!nome.trim()) {
      novosErros.nome = 'Nome é obrigatório';
      valido = false;
    }
    if (!email.trim()) {
      novosErros.email = 'Email é obrigatório';
      valido = false;
    } else if (!/^\S+@\S+\.\S+$/.test(email)) {
      novosErros.email = 'Email inválido';
      valido = false;
    }
    if (!senha.trim()) {
      novosErros.senha = 'Senha é obrigatória';
      valido = false;
    } else if (senha.length < 6) {
      novosErros.senha = 'A senha deve ter no mínimo 6 caracteres';
      valido = false;
    }

    if (tipoUsuario === 'vendedor' && !dataAdmissao) {
      novosErros.dataAdmissao = 'Data de Admissão é obrigatória para vendedores';
      valido = false;
    }

    if (tipoUsuario === 'vendedor' && querSerAdmin && !jwtSecretInput.trim()) {
      novosErros.jwtSecretInput = 'O Secret JWT é obrigatório para registrar como administrador.';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErros({});
    setErroGeral('');
    setSucesso('');

    if (!validarCampos()) {
      return;
    }

    setIsLoading(true);

    try {
      const dadosRegistro = {
        nome,
        email,
        telefone: telefone.trim() || null,
        senha,
        tipo: tipoUsuario, // O backend espera o campo 'tipo'
      };

      if (tipoUsuario === 'cliente') {
        dadosRegistro.endereco = endereco.trim() || null;
      } else { // tipoUsuario === 'vendedor'
        dadosRegistro.data_admissao = dataAdmissao; // Backend espera ISO format orYYYY-MM-DD
        // Se o vendedor quiser ser admin, adiciona as flags ao payload
        if (querSerAdmin) {
          dadosRegistro.is_admin = true;
          dadosRegistro.jwt_secret = jwtSecretInput;
        }
      }

      // CORREÇÃO: Removida a atribuição da resposta a uma variável não utilizada
      await api.post('/auth/register', dadosRegistro); 

      setSucesso('Registro realizado com sucesso! Você pode fazer login agora.');
      // Redireciona para o login após um curto delay para a mensagem ser vista
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (error) {
      console.error('Erro no registro:', error);
      let mensagemErro = 'Erro ao tentar registrar. Tente novamente.';
      // Ajustado para capturar a mensagem de erro do backend que agora retorna 'erro'
      if (error.response && error.response.data && error.response.data.erro) {
        mensagemErro = error.response.data.erro; 
        if (error.response.status === 409 && mensagemErro.includes('Email já cadastrado')) {
          setErros(prev => ({ ...prev, email: mensagemErro }));
        } else if (error.response.status === 403 && mensagemErro.includes('Secret JWT inválido')) {
          setErros(prev => ({ ...prev, jwtSecretInput: mensagemErro }));
        }
      }
      setErroGeral(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <HomeMenu />
      <div className="container mt-5" style={{ paddingTop: '70px' }}>
        <h2 className="mb-4">Criar Nova Conta</h2>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          {erroGeral && <div className="alert alert-danger">{erroGeral}</div>}
          {sucesso && <div className="alert alert-success">{sucesso}</div>}

          <div className="form-group mb-3">
            <label htmlFor="tipoUsuario">Tipo de Conta:</label>
            <div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoUsuario"
                  id="radioCliente"
                  value="cliente"
                  checked={tipoUsuario === 'cliente'}
                  onChange={() => {
                    setTipoUsuario('cliente');
                    setQuerSerAdmin(false); 
                    setJwtSecretInput(''); 
                    setErros(prev => ({ ...prev, jwtSecretInput: '' }));
                  }}
                  disabled={isLoading}
                />
                <label className="form-check-label" htmlFor="radioCliente">Cliente</label>
              </div>
              <div className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="radio"
                  name="tipoUsuario"
                  id="radioVendedor"
                  value="vendedor"
                  checked={tipoUsuario === 'vendedor'}
                  onChange={() => {
                    setTipoUsuario('vendedor');
                  }}
                  disabled={isLoading}
                />
                <label className="form-check-label" htmlFor="radioVendedor">Vendedor</label>
              </div>
            </div>
          </div>

          {/* SEÇÃO PARA OPÇÃO DE ADMINISTRADOR PARA VENDEDOR */}
          {tipoUsuario === 'vendedor' && (
            <div className="form-group mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="querSerAdmin"
                  checked={querSerAdmin}
                  onChange={(e) => {
                    setQuerSerAdmin(e.target.checked);
                    if (!e.target.checked) {
                      setJwtSecretInput(''); 
                      setErros(prev => ({ ...prev, jwtSecretInput: '' }));
                    }
                  }}
                  disabled={isLoading}
                />
                <label className="form-check-label" htmlFor="querSerAdmin">
                  Deseja que este vendedor seja administrador?
                </label>
              </div>

              {querSerAdmin && (
                <div className="mt-2">
                  <label htmlFor="jwtSecretInput">Secret JWT (para Admin)*</label>
                  <input
                    id="jwtSecretInput"
                    type="password"
                    className={`form-control ${erros.jwtSecretInput ? 'is-invalid' : ''}`}
                    value={jwtSecretInput}
                    onChange={(e) => { setJwtSecretInput(e.target.value); setErros(prev => ({ ...prev, jwtSecretInput: '' })); }}
                    required={querSerAdmin} 
                    disabled={isLoading}
                  />
                  {erros.jwtSecretInput && <div className="invalid-feedback">{erros.jwtSecretInput}</div>}
                  <small className="text-muted">Digite a chave secreta da API para conceder privilégios de administrador.</small>
                </div>
              )}
            </div>
          )}
          {/* FIM DA SEÇÃO DE ADMIN */}


          <div className="form-group mb-3">
            <label htmlFor="nome">Nome*</label>
            <input
              id="nome"
              type="text"
              className={`form-control ${erros.nome ? 'is-invalid' : ''}`}
              value={nome}
              onChange={(e) => { setNome(e.target.value); setErros(prev => ({ ...prev, nome: '' })); }}
              required
              disabled={isLoading}
            />
            {erros.nome && <div className="invalid-feedback">{erros.nome}</div>}
          </div>

          <div className="form-group mb-3">
            <label htmlFor="email">Email*</label>
            <input
              id="email"
              type="email"
              className={`form-control ${erros.email ? 'is-invalid' : ''}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErros(prev => ({ ...prev, email: '' })); }}
              required
              disabled={isLoading}
            />
            {erros.email && <div className="invalid-feedback">{erros.email}</div>}
          </div>

          <div className="form-group mb-3">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="text"
              className="form-control"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {tipoUsuario === 'cliente' && (
            <div className="form-group mb-3">
              <label htmlFor="endereco">Endereço</label>
              <input
                id="endereco"
                type="text"
                className="form-control"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                disabled={isLoading}
              />
            </div>
          )}

          {tipoUsuario === 'vendedor' && (
            <div className="form-group mb-3">
              <label htmlFor="dataAdmissao">Data de Admissão*</label>
              <input
                id="dataAdmissao"
                type="date"
                className={`form-control ${erros.dataAdmissao ? 'is-invalid' : ''}`}
                value={dataAdmissao}
                onChange={(e) => { setDataAdmissao(e.target.value); setErros(prev => ({ ...prev, dataAdmissao: '' })); }}
                required
                disabled={isLoading}
              />
              {erros.dataAdmissao && <div className="invalid-feedback">{erros.dataAdmissao}</div>}
            </div>
          )}

          <div className="form-group mb-3">
            <label htmlFor="senha">Senha*</label>
            <input
              id="senha"
              type="password"
              className={`form-control ${erros.senha ? 'is-invalid' : ''}`}
              value={senha}
              onChange={(e) => { setSenha(e.target.value); setErros(prev => ({ ...prev, senha: '' })); }}
              required
              disabled={isLoading}
            />
            {erros.senha && <div className="invalid-feedback">{erros.senha}</div>}
            <small className="text-muted">Mínimo 6 caracteres</small>
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={isLoading}
            style={{ backgroundColor: '#5C4033', borderColor: '#5C4033' }}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Registrando...
              </>
            ) : (
              'Registrar'
            )}
          </button>
          <div className="text-center mt-3">
            Já tem uma conta? <Link to="/login">Faça login aqui</Link>
          </div>
        </form>
      </div>
    </>
  );
}
