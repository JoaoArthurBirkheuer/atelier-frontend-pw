import { useEffect, useState } from 'react';
import api from '../../services/api';
import VendedorMenu from '../../components/VendedorMenu';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import Badge from 'react-bootstrap/Badge';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Pedidos() {
  const [pedidos, setPedidos] = useState([]);
  const [itensPedido, setItensPedido] = useState([]);
  const [statusSelecionado, setStatusSelecionado] = useState('');
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showItensModal, setShowItensModal] = useState(false);
  const [erroGeral, setErroGeral] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const carregarPedidos = async () => {
    try {
      setIsLoading(true);
      const res = await api.get('/pedidos');
      setPedidos(res.data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao carregar lista de pedidos');
    } finally {
      setIsLoading(false);
    }
  };

  const carregarItensPedido = async (pedidoId) => {
    try {
      const res = await api.get(`/item-pedido/pedido/${pedidoId}`);
      setItensPedido(res.data);
    } catch (error) {
      console.error('Erro ao carregar itens do pedido:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao carregar itens do pedido');
    }
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'warning';
      case 'CANCELADO': return 'danger';
      case 'ENTREGUE': return 'success';
      default: return 'secondary';
    }
  };

  const handleStatusChange = async () => {
    if (!pedidoSelecionado || !statusSelecionado) return;

    try {
      setIsLoading(true);
      await api.put(`/pedidos/${pedidoSelecionado.pedido_id}`, {
        ...pedidoSelecionado,
        status: statusSelecionado
      });
      setShowModal(false);
      await carregarPedidos();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      setErroGeral(error.response?.data?.message || 'Erro ao atualizar status');
    } finally {
      setIsLoading(false);
    }
  };

  const visualizarItens = async (pedido) => {
    setPedidoSelecionado(pedido);
    await carregarItensPedido(pedido.pedido_id);
    setShowItensModal(true);
  };

  const formatarData = (dataString) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <VendedorMenu />
      
      <div style={{ marginTop: '70px', padding: '20px' }}>
        <div className="container">
          <h2>Gerenciar Pedidos</h2>

          {erroGeral && (
            <div className="alert alert-danger">
              {erroGeral}
            </div>
          )}

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
                    <th>Data</th>
                    <th>Cliente</th>
                    <th>Vendedor</th>
                    <th>Valor Total</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map(p => (
                    <tr key={p.pedido_id}>
                      <td>{p.pedido_id}</td>
                      <td>{formatarData(p.data_pedido)}</td>
                      <td>{p.cliente_nome}</td>
                      <td>{p.vendedor_nome}</td>
                      <td>R$ {parseFloat(p.valor_total).toFixed(2)}</td>
                      <td>
                        <Badge bg={getStatusColor(p.status)}>
                          {p.status}
                        </Badge>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-info me-2"
                          onClick={() => visualizarItens(p)}
                          disabled={isLoading}
                        >
                          Itens
                        </button>
                        <button
                          className="btn btn-sm btn-warning"
                          onClick={() => {
                            setPedidoSelecionado(p);
                            setStatusSelecionado(p.status);
                            setShowModal(true);
                          }}
                          disabled={isLoading}
                        >
                          Alterar Status
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal para alterar status */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Alterar Status do Pedido #{pedidoSelecionado?.pedido_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Status atual:</label>
            <Badge bg={getStatusColor(pedidoSelecionado?.status)} className="ms-2">
              {pedidoSelecionado?.status}
            </Badge>
          </div>
          <div className="mb-3">
            <label className="form-label">Novo status:</label>
            <select
              className="form-select"
              value={statusSelecionado}
              onChange={(e) => setStatusSelecionado(e.target.value)}
            >
              <option value="PENDENTE">Pendente</option>
              <option value="CANCELADO">Cancelado</option>
              <option value="ENTREGUE">Entregue</option>
            </select>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button 
            variant="primary" 
            onClick={handleStatusChange}
            disabled={isLoading || !statusSelecionado || statusSelecionado === pedidoSelecionado?.status}
          >
            {isLoading ? 'Salvando...' : 'Salvar Alteração'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para visualizar itens */}
      <Modal show={showItensModal} onHide={() => setShowItensModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Itens do Pedido #{pedidoSelecionado?.pedido_id}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID Item</th>
                  <th>ID Peça</th>
                  <th>Quantidade</th>
                  <th>Preço Unitário</th>
                  <th>Desconto (%)</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {itensPedido.map(item => (
                  <tr key={item.item_id}>
                    <td>{item.item_id}</td>
                    <td>{item.peca_id}</td>
                    <td>{item.quantidade}</td>
                    <td>R$ {parseFloat(item.preco_venda).toFixed(2)}</td>
                    <td>{item.desconto_pct}%</td>
                    <td>R$ {(item.quantidade * item.preco_venda * (1 - item.desconto_pct/100)).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-end fw-bold mt-3">
            Total do Pedido: R$ {parseFloat(pedidoSelecionado?.valor_total || 0).toFixed(2)}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowItensModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}