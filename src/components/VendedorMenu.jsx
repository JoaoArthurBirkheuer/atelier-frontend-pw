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
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <button className="btn btn-outline-light me-3" onClick={handleLogout}>
          Sair
        </button>
        <NavLink className="navbar-brand" to="/vendedores">Dashboard do Vendedor</NavLink>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/home">Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/clientes">Clientes</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/vendedores">Vendedores</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className="nav-link" to="/vendedores/pedidos">Pedidos</NavLink>
            </li>
            {user && (
              <li className="nav-item">
                <span className="navbar-text text-white">
                  Bem-vindo, {user?.tipo === 'vendedor' ? `Vendedor ${user.id}` : 'usuário'}
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
