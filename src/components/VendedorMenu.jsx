import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, NavLink } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function VendedorMenu() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setTimeout(() => {
    navigate('/');
  }, 50);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark fixed-top">
      <div className="container-fluid">
        <NavLink className="navbar-brand" to="/vendedores">
          {user?.nome ? `Vendedor ${user.nome}` : 'Dashboard Vendedor'}
        </NavLink>
        <button 
          className="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarVendedor"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarVendedor">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/perfil">Meu Perfil</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/lista-clientes">Clientes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/lista-vendedores">Vendedores</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/lista-pedidos">Pedidos</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/lista-pecas">Peças</NavLink>
            </li>
          </ul>
          <div className="d-flex">
            <button className="btn btn-outline-light" onClick={handleLogout}>
              Sair
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}