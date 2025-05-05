import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VendedorMenu() {
  const { logout, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <button className="btn btn-outline-light me-3" onClick={handleLogout}>
          Sair
        </button>
        <NavLink className="navbar-brand" to="/vendedores/home">
          Dashboard do Vendedor {user?.nome && `- ${user.nome}`}
        </NavLink>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/home">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/info-pessoal">Meus Dados</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/clientes">Clientes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/gerenciar">Vendedores</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/pedidos">Pedidos</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/pecas">Peças</NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
}