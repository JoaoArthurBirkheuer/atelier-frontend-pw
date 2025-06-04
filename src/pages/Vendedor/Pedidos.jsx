// src/pages/Vendedor/Pedidos.jsx

import React, { useEffect, useState, useContext } from 'react'; // Importar useContext
import api from '../../services/api';
import { Modal, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import VendedorMenu from '../../components/VendedorMenu'; // Importar VendedorMenu
import { AuthContext } from '../../context/AuthContext'; // Importar AuthContext

const Pedidos = () => {
  // Obtendo o usuário do contexto para verificar se é admin
  const { user } = useContext(AuthContext);

  const formatarPreco = (valor) => {
    if (valor === undefined || valor === null) return '0.00';
    const numero = Number(valor);
    return isNaN(numero) ? '0.00' : numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };
  // Estados
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  // Definição estrita dos status permitidos
  const STATUS_PERMITIDOS = {
    PENDENTE: { label: 'PENDENTE', variant: 'warning' },
    CANCELADO: { label: 'CANCELADO', variant: 'danger' },
    ENTREGUE: { label: 'ENTREGUE', variant: 'success' }
  };

  // Carrega os pedidos
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        const response = await api.get('/pedidos');
        // Ajuste para mapear corretamente os IDs
        const pedidosFormatados = response.data.data.map(pedido => ({
          ...pedido,
          id: pedido.pedido_id // Garante que usaremos o campo correto
        }));
        setPedidos(pedidosFormatados || []);
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        // Ajustado para 'erro'
        setError(err.response?.data?.erro || 'Falha ao carregar pedidos. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, []);

  // Atualiza status com validação
  const atualizarStatus = async (pedidoId, novoStatus) => {
    if (!pedidoId) {
      console.error('ID do pedido não encontrado');
      return;
    }

    if (!STATUS_PERMITIDOS[novoStatus]) {
      setError('Status inválido');
      return;
    }

    setUpdatingStatus(pedidoId);
    const copiaPedidos = [...pedidos];

    try {
      // Atualização otimista
      setPedidos(pedidos.map(pedido => 
        pedido.pedido_id === pedidoId ? { ...pedido, status: novoStatus } : pedido
      ));

      await api.put(`/pedidos/${pedidoId}/status`, { status: novoStatus });
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      // Ajustado para 'erro'
      setError(`Falha ao atualizar status: ${err.response?.data?.erro || err.message}`);
      // Reverte em caso de erro
      setPedidos(copiaPedidos);
    } finally {
      setUpdatingStatus(null);
    }
  };

  // NOVO: Função para deletar pedido
  const deletarPedido = async (id) => {
    // REQUISITO 5: Apenas administradores podem excluir pedidos
    if (!user?.is_admin) {
      setError('Acesso negado. Apenas administradores podem excluir pedidos.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/pedidos/${id}`);
      // Recarrega a lista de pedidos após a exclusão
      const response = await api.get('/pedidos');
      const pedidosAtualizados = response.data.data.map(pedido => ({
        ...pedido,
        id: pedido.pedido_id
      }));
      setPedidos(pedidosAtualizados || []);
    } catch (err) {
      console.error('Erro ao excluir pedido:', err);
      // Ajustado para 'erro'
      setError(err.response?.data?.erro || 'Falha ao excluir pedido.');
    } finally {
      setLoading(false);
    }
  };

  // Renderização condicional
  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-5">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <Alert variant="danger" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      </div>
    );
  }

  return (
    <>
      <VendedorMenu /> {/* Adicionado o VendedorMenu */}
      <div className="container mt-4" style={{ paddingTop: '70px' }}>
        <h2 className="mb-4">Gerenciamento de Pedidos</h2>
        
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Data</th>
              <th>Status</th>
              <th>Valor Total</th> {/* Adicionado Valor Total */}
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center">Nenhum pedido encontrado</td> {/* Colspan ajustado */}
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr key={`pedido-${pedido.pedido_id}`}>
                  <td>{pedido.pedido_id}</td>
                  <td>{pedido.cliente?.nome || 'Não informado'}</td>
                  <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <Badge bg={STATUS_PERMITIDOS[pedido.status]?.variant || 'secondary'}>
                      {pedido.status}
                    </Badge>
                  </td>
                  <td>R$ {formatarPreco(pedido.valor_total)}</td> {/* Exibindo Valor Total */}
                  <td>
                    <div className="d-flex gap-2 flex-wrap">
                      <Button 
                        variant="info" 
                        size="sm"
                        onClick={() => {
                          if (!pedido?.pedido_id) {
                            console.error('ID do pedido não definido');
                            return;
                          }
                          setPedidoSelecionado(pedido);
                          setShowModal(true);
                          api.get(`/pedidos/${pedido.pedido_id}/itens`)
                            .then(res => setItensPedido(res.data.data || []))
                            .catch(err => {
                              console.error('Erro ao carregar itens:', err);
                              // Ajustado para 'erro'
                              setError(err.response?.data?.erro || 'Falha ao carregar itens do pedido');
                            });
                        }}
                      >
                        Ver Itens
                      </Button>
                      
                      {/* Botões de atualização de status */}
                      {Object.entries(STATUS_PERMITIDOS).map(([status, config]) => (
                        <Button
                          key={`status-${pedido.pedido_id}-${status}`}
                          variant={config.variant}
                          size="sm"
                          // Apenas vendedores podem atualizar o status (conforme backend)
                          disabled={pedido.status === status || updatingStatus === pedido.pedido_id || user?.tipo !== 'vendedor'} 
                          onClick={() => atualizarStatus(pedido.pedido_id, status)}
                        >
                          {config.label}
                          {updatingStatus === pedido.pedido_id && (
                            <Spinner size="sm" animation="border" className="ms-2" />
                          )}
                        </Button>
                      ))}

                      {/* NOVO: Botão de Excluir Pedido visível apenas para administradores */}
                      {user?.is_admin && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => deletarPedido(pedido.pedido_id)}
                          disabled={loading} // Desabilita durante o carregamento
                        >
                          Excluir
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Modal de Detalhes */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Pedido #{pedidoSelecionado?.pedido_id} - 
              <Badge bg={STATUS_PERMITIDOS[pedidoSelecionado?.status]?.variant} className="ms-2">
                {pedidoSelecionado?.status}
              </Badge>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {itensPedido.length > 0 ? (
              <div className="list-group">
                {itensPedido.map((item) => (
                  <div key={`item-${item.item_id}`} className="list-group-item">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>{item.peca_nome || `Peça ${item.peca_id}`}</strong>
                        <div className="text-muted small">Código: {item.peca_id}</div>
                      </div>
                      <div className="text-end">
                        <div>Quantidade: {item.quantidade}</div>
                        <div>Preço: R$ {formatarPreco(item.preco_venda)}</div>
                        {item.desconto_pct > 0 && (
                          <div className="text-muted small">Desconto: {item.desconto_pct}%</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Alert variant="info">Nenhum item encontrado neste pedido</Alert>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
};

export default Pedidos;
