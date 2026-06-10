import React, { useState, useEffect } from 'react';

function Ranking({ username, token, misLigasAmigos, setMisLigasAmigos, ligaActivaId, setLigaActivaId, estilosGlobales }) {
    const [vistaInicial, setVistaInicial] = useState('menu');
    const [nuevaLigaId, setNuevaLigaId] = useState('');
    const [nombreNuevaPorra, setNombreNuevaPorra] = useState('');
    const [maxParticipantes, setMaxParticipantes] = useState(10);
    const [error, setError] = useState(null);

    const [mostrarOpcionesExtra, setMostrarOpcionesExtra] = useState(false);
    const [subVistaExtra, setSubVistaExtra] = useState('');

    // Estado para el ranking procesado que devuelve el servidor
    const [datosRankingActual, setDatosRankingActual] = useState(null);

    //  const API_URL = 'http://localhost:5000/api/porras';
    const API_URL = 'https://porra-mundial-backend.onrender.com/api/porras'

    // 🔄 EFECTO 1: Cada vez que el usuario cambie de porra en el desplegable, pedimos el ranking al servidor
    useEffect(() => {
        setError(null); // Limpiamos errores previos
        if (!ligaActivaId || !token) return;

        const obtenerRankingServidor = async () => {
            try {
                const respuesta = await fetch(`${API_URL}/${ligaActivaId}/ranking`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const datos = await respuesta.json();

                if (respuesta.ok) {
                    // El servidor ya devuelve el ranking ordenado por puntos 
                    // (gracias a la lógica que pusimos en la API)
                    setDatosRankingActual(datos);
                } else {
                    setError(datos.error || "Error desconocido al cargar el ranking");
                    console.error("Error devuelto por el servidor:", datos.error);
                }
            } catch (err) {
                setError("Error de conexión con el servidor");
                console.error("Error de red al obtener el ranking:", err);
            }
        };

        // 1. Ejecución inmediata al cargar la pestaña
        obtenerRankingServidor();

        // 2. Configurar el "Tiempo Real": 
        // Refrescar el ranking automáticamente cada 10 segundos
        const intervalo = setInterval(obtenerRankingServidor, 10000);

        // 3. Limpieza: Importante para no dejar procesos activos al cambiar de pestaña
        return () => clearInterval(intervalo);

    }, [ligaActivaId, token]);

    // 🔄 EFECTO 2: Al cargar el componente por primera vez, traemos todas las porras donde participa el usuario
    useEffect(() => {
        if (!token) return;

        const cargarMisPorras = async () => {
            try {
                const respuesta = await fetch(`${API_URL}/mis-porras`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const datos = await respuesta.json();
                if (respuesta.ok) {
                    // ✅ GUARDAMOS LOS OBJETOS COMPLETOS (No solo el id de texto) para que el select funcione impecable
                    setMisLigasAmigos(datos);
                }
            } catch (err) {
                console.error("Error al cargar las porras del usuario:", err);
            }
        };

        cargarMisPorras();
    }, [token, setMisLigasAmigos]);

    // 🟢 MANEJAR CREACIÓN DE PORRA NUEVA
    const handleCrearPorra = async (e) => {
        e.preventDefault();
        if (!nuevaLigaId || !nombreNuevaPorra) return alert('Por favor, rellena los campos obligatorios.');

        try {
            const respuesta = await fetch(`${API_URL}/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    id: nuevaLigaId,
                    nombre: nombreNuevaPorra,
                    maxParticipantes: Number(maxParticipantes)
                })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                alert('🎉 ¡Porra creada con éxito en la nube!');

                // Creamos el objeto de la porra localmente para meterlo al estado instantáneamente
                const nuevaPorraObjeto = {
                    id: nuevaLigaId.toLowerCase().trim(),
                    nombre: nombreNuevaPorra,
                    maxParticipantes: Number(maxParticipantes)
                };

                setMisLigasAmigos([...misLigasAmigos, nuevaPorraObjeto]);
                setLigaActivaId(nuevaPorraObjeto.id); // La dejamos seleccionada por defecto

                // Limpiamos el formulario y volvemos al menú del ranking
                setNuevaLigaId('');
                setNombreNuevaPorra('');
                setVistaInicial('menu');
            } else {
                alert(datos.error || 'Error al crear la porra.');
            }
        } catch (err) {
            console.error(err);
            alert('Error al conectar con el servidor.');
        }
    };

    // 🔵 MANEJAR UNIRSE A UNA PORRA EXISTENTE
    const handleUnirsePorra = async (e) => {
        e.preventDefault();
        if (!nuevaLigaId) return alert('Introduce el código de la porra.');

        try {
            const respuesta = await fetch(`${API_URL}/unirse`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ id: nuevaLigaId })
            });

            const datos = await respuesta.json();

            if (respuesta.ok) {
                alert('✅ ¡Te has unido al grupo con éxito!');

                // Refrescamos la lista de porras volviendo a llamar al backend de forma limpia
                const resMisPorras = await fetch(`${API_URL}/mis-porras`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const nuevasPorras = await resMisPorras.json();
                if (resMisPorras.ok) setMisLigasAmigos(nuevasPorras);

                setLigaActivaId(nuevaLigaId.toLowerCase().trim());
                setNuevaLigaId('');
                setVistaInicial('menu');
            } else {
                alert(datos.error || 'No se pudo unir a la porra.');
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión.');
        }
    };

    // 🎨 Estilos visuales locales para el diseño del ranking
    const estilosRanking = {
        contenedor: { background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb', marginTop: '20px' },
        select: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '16px', marginBottom: '15px', background: '#f9fafb' },
        btnGrupo: { display: 'flex', gap: '10px', marginBottom: '25px' },
        btnAccion: { flex: 1, padding: '10px', borderRadius: '6px', border: 'none', background: '#3b82f6', color: '#fff', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
        btnSecundario: { flex: 1, padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' },
        tabla: { width: '100%', borderCollapse: 'collapse', marginTop: '15px' },
        th: { background: '#f3f4f6', color: '#374151', padding: '12px', textAlign: 'left', fontWeight: '6px', borderBottom: '2px solid #e5e7eb', fontSize: '14px' },
        td: { padding: '12px', borderBottom: '1px solid #e5e7eb', color: '#111827', fontSize: '15px' },
        metaInfo: { display: 'flex', justifyContent: 'space-between', color: '#6b7280', fontSize: '13px', borderBottom: '1px dashed #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }
    };

    return (
        <div style={estilosRanking.contenedor}>
            <h2>🏆 Ligas de Amigos y Rankings</h2>
            <p style={{ color: '#4b5563', marginBottom: '20px' }}>
                Compite contra tus amigos creadores, únete a comunidades con su código o revisa tu puesto en directo.
            </p>

            {/* RECUADRO DE SELECCIÓN DE LIGA ACTIVA */}
            <div style={{ marginBottom: '20px', background: '#f8fafc', padding: '15px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#334155' }}>🗣️ Selecciona la Porra que quieres visualizar:</label>
                <select
                    style={estilosRanking.select}
                    value={ligaActivaId || ''}
                    onChange={(e) => {
                        setLigaActivaId(e.target.value || null);
                        if (!e.target.value) setDatosRankingActual(null);
                    }}
                >
                    <option value="">-- Elige una de tus Porras asociadas --</option>
                    {misLigasAmigos.map((liga) => (
                        <option key={liga.id} value={liga.id}>
                            {liga.nombre} ({liga.id})
                        </option>
                    ))}
                </select>

                {/* BOTONES PARA DISPARAR MENÚS DE ACCIÓN */}
                {vistaInicial === 'menu' && (
                    <div style={estilosRanking.btnGrupo}>
                        <button style={estilosRanking.btnAccion} onClick={() => setVistaInicial('crear')}>＋ Crear Nueva Porra</button>
                        <button style={{ ...estilosRanking.btnAccion, background: '#10b981' }} onClick={() => setVistaInicial('unirse')}>🔗 Unirse con Código</button>
                    </div>
                )}
            </div>

            {/* VISTA A: FORMULARIO DE CREAR PORRA */}
            {vistaInicial === 'crear' && (
                <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '6px', border: '1px solid #bbf7d0', marginBottom: '20px' }}>
                    <h3 style={{ color: '#166534', marginTop: 0 }}>🛡️ Crear un Nuevo Grupo de Porra</h3>
                    <form style={estilosGlobales.form} onSubmit={handleCrearPorra}>
                        <input
                            style={estilosGlobales.input}
                            type="text"
                            placeholder="Código único de la porra (Ej: porrafamilia2026)"
                            required
                            value={nuevaLigaId}
                            onChange={(e) => setNuevaLigaId(e.target.value)}
                        />
                        <input
                            style={estilosGlobales.input}
                            type="text"
                            placeholder="Nombre del grupo (Ej: Porra de la Familia Velasco Rua)"
                            required
                            value={nombreNuevaPorra}
                            onChange={(e) => setNombreNuevaPorra(e.target.value)}
                        />
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ fontSize: '14px', color: '#374151', display: 'block', marginBottom: '5px' }}>👥 Límite máximo de participantes:</label>
                            <input
                                style={{ ...estilosGlobales.input, marginBottom: 0 }}
                                type="number"
                                min="2"
                                max="100"
                                value={maxParticipantes}
                                onChange={(e) => setMaxParticipantes(e.target.value)}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" style={{ ...estilosRanking.btnAccion, background: '#166534' }}>Validar y Crear en la Nube</button>
                            <button type="button" style={estilosRanking.btnSecundario} onClick={() => setVistaInicial('menu')}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* VISTA B: FORMULARIO DE UNIRSE A PORRA */}
            {vistaInicial === 'unirse' && (
                <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '6px', border: '1px solid #bfdbfe', marginBottom: '20px' }}>
                    <h3 style={{ color: '#1e40af', marginTop: 0 }}>🔗 Ingresar en un grupo existente</h3>
                    <p style={{ fontSize: '13px', color: '#1e3a8a', marginTop: '-10px', marginBottom: '15px' }}>Pídele al creador del grupo su código único de acceso para poder competir en su tabla.</p>
                    <form style={estilosGlobales.form} onSubmit={handleUnirsePorra}>
                        <input
                            style={estilosGlobales.input}
                            type="text"
                            placeholder="Escribe el código identificador de la porra"
                            required
                            value={nuevaLigaId}
                            onChange={(e) => setNuevaLigaId(e.target.value)}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="submit" style={{ ...estilosRanking.btnAccion, background: '#1e40af' }}>Buscar y Unirme al Grupo</button>
                            <button type="button" style={estilosRanking.btnSecundario} onClick={() => setVistaInicial('menu')}>Cancelar</button>
                        </div>
                    </form>
                </div>
            )}

            {/* VISUALIZACIÓN DINÁMICA DEL RANKING DE LA BASE DE DATOS */}
            {vistaInicial === 'menu' && (
                <div>
                    {!ligaActivaId ? (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', background: '#f9fafb', borderRadius: '6px', border: '1px dashed #e5e7eb' }}>
                            💡 Selecciona una porra en la lista desplegable de arriba para ver las posiciones reales de los competidores.
                        </div>
                    ) : !datosRankingActual ? (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#4b5563' }}>⏳ Solicitando ranking a la base de datos...</div>
                    ) : (
                        <div style={{ background: '#fff', border: '1px solid #e5e7eb', padding: '20px', borderRadius: '6px' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#111827' }}>📊 Tabla: {datosRankingActual.nombre}</h3>

                            <div style={estilosRanking.metaInfo}>
                                <span>🔑 Código de acceso: <span style={{ background: '#f3f4f6', padding: '2px 6px', borderRadius: '4px', color: '#111827', fontWeight: 'bold' }}>{datosRankingActual.id}</span></span>
                                <span>👥 Máximo: <strong>{datosRankingActual.max} participantes</strong></span>
                            </div>

                            <table style={estilosRanking.tabla}>
                                <thead>
                                    <tr>
                                        <th style={estilosRanking.th}>Posición</th>
                                        <th style={estilosRanking.th}>Participante</th>
                                        <th style={estilosRanking.th}>Puntos</th>
                                    </tr>
                                </thead>
                                <tbody>
								{Array.isArray(datosRankingActual?.ranking) && datosRankingActual.ranking.map((miembro) => (
									<tr key={miembro.usuario}>
										<td style={estilosRanking.td}>{miembro.posicion}º</td>
										<td style={{
											...estilosRanking.td,
											fontWeight: miembro.usuario === username ? 'bold' : 'normal',
											color: miembro.usuario === username ? '#3b82f6' : '#111827'
										}}>
											{miembro.usuario} {miembro.usuario === username ? '(Tú)' : ''}
										</td>
										<td style={estilosRanking.td}>{miembro.puntos} pts</td>
									</tr>
								))}

								{/* 💡 Añade un mensaje elegante por si el ranking está vacío o falló */}
								{(!datosRankingActual || !datosRankingActual.ranking) && (
									<tr>
										<td colSpan="3" style={{ textAlign: 'center', padding: '20px', color: '#6b7280' }}>
											Cargando las puntuaciones del servidor...
										</td>
									</tr>
								)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default Ranking;
