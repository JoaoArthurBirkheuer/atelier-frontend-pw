import HomeMenu from '../components/HomeMenu';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Home() {
  return (
    <>
      <HomeMenu />
      <div className="container text-center" style={{ marginTop: '120px' }}>
        <h1 className="mb-4">Projeto de PW - Atelier de peças</h1>
        <p className="lead">
          O presente trabalho tem por objetivo demonstrar os conhecimentos adquiridos na disciplina em Programação para Web até então.
        </p>
        <p className="lead">
          Faça login para iniciar a utilização do sistema na parte de vendedor ou de cliente.
        </p>
      </div>
    </>
  );
}