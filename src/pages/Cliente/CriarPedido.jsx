import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';
import ClienteMenu from '../../components/ClienteMenu';

function CriarPedido() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [pecas, setPecas] = useState([]);
  const [vendedores, setVendedores] = useState([]);
  const [vendedorSelecionado, setVendedorSelecionado] = useState(null);
  const [itensPedido, setItensPedido] = useState([]);
  const [detalhePeca, setDetalhePeca] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [erro, setErro] = useState('');

  // Verifica se o usuário está autenticado
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const safeNumber = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const num = Number(value);
    return isNaN(num) ? fallback : num;
  };

  const formatarPreco = (valor) => {
    const numero = safeNumber(valor);
    return numero.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  useEffect(() => {
    const carregarDados = async () => {
      try {
        if (!user) return;
        
        setIsLoading(true);
        setErro('');
        
        const [pecasResponse, vendedoresResponse] = await Promise.all([
          api.get('/pecas'),
          api.get('/vendedores')
        ]);

        const pecasFormatadas = pecasResponse.data.map(peca => ({
          ...peca,
          peca_id: safeNumber(peca.peca_id),
          preco_unitario: safeNumber(peca.preco_unitario),
          estoque: safeNumber(peca.estoque),
          quantidadeSelecionada: 0
        }));

        setPecas(pecasFormatadas);

        const vendedoresFormatados = vendedoresResponse.data.map(v => ({
          ...v,
          vendedor_id: safeNumber(v.vendedor_id)
        }));

        setVendedores(vendedoresFormatados);
        
        if (vendedoresFormatados.length > 0) {
          setVendedorSelecionado(vendedoresFormatados[0].vendedor_id);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setErro('Erro ao carregar dados iniciais. Tente recarregar a página.');
      } finally {
        setIsLoading(false);
      }
    };

    carregarDados();
  }, [user]);

  const atualizarQuantidade = (pecaId, novaQuantidade) => {
    const peca = pecas.find(p => p.peca_id === pecaId);
    if (!peca) return;

    const quantidade = Math.max(0, Math.min(safeNumber(novaQuantidade), peca.estoque));

    setPecas(prevPecas => 
      prevPecas.map(p => 
        p.peca_id === pecaId ? { ...p, quantidadeSelecionada: quantidade } : p
      )
    );

    setItensPedido(prev => {
      const novoItens = prev.filter(item => item.peca_id !== pecaId);
      if (quantidade > 0) {
        novoItens.push({
          peca_id: pecaId,
          quantidade,
          preco_venda: peca.preco_unitario,
          desconto_pct: 0
        });
      }
      return novoItens;
    });
  };

  const incrementarQuantidade = (pecaId) => {
    const peca = pecas.find(p => p.peca_id === pecaId);
    if (peca && peca.quantidadeSelecionada < peca.estoque) {
      atualizarQuantidade(pecaId, peca.quantidadeSelecionada + 1);
    }
  };

  const decrementarQuantidade = (pecaId) => {
    const peca = pecas.find(p => p.peca_id === pecaId);
    if (peca && peca.quantidadeSelecionada > 0) {
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
      const preco = safeNumber(peca?.preco_unitario || item.preco_venda);
      const quantidade = safeNumber(item.quantidade);
      return total + (preco * quantidade);
    }, 0);
  };

  const validarDadosPedido = () => {
    if (!user || !user.id) {
      setErro('Usuário não autenticado');
      return false;
    }

    if (itensPedido.length === 0) {
      setErro('Selecione pelo menos um item para o pedido');
      return false;
    }

    if (!vendedorSelecionado) {
      setErro('Selecione um vendedor');
      return false;
    }

    // Validação adicional para garantir que todos os itens têm peca_id válido
    for (const item of itensPedido) {
      if (!item.peca_id || isNaN(item.peca_id)) {
        setErro('Item inválido no pedido');
        return false;
      }
    }

    return true;
  };

  const confirmarPedido = async () => {
    if (!validarDadosPedido()) return;
  
    try {
      setIsLoading(true);
      setErro('');
  
      // Preparar os dados do pedido conforme esperado pelo backend
      const pedidoData = {
        cliente_id: user.id,
        vendedor_id: vendedorSelecionado,
        status: 'PENDENTE', // Ou 'EM_PROCESSO' conforme sua tabela
        valor_total: calcularTotal(), // Adicionando o valor total
        itens: itensPedido.map(item => ({
          peca_id: item.peca_id,
          quantidade: item.quantidade,
          preco_venda: item.preco_venda,
          desconto_pct: item.desconto_pct || 0
        }))
      };
  
      console.log('Dados sendo enviados:', pedidoData); // Para debug
  
      const response = await api.post('/pedidos', pedidoData);
      
      if (response.data && response.data.data?.pedido_id) {
        navigate('/clientes/meus-pedidos', { 
          state: { 
            mensagem: 'Pedido criado com sucesso!',
            pedidoId: response.data.pedido_id
          } 
        });
      } else {
        throw new Error('Resposta inesperada do servidor');
      }
    } catch (error) {
      console.error('Erro detalhado:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
  
      let errorMessage = 'Erro ao criar pedido. Tente novamente.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(e => e.msg).join(', ');
      } else if (error.message.includes('foreign key')) {
        errorMessage = 'Erro de referência: Verifique se todos os IDs são válidos';
      }
      
      setErro(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelarPedido = () => {
    navigate('/clientes');
  };

  if (isLoading && pecas.length === 0) {
    return (
      <>
        <ClienteMenu />
        <div className="container mt-4" style={{ paddingTop: '70px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <p>Carregando dados...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <ClienteMenu />
      <div style={{ paddingTop: '70px' }}></div>
      <div className="container mt-4">
        <h2>Criar Novo Pedido</h2>
        {erro && <div className="alert alert-danger">{erro}</div>}

        <div className="mb-4">
          <label className="form-label fw-bold">Vendedor Responsável:</label>
          <select
            className="form-select"
            value={vendedorSelecionado || ''}
            onChange={(e) => setVendedorSelecionado(safeNumber(e.target.value))}
            disabled={isLoading}
          >
            <option value="">Selecione um vendedor</option>
            {vendedores.map((v) => (
              <option key={v.vendedor_id} value={v.vendedor_id}>
                {v.nome}
              </option>
            ))}
          </select>
        </div>

        <div className="table-responsive mb-4">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Peça</th>
                <th>Estoque</th>
                <th>Preço Unitário</th>
                <th>Quantidade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {pecas.map(peca => (
                <tr key={`peca-${peca.peca_id}`}>
                  <td>{peca.nome}</td>
                  <td>{peca.estoque}</td>
                  <td>R$ {formatarPreco(peca.preco_unitario)}</td>
                  <td>
                    <div className="input-group" style={{ width: '140px' }}>
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => decrementarQuantidade(peca.peca_id)}
                        disabled={peca.quantidadeSelecionada <= 0 || isLoading}
                      >
                        -
                      </button>
                      <input 
                        type="number" 
                        className="form-control text-center"
                        value={peca.quantidadeSelecionada}
                        onChange={(e) => atualizarQuantidade(peca.peca_id, e.target.value)}
                        min="0"
                        max={peca.estoque}
                        disabled={isLoading}
                      />
                      <button 
                        className="btn btn-outline-secondary" 
                        type="button"
                        onClick={() => incrementarQuantidade(peca.peca_id)}
                        disabled={peca.quantidadeSelecionada >= peca.estoque || isLoading}
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-info btn-sm"
                      onClick={() => verDetalhes(peca)}
                      disabled={isLoading}
                    >
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-3 bg-light rounded mb-4">
          <h4>Resumo do Pedido</h4>
          <div className="row">
            <div className="col-md-6">
              <p><strong>Total de Itens:</strong> {itensPedido.reduce((sum, item) => sum + item.quantidade, 0)}</p>
              <p><strong>Quantidade de Produtos:</strong> {itensPedido.length}</p>
            </div>
            <div className="col-md-6">
              <p><strong>Valor Total:</strong> R$ {formatarPreco(calcularTotal())}</p>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between">
          <button 
            className="btn btn-secondary"
            onClick={cancelarPedido}
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary"
            onClick={confirmarPedido}
            disabled={itensPedido.length === 0 || isLoading || !vendedorSelecionado}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                <span className="ms-2">Processando...</span>
              </>
            ) : 'Confirmar Pedido'}
          </button>
        </div>
      </div>

      {detalhePeca && (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }} aria-hidden="true">
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{detalhePeca.nome}</h5>
                <button type="button" className="btn-close" onClick={fecharDetalhes}></button>
              </div>
              <div className="modal-body">
                <p><strong>Descrição:</strong> {detalhePeca.descricao || 'Não disponível'}</p>
                <p><strong>Preço Unitário:</strong> R$ {formatarPreco(detalhePeca.preco_unitario)}</p>
                <p><strong>Estoque Disponível:</strong> {detalhePeca.estoque}</p>
                <p><strong>Categoria:</strong> {detalhePeca.categoria || 'Não especificada'}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={fecharDetalhes}>Fechar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CriarPedido;