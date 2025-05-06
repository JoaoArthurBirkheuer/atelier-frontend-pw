import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import ClienteMenu from '../../components/ClienteMenu';

function CriarPedido() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pecas, setPecas] = useState([]);
  const [itensPedido, setItensPedido] = useState([]);
  const [detalhePeca, setDetalhePeca] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Carrega as peças disponíveis
  useEffect(() => {
    const carregarPecas = async () => {
      try {
        const response = await api.get('/pecas');
        setPecas(response.data.map(peca => ({
          ...peca,
          quantidadeSelecionada: 0
        })));
      } catch (error) {
        setErro('Erro ao carregar peças disponíveis');
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    carregarPecas();
  }, []);

  // Atualiza quantidade de um item no pedido
  const atualizarQuantidade = (pecaId, novaQuantidade) => {
    setPecas(prevPecas => 
      prevPecas.map(peca => 
        peca.peca_id === pecaId 
          ? { ...peca, quantidadeSelecionada: Math.max(0, Math.min(novaQuantidade, peca.estoque)) }
          : peca
      )
    );

    setItensPedido(prev => {
      const novoItens = prev.filter(item => item.peca_id !== pecaId);
      if (novaQuantidade > 0) {
        const peca = pecas.find(p => p.peca_id === pecaId);
        novoItens.push({
          peca_id: pecaId,
          quantidade: novaQuantidade,
          preco_venda: peca.preco_unitario,
          desconto_pct: 0
        });
      }
      return novoItens;
    });
  };

  const incrementarQuantidade = (pecaId) => {
    const peca = pecas.find(p => p.peca_id === pecaId);
    if (peca) {
      atualizarQuantidade(pecaId, peca.quantidadeSelecionada + 1);
    }
  };

  const decrementarQuantidade = (pecaId) => {
    const peca = pecas.find(p => p.peca_id === pecaId);
    if (peca) {
      atualizarQuantidade(pecaId, peca.quantidadeSelecionada - 1);
    }
  };

  const verDetalhes = (peca) => {
    setDetalhePeca(peca);
  };

  const fecharDetalhes = () => {
    setDetalhePeca(null);
  };

  const calcularTotal = () => {
    return itensPedido.reduce((total, item) => {
      const peca = pecas.find(p => p.peca_id === item.peca_id);
      return total + (peca ? peca.preco_unitario * item.quantidade : 0);
    }, 0);
  };

  const confirmarPedido = async () => {
    if (itensPedido.length === 0) {
      setErro('Selecione pelo menos um item para o pedido');
      return;
    }
  
    try {
      setIsLoading(true);
      setErro('');
  
      const novoPedido = {
        cliente_id: user.id,
        vendedor_id: null, // Será atribuído posteriormente
        data_pedido: new Date().toISOString(),
        status: 'PENDENTE',
        valor_total: calcularTotal(),
        itens: itensPedido
      };
  
      // Remova a atribuição à variável response que não está sendo usada
      await api.post('/pedidos', novoPedido);
      navigate('/pedidos', { state: { pedidoCriado: true } });
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      setErro(error.response?.data?.message || 'Erro ao criar pedido');
    } finally {
      setIsLoading(false);
    }
  };

  const cancelarPedido = () => {
    navigate('/clientes/home');
  };

  if (isLoading) {
    return <div className="container mt-4">Carregando...</div>;
  }

  return (
    <>
    <ClienteMenu />
    <div style={{ paddingTop: '70px' }}></div>
    <div className="container mt-4">
      <h2>Criar Novo Pedido</h2>
      {erro && <div className="alert alert-danger">{erro}</div>}

      <div className="table-responsive">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Peça</th>
              <th>Estoque</th>
              <th>Quantidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {pecas.map(peca => (
              <tr key={peca.peca_id}>
                <td>{peca.nome}</td>
                <td>{peca.estoque}</td>
                <td>
                  <div className="input-group" style={{ width: '120px' }}>
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => decrementarQuantidade(peca.peca_id)}
                      disabled={peca.quantidadeSelecionada <= 0}
                    >
                      -
                    </button>
                    <input 
                      type="number" 
                      className="form-control text-center"
                      value={peca.quantidadeSelecionada}
                      onChange={(e) => atualizarQuantidade(peca.peca_id, parseInt(e.target.value) || 0)}
                      min="0"
                      max={peca.estoque}
                    />
                    <button 
                      className="btn btn-outline-secondary" 
                      type="button"
                      onClick={() => incrementarQuantidade(peca.peca_id)}
                      disabled={peca.quantidadeSelecionada >= peca.estoque}
                    >
                      +
                    </button>
                  </div>
                </td>
                <td>
                  <button 
                    className="btn btn-info btn-sm"
                    onClick={() => verDetalhes(peca)}
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-3 bg-light rounded">
        <h4>Resumo do Pedido</h4>
        <p>Total de itens: {itensPedido.reduce((sum, item) => sum + item.quantidade, 0)}</p>
        <p>Valor total: R$ {calcularTotal().toFixed(2)}</p>
      </div>

      <div className="mt-4 d-flex justify-content-between">
        <button 
          className="btn btn-secondary"
          onClick={cancelarPedido}
        >
          Cancelar
        </button>
        <button 
          className="btn btn-primary"
          onClick={confirmarPedido}
          disabled={itensPedido.length === 0 || isLoading}
        >
          {isLoading ? 'Processando...' : 'Confirmar Pedido'}
        </button>
      </div>

      {/* Modal de detalhes da peça */}
      {detalhePeca && (
        <div className="modal" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{detalhePeca.nome}</h5>
                <button type="button" className="btn-close" onClick={fecharDetalhes}></button>
              </div>
              <div className="modal-body">
                <p><strong>Descrição:</strong> {detalhePeca.descricao}</p>
                <p><strong>Tipo de Madeira:</strong> {detalhePeca.tipo_madeira}</p>
                <p><strong>Dimensões:</strong> {detalhePeca.largura_cm}cm x {detalhePeca.altura_cm}cm x {detalhePeca.profundidade_cm}cm</p>
                <p><strong>Preço Unitário:</strong> R$ {detalhePeca.preco_unitario.toFixed(2)}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fecharDetalhes}>
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

export default CriarPedido;