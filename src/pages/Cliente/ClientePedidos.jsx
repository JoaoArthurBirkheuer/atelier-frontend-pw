import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import ClienteMenu from '../../components/ClienteMenu';

function ClientePedidos() {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [itensPedido, setItensPedido] = useState([]);
  const [pedidoDetalhado, setPedidoDetalhado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Carrega os pedidos do cliente
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/clientes/${id}/pedidos`);
        setPedidos(response.data);
      } catch (error) {
        setErro('Erro ao carregar pedidos');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id && user.id.toString() === id) {
      carregarPedidos();
    } else {
      navigate('/login');
    }
  }, [id, user, navigate]);

  // Carrega os itens de um pedido específico
  const carregarItensPedido = async (pedidoId) => {
    try {
      const response = await api.get(`/pedidos/${pedidoId}/itens`);
      setItensPedido(response.data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDENTE': return 'bg-warning text-dark';
      case 'ENTREGUE': return 'bg-success text-white';
      case 'CANCELADO': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  };

  if (isLoading) {
    return (
      <>
        <ClienteMenu />
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ClienteMenu />
      <div className="container mt-4" style={{ paddingTop: '70px' }}>
        <h2>Meus Pedidos</h2>
        {erro && <div className="alert alert-danger">{erro}</div>}

        {pedidos.length === 0 ? (
          <div className="alert alert-info">Nenhum pedido encontrado</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Data</th>
                  <th>Valor Total</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map(pedido => (
                  <tr key={pedido.pedido_id}>
                    <td>{pedido.pedido_id}</td>
                    <td>{new Date(pedido.data_pedido).toLocaleDateString()}</td>
                    <td>R$ {pedido.valor_total.toFixed(2)}</td>
                    <td>
                      <span className={`badge ${getStatusColor(pedido.status)}`}>
                        {pedido.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-info btn-sm me-2"
                        onClick={() => {
                          setPedidoDetalhado(pedido);
                          carregarItensPedido(pedido.pedido_id);
                        }}
                      >
                        Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal de detalhes */}
        {pedidoDetalhado && (
          <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Pedido #{pedidoDetalhado.pedido_id}</h5>
                  <button type="button" className="btn-close" onClick={() => setPedidoDetalhado(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="row mb-3">
                    <div className="col-md-6">
                      <p><strong>Data:</strong> {new Date(pedidoDetalhado.data_pedido).toLocaleString()}</p>
                      <p><strong>Status:</strong> 
                        <span className={`badge ${getStatusColor(pedidoDetalhado.status)} ms-2`}>
                          {pedidoDetalhado.status}
                        </span>
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p><strong>Valor Total:</strong> R$ {pedidoDetalhado.valor_total.toFixed(2)}</p>
                    </div>
                  </div>

                  <h5>Itens do Pedido</h5>
                  {itensPedido.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Peça</th>
                            <th>Quantidade</th>
                            <th>Preço Unitário</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {itensPedido.map((item, index) => (
                            <tr key={index}>
                              <td>{item.peca_nome || `Peça ${item.peca_id}`}</td>
                              <td>{item.quantidade}</td>
                              <td>R$ {item.preco_venda.toFixed(2)}</td>
                              <td>R$ {(item.quantidade * item.preco_venda).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p>Carregando itens...</p>
                  )}
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setPedidoDetalhado(null)}>
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ClientePedidos;