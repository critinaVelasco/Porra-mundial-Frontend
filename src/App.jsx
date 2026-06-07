import React, { useState, useEffect } from 'react';
import Predicciones from './components/Predicciones';
import Clasificacion from './components/Clasificacion';
import Partidos from './components/Partidos';
import Ranking from './components/Ranking';
import Reglas from './components/Reglas';
import LoginForm from './components/LoginForm';
import PanelAdmin from './components/PanelAdmin';

function App() {
  const [pestanaActiva, setPestanaActiva] = useState('predicciones');
  const [usuarioLogueado, setUsuarioLogueado] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);
  const [username, setUsername] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [password, setPassword] = useState('');

  // 🔑 Guardaremos el token de seguridad aquí
  const [token, setToken] = useState('');

  // 👥 ESTADOS REALES PARA LAS PORRAS DEL USUARIO
  const [misLigasAmigos, setMisLigasAmigos] = useState([]);
  const [ligaActivaId, setLigaActivaId] = useState(null);

  // URL base de tu servidor backend
  //  const API_URL = 'http://localhost:5000/api';
  const API_URL = 'https://porra-mundial-backend.onrender.com/api'

  // Manejar el inicio de sesión o registro real contra el backend
  const manejarSubmit = async (e) => {
    e.preventDefault();
    const endpoint = esRegistro ? '/auth/register' : '/auth/login';

    try {
      const respuesta = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: password })
      });

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        alert(datos.error || 'Ocurrió un error en la autenticación.');
        return;
      }

      // Guardamos la sesión si el servidor da el visto bueno
      setToken(datos.token);
      setUsername(datos.username);
      setUsuarioLogueado(true);
      setPassword(''); // Limpiamos contraseña por seguridad
    } catch (err) {
      alert('❌ No se pudo conectar con el servidor backend. Asegúrate de que está encendido.');
    }
  };

  // 🔄 Cargar las porras del usuario automáticamente en cuanto inicia sesión
  useEffect(() => {
    if (!usuarioLogueado || !token) return;

    const cargarMisPorras = async () => {
      try {
        const respuesta = await fetch(`${API_URL}/porras/mis-porras`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const porras = await respuesta.json();

        if (respuesta.ok) {
          setMisLigasAmigos(porras);
          if (porras.length > 0) {
            setLigaActivaId(porras[0].id); // Activamos la primera porra por defecto
          }
        }
      } catch (err) {
        console.error('Error al cargar las porras:', err);
      }
    };

    cargarMisPorras();
  }, [usuarioLogueado, token]);

  const estilos = {
    nav: { display: 'flex', justifyContent: 'space-around', background: '#111827', padding: '15px', listStyle: 'none', margin: 0 },
    boton: (id) => ({
      color: pestanaActiva === id ? '#3b82f6' : '#9ca3af',
      background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', padding: '10px'
    }),
    contenedor: { padding: '30px', fontFamily: 'Arial, sans-serif', textAlign: 'center', maxWidth: '600px', margin: '0 auto' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px', background: '#f3f4f6', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
    input: { padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' },
    btnSubmit: { background: '#3b82f6', color: 'white', padding: '10px', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' },
    enlace: { color: '#3b82f6', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', marginTop: '10px' }
  };

  const cerrarSesion = () => {
    setUsuarioLogueado(false);
    setToken('');
    setUsername('');
    setUsernameInput('');
    setMisLigasAmigos([]);
    setLigaActivaId(null);
  };

  //    <button style={estilos.boton('clasificacion')} onClick={() => setPestanaActiva('clasificacion')}>📊 Grupos Mundial</button>
  //    <button style={estilos.boton('partidos')} onClick={() => setPestanaActiva('partidos')}>⚽ Partidos</button>

  return (
    <div>
      {/* Barra de navegación: solo se muestra completa si el usuario ya inició sesión */}
      <nav style={estilos.nav}>
        <button style={estilos.boton('predicciones')} onClick={() => setPestanaActiva('predicciones')}>📝 Mis Predicciones</button>
        <button style={estilos.boton('ranking')} onClick={() => setPestanaActiva('ranking')}>🏆 Ranking Porra</button>
        <button style={estilos.boton('reglas')} onClick={() => setPestanaActiva('reglas')}>📜 Reglas</button>
        {usuarioLogueado && <button onClick={cerrarSesion} style={{ ...estilos.boton('salir'), color: '#ef4444' }}>🚪 Salir</button>}
        {usuarioLogueado && username === 'admin' && (
          <button style={estilos.boton('admin')} onClick={() => setPestanaActiva('admin')}>
            ⚙️ Panel Admin
          </button>
        )}
      </nav>

      <div style={estilos.contenedor}>
        {/* 🔐 SI NO ESTÁ LOGUEADO: Le obligamos a ver el formulario de Login/Registro */}
        {!usuarioLogueado ? (
          <LoginForm
            esRegistro={esRegistro}
            setEsRegistro={setEsRegistro}
            usernameInput={usernameInput}
            setUsernameInput={setUsernameInput}
            password={password}
            setPassword={setPassword}
            manejarSubmit={manejarSubmit} X
            estilos={estilos}
          />
        ) : (
          /* ✅ SI YA ESTÁ LOGUEADO: Mostramos las pestañas normalmente */
          <>
            {pestanaActiva === 'predicciones' && (
              <Predicciones
                username={username}
                estilos={estilos}
              />
            )}
            {pestanaActiva === 'clasificacion' && <Clasificacion />}
            {pestanaActiva === 'partidos' && <Partidos />}
            {pestanaActiva === 'ranking' && (
              <Ranking
                username={username}
                token={token}
                misLigasAmigos={misLigasAmigos}
                setMisLigasAmigos={setMisLigasAmigos}
                ligaActivaId={ligaActivaId}
                setLigaActivaId={setLigaActivaId}
                estilosGlobales={estilos}
              />
            )}
            {pestanaActiva === 'reglas' && <Reglas />}
            {pestanaActiva === 'admin' && <PanelAdmin username={username} estilos={estilos} />}
          </>
        )}
      </div>
    </div>
  );
}

export default App;