import { AuthProvider } from './context/AuthContext';
import AppRoutes from './routes/Router';

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
