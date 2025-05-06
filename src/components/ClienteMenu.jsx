import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function ClienteMenu() {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <button className="btn btn-outline-light me-3" onClick={handleLogout}>
          Sair
        </button>
        <NavLink className="navbar-brand" to="/clientes">Dashboard do Cliente</NavLink>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/home">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/info-pessoal">Meus Dados</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/pedido">Realizar Pedido</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/clientes/carrinho">Visualizar Pedidos</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}
