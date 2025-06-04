// src/pages/Cliente/ClientePedidos.jsx

import React, { useEffect, useState, useContext } from 'react';
import api from '../../services/api';
import { Modal, Button, Spinner, Alert, Badge, Table } from 'react-bootstrap';
import ClienteMenu from '../../components/ClienteMenu'; // Importar ClienteMenu
import { AuthContext } from '../../context/AuthContext'; // Importar AuthContext

const ClientePedidos = () => {
  const { user } = useContext(AuthContext); // Obtendo o usuário do contexto

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

  // Definição estrita dos status permitidos (para exibição)
  const STATUS_PERMITIDOS = {
    PENDENTE: { label: 'PENDENTE', variant: 'warning' },
    CANCELADO: { label: 'CANCELADO', variant: 'danger' },
    ENTREGUE: { label: 'ENTREGUE', variant: 'success' }
  };

  // Carrega os pedidos do cliente logado
  useEffect(() => {
    const carregarMeusPedidos = async () => {
      if (!user?.id) { // Garante que o ID do usuário esteja disponível
        setLoading(false);
        setError('ID do cliente não disponível para carregar pedidos.');
        return;
      }
      try {
        setLoading(true);
        // REQUISITO 4: Buscar apenas os pedidos do cliente logado
        const response = await api.get(`/clientes/${user.id}/pedidos`); 
        const pedidosFormatados = response.data.map(pedido => ({
          ...pedido,
          id: pedido.pedido_id 
        }));
        setPedidos(pedidosFormatados || []);
      } catch (err) {
        console.error('Erro ao carregar meus pedidos:', err);
        // Ajustado para 'erro'
        setError(err.response?.data?.erro || 'Falha ao carregar seus pedidos. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    };

    carregarMeusPedidos();
  }, [user?.id]); // Depende do ID do usuário

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
      <ClienteMenu /> {/* Adicionado o ClienteMenu */}
      <div className="container mt-4" style={{ paddingTop: '70px' }}>
        <h2 className="mb-4">Meus Pedidos</h2>
        
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>ID Pedido</th>
              <th>Data</th>
              <th>Status</th>
              <th>Valor Total</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.length === 0 ? (
              <tr>
                <td colSpan="5" className="text-center">Você não tem nenhum pedido.</td>
              </tr>
            ) : (
              pedidos.map((pedido) => (
                <tr key={`pedido-${pedido.pedido_id}`}>
                  <td>{pedido.pedido_id}</td>
                  <td>{new Date(pedido.data_pedido).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <Badge bg={STATUS_PERMITIDOS[pedido.status]?.variant || 'secondary'}>
                      {pedido.status}
                    </Badge>
                  </td>
                  <td>R$ {formatarPreco(pedido.valor_total)}</td>
                  <td>
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
                    {/* REQUISITO 5: Não há botão de exclusão para clientes */}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>

        {/* Modal de Detalhes do Pedido */}
        <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
          <Modal.Header closeButton>
            <Modal.Title>
              Detalhes do Pedido #{pedidoSelecionado?.pedido_id} - 
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

export default ClientePedidos;
