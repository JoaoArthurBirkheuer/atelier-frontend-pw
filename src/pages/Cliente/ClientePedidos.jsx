import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import ClienteMenu from '../../components/ClienteMenu';
import { Modal, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';

function ClientePedidos() {
  const { user } = useContext(AuthContext);
  const [pedidos, setPedidos] = useState([]);
  const [itensPedido, setItensPedido] = useState([]);
  const [pedidoSelecionado, setPedidoSelecionado] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [loadingItens, setLoadingItens] = useState(false);

  const formatarPreco = (valor) => {
    if (valor === undefined || valor === null) return '0.00';
    const numero = Number(valor);
    return isNaN(numero) ? '0.00' : numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Carrega os pedidos do cliente
  useEffect(() => {
    const carregarPedidos = async () => {
      try {
        if (!user?.id) {
          setError('Usuário não identificado');
          setLoading(false);
          return;
        }
        
        setLoading(true);
        const response = await api.get(`/clientes/${user.id}/pedidos`);
        
        // DEBUG: Verifique a estrutura da resposta
        console.log('Resposta da API:', response);
        
        // Ajuste crítico - assumindo que a API retorna { data: [...] }
        const dados = response.data.data || response.data || [];
        setPedidos(dados);
        
        // Se ainda vazio, verifique se é um array
        if (!Array.isArray(dados)) {
          console.error('Dados não são um array:', dados);
          setError('Formato de dados inválido');
          setPedidos([]);
        }
      } catch (err) {
        console.error('Erro ao carregar pedidos:', err);
        setError(`Falha ao carregar pedidos: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    carregarPedidos();
  }, [user]);

  // Carrega os itens de um pedido específico
  const carregarItensPedido = async (pedidoId) => {
    try {
      setLoadingItens(true);
      const response = await api.get(`/pedidos/${pedidoId}/itens`);
      
      // DEBUG: Verifique a estrutura dos itens
      console.log('Resposta dos itens:', response);
      
      // Ajuste para ambas as estruturas possíveis
      const itens = response.data.data || response.data || [];
      setItensPedido(itens);
    } catch (err) {
      console.error('Erro ao carregar itens:', err);
      setError(`Falha ao carregar itens: ${err.message}`);
    } finally {
      setLoadingItens(false);
    }
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'PENDENTE': return 'warning';
      case 'ENTREGUE': return 'success';
      case 'CANCELADO': return 'danger';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <>
        <ClienteMenu />
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
          <div className="d-flex justify-content-center mt-5">
            <Spinner animation="border" />
            <span className="ms-2">Carregando pedidos...</span>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ClienteMenu />
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
          <Alert variant="danger">
            {error}
            <div className="mt-2">
              <Button variant="outline-danger" onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            </div>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <ClienteMenu />
      <div className="container mt-4" style={{ paddingTop: '70px' }}>
        <h2 className="mb-4">Meus Pedidos</h2>

        <Table striped bordered hover responsive>
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
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">
                  <Alert variant="info">Nenhum pedido encontrado</Alert>
                </td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr key={`pedido-${pedido.pedido_id || pedido.id}`}>
                  <td>{pedido.pedido_id || pedido.id}</td>
                  <td>{pedido.data_pedido ? new Date(pedido.data_pedido).toLocaleDateString('pt-BR') : 'N/D'}</td>
                  <td>R$ {formatarPreco(pedido.valor_total)}</td>
                  <td>
                    <Badge bg={getStatusVariant(pedido.status)}>
                      {pedido.status || 'N/D'}
                    </Badge>
                  </td>
                  <td>
                    <Button 
                      variant="info" 
                      size="sm"
                      onClick={() => {
                        setPedidoSelecionado(pedido);
                        carregarItensPedido(pedido.pedido_id || pedido.id);
                        setShowModal(true);
                      }}
                      disabled={!pedido.pedido_id && !pedido.id}
                    >
                      Ver Itens
                    </Button>
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
              Pedido #{pedidoSelecionado?.pedido_id || pedidoSelecionado?.id} - 
              <Badge bg={getStatusVariant(pedidoSelecionado?.status)} className="ms-2">
                {pedidoSelecionado?.status || 'N/D'}
              </Badge>
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pedidoSelecionado && (
              <div className="mb-3">
                <p><strong>Data:</strong> {pedidoSelecionado.data_pedido ? new Date(pedidoSelecionado.data_pedido).toLocaleString('pt-BR') : 'N/D'}</p>
                <p><strong>Valor Total:</strong> R$ {formatarPreco(pedidoSelecionado.valor_total)}</p>
              </div>
            )}

            <h5>Itens do Pedido</h5>
            {loadingItens ? (
              <div className="text-center">
                <Spinner animation="border" />
                <p>Carregando itens...</p>
              </div>
            ) : itensPedido.length > 0 ? (
              <Table striped bordered hover size="sm">
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
                    <tr key={`item-${item.item_id || index}`}>
                      <td>{item.peca_nome || `Peça ${item.peca_id || item.id || 'N/D'}`}</td>
                      <td>{item.quantidade || 0}</td>
                      <td>R$ {formatarPreco(item.preco_venda || item.preco)}</td>
                      <td>R$ {formatarPreco((item.quantidade || 0) * (item.preco_venda || item.preco || 0))}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            ) : (
              <Alert variant="warning">Nenhum item encontrado neste pedido</Alert>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </>
  );
}

export default ClientePedidos;