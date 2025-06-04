// src/pages/Vendedor/Pecas.jsx

import { useEffect, useState, useContext } from 'react'; // Importar useContext
import VendedorMenu from '../../components/VendedorMenu';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext'; // Importar AuthContext

export default function Pecas() {
  const [pecas, setPecas] = useState([]);
  const [novaPeca, setNovaPeca] = useState({
    nome: '',
    descricao: '',
    tipo_madeira: '',
    largura_cm: '',
    altura_cm: '',
    profundidade_cm: '',
    preco_unitario: '',
    estoque: ''
  });
  const [editando, setEditando] = useState(null);
  const [erros, setErros] = useState({});
  const [erroGeral, setErroGeral] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { user } = useContext(AuthContext); // Obtendo o usuário do contexto

  const carregarPecas = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/pecas');
      setPecas(res.data);
    } catch (error) {
      console.error('Erro ao carregar peças:', error);
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao carregar lista de peças');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    carregarPecas();
  }, []);

  const validarCampos = (peca) => {
    const novosErros = {};
    let valido = true;

    if (!peca.nome?.trim()) {
      novosErros.nome = 'Nome é obrigatório';
      valido = false;
    }

    if (!peca.tipo_madeira?.trim()) {
      novosErros.tipo_madeira = 'Tipo de madeira é obrigatório';
      valido = false;
    }

    // Convertendo para número antes de validar
    const precoUnitarioNum = parseFloat(peca.preco_unitario);
    if (isNaN(precoUnitarioNum) || precoUnitarioNum <= 0) {
      novosErros.preco_unitario = 'Preço unitário inválido';
      valido = false;
    }

    const estoqueNum = parseInt(peca.estoque);
    if (isNaN(estoqueNum) || estoqueNum < 0) {
      novosErros.estoque = 'Estoque inválido';
      valido = false;
    }

    setErros(novosErros);
    return valido;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (editando) {
      setEditando({ ...editando, [name]: value });
    } else {
      setNovaPeca({ ...novaPeca, [name]: value });
    }
    if (erros[name]) {
      setErros({ ...erros, [name]: '' });
    }
  };

  const adicionarPeca = async () => {
    setErroGeral('');
    if (!validarCampos(novaPeca)) return;

    try {
      setIsLoading(true);
      await api.post('/pecas', novaPeca);
      setNovaPeca({
        nome: '',
        descricao: '',
        tipo_madeira: '',
        largura_cm: '',
        altura_cm: '',
        profundidade_cm: '',
        preco_unitario: '',
        estoque: ''
      });
      setShowModal(false);
      await carregarPecas();
    } catch (error) {
      console.error('Erro ao adicionar peça:', error);
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao adicionar peça');
    } finally {
      setIsLoading(false);
    }
  };

  const atualizarPeca = async () => {
    setErroGeral('');
    if (!validarCampos(editando)) return;

    try {
      setIsLoading(true);
      await api.put(`/pecas/${editando.peca_id}`, editando);
      setEditando(null);
      setShowModal(false);
      await carregarPecas();
    } catch (error) {
      console.error('Erro ao atualizar peça:', error);
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao atualizar peça');
    } finally {
      setIsLoading(false);
    }
  };

  const deletarPeca = async (id) => {
    setErroGeral('');
    // REQUISITO 5: Apenas administradores podem excluir peças
    if (!user?.is_admin) { // CORRIGIDO: Usar user?.is_admin
        setErroGeral('Acesso negado. Apenas administradores podem excluir peças.');
        return;
    }
    if (!window.confirm('Tem certeza que deseja excluir esta peça?')) return;

    try {
      setIsLoading(true);
      await api.delete(`/pecas/${id}`);
      await carregarPecas();
    } catch (error) {
      console.error('Erro ao excluir peça:', error);
      // Ajustado para 'erro'
      setErroGeral(error.response?.data?.erro || 'Erro ao excluir peça');
    } finally {
      setIsLoading(false);
    }
  };

  const abrirModalEdicao = (peca) => {
    setEditando({ ...peca });
    setShowModal(true);
  };

  const fecharModal = () => {
    setShowModal(false);
    setEditando(null);
    setErros({});
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <VendedorMenu />

      <div style={{ marginTop: '70px', padding: '20px' }}>
        <div className="container">
          <h2>Gerenciar Peças</h2>

          {erroGeral && (
            <div className="alert alert-danger">
              {erroGeral}
            </div>
          )}

          <div className="mb-4">
            <button
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
              disabled={isLoading}
            >
              Adicionar Nova Peça
            </button>
          </div>

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
                    <th>Tipo Madeira</th>
                    <th>Dimensões (cm)</th>
                    <th>Preço Unitário</th>
                    <th>Estoque</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pecas.map(p => (
                    <tr key={p.peca_id}>
                      <td>{p.peca_id}</td>
                      <td>{p.nome}</td>
                      <td>{p.tipo_madeira}</td>
                      <td>{p.largura_cm}x{p.altura_cm}x{p.profundidade_cm}</td>
                      <td>R$ {parseFloat(p.preco_unitario).toFixed(2)}</td>
                      <td>{p.estoque}</td>
                      <td>
                        <button
                          className="btn btn-sm btn-warning me-2"
                          onClick={() => abrirModalEdicao(p)}
                          disabled={isLoading}
                        >
                          Editar
                        </button>
                        {/* REQUISITO 5: Botão de Excluir visível/habilitado apenas para administradores */}
                        {user?.is_admin && ( // CORRIGIDO: Usar user?.is_admin
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => deletarPeca(p.peca_id)}
                            disabled={isLoading}
                          >
                            Excluir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para adicionar/editar peça */}
      <Modal show={showModal} onHide={fecharModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{editando ? 'Editar Peça' : 'Nova Peça'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Nome*</Form.Label>
                  <Form.Control
                    type="text"
                    name="nome"
                    value={editando?.nome || novaPeca.nome}
                    onChange={handleInputChange}
                    isInvalid={!!erros.nome}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.nome}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Descrição</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="descricao"
                    value={editando?.descricao || novaPeca.descricao}
                    onChange={handleInputChange}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Madeira*</Form.Label>
                  <Form.Control
                    type="text"
                    name="tipo_madeira"
                    value={editando?.tipo_madeira || novaPeca.tipo_madeira}
                    onChange={handleInputChange}
                    isInvalid={!!erros.tipo_madeira}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.tipo_madeira}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>

              <div className="col-md-6">
                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Largura (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="largura_cm"
                        value={editando?.largura_cm || novaPeca.largura_cm}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Altura (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="altura_cm"
                        value={editando?.altura_cm || novaPeca.altura_cm}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Profundidade (cm)</Form.Label>
                      <Form.Control
                        type="number"
                        step="0.1"
                        name="profundidade_cm"
                        value={editando?.profundidade_cm || novaPeca.profundidade_cm}
                        onChange={handleInputChange}
                      />
                    </Form.Group>
                  </div> {/* CORRIGIDO: Removida a tag extra aqui */}
                </div>

                <Form.Group className="mb-3">
                  <Form.Label>Preço Unitário*</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    name="preco_unitario"
                    value={editando?.preco_unitario || novaPeca.preco_unitario}
                    onChange={handleInputChange}
                    isInvalid={!!erros.preco_unitario}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.preco_unitario}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Estoque*</Form.Label>
                  <Form.Control
                    type="number"
                    name="estoque"
                    value={editando?.estoque || novaPeca.estoque}
                    onChange={handleInputChange}
                    isInvalid={!!erros.estoque}
                  />
                  <Form.Control.Feedback type="invalid">
                    {erros.estoque}
                  </Form.Control.Feedback>
                </Form.Group>
              </div>
            </div>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={fecharModal}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={editando ? atualizarPeca : adicionarPeca}
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
