import React, { useState } from 'react';
import Predicciones from './Predicciones'; // Reutilizamos el componente lógico

function VerPorras({ estilos }) {
    const [busqueda, setBusqueda] = useState('');
    const [usuarioBuscado, setUsuarioBuscado] = useState(null);
    const [cargando, setCargando] = useState(false);

    const API_URL = 'https://porra-mundial-backend.onrender.com/api';

    const buscarPorra = async () => {
        if (!busqueda) return;
        setCargando(true);
        try {
            const res = await fetch(`${API_URL}/porra/${busqueda}`);
            if (res.ok) {
                const data = await res.json();
                if (data && Object.keys(data).length > 0) {
                    setUsuarioBuscado(busqueda);
                } else {
                    alert('No se encontró ninguna porra para ese usuario.');
                    setUsuarioBuscado(null);
                }
            } else {
                alert('Error al buscar el usuario.');
            }
        } catch (err) {
            alert('Error de conexión.');
        } finally {
            setCargando(false);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            {/* Buscador */}
            <div style={{ background: '#f3f4f6', padding: '20px', borderRadius: '8px', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <input
                    type="text"
                    placeholder="Escribe el nombre de usuario..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <button onClick={buscarPorra} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    {cargando ? 'Buscando...' : '🔍 Buscar'}
                </button>
            </div>

            {/* Resultado: Reutilizamos Predicciones pasándole el usuario encontrado */}
            {usuarioBuscado && (
                <div style={{ border: '2px solid #3b82f6', padding: '20px', borderRadius: '10px' }}>
                    <h2 style={{ textAlign: 'center' }}>Porra de {usuarioBuscado}</h2>
                    <Predicciones 
                        username={usuarioBuscado} 
                        token={null} // Al ser solo lectura, no enviamos token
                        estilos={estilos}
                    />
                </div>
            )}
        </div>
    );
}

export default VerPorras;