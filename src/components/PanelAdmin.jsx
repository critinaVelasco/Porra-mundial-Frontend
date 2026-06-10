import React, { useState, useEffect } from 'react';

function PanelAdmin({ username, token, estilos }) {
    // ESTADOS
    const [partidosPorra, setPartidosPorra] = useState([]);
    const [grupos, setGrupos] = useState([]);
    const [partidosEspaña, setPartidosEspaña] = useState([]);
    const [clasificaciones, setClasificaciones] = useState({});
    const [terceros, setTerceros] = useState(Array(8).fill({ grupo: '', pais: '' }));
    const [ganadoresFaseFinal, setGanadoresFaseFinal] = useState({});
    const [partidosFinal, setPartidosFinal] = useState(null);
    const [golesEspaña, setGolesEspaña] = useState({});
    const [prediccionesExtra, setPrediccionesExtra] = useState({
        pichichiMundial: '',
        pichichiEspaña: '',
    });

    //  const API_URL = 'http://localhost:5000/api';
    const API_URL = 'https://porra-mundial-backend.onrender.com/api'

    // NUEVO ESTADO: Bloqueo de la porra
    const [bloqueado, setBloqueado] = useState(true);
    const [modoSuperAdmin, setModoSuperAdmin] = useState(false);

    const [seccionesVisiblesAdmin, setSeccionesVisiblesAdmin] = useState({
        faseGrupos: false,
        partidosEspaña: false,
        clasificacionFinal: false,
        faseFinal: false,
        pichichis: false
    });

    // COMPROBACIÓN DE FECHA LÍMITE
    // Ajusta el año si es necesario (he puesto 2026 como ejemplo)
    const fechaLimite = new Date('2026-10-10T23:59:59');
    const ahora = new Date();
    const dentroDePlazo = ahora <= fechaLimite;

    const manejarClasificacion = (grupoId, posicion, equipo) => {
        if (bloqueado) return; // Si está bloqueado no hace nada

        setClasificaciones(prev => {
            // Obtenemos el estado actual del grupo seleccionado
            const grupoActual = prev[grupoId] || {};

            // Creamos una copia del grupo para manipular los cambios
            const nuevoGrupo = { ...grupoActual };

            // 1. Verificamos si el equipo ya está seleccionado en la OTRA posición (1 o 2)
            const otraPosicion = posicion === 1 ? 2 : 1;
            if (nuevoGrupo[otraPosicion] === equipo && equipo !== '') {
                // Si ya estaba en la otra posición, lo quitamos de allí (intercambio/vaciado)
                nuevoGrupo[otraPosicion] = '';
            }

            // 2. Asignamos el equipo a la nueva posición elegida
            nuevoGrupo[posicion] = equipo;

            return {
                ...prev,
                [grupoId]: nuevoGrupo
            };
        });
    };

    const manejarTerceros = (index, campo, valor) => {
        if (bloqueado) return;
        const nuevasFilas = [...terceros];
        if (campo === 'grupo') {
            nuevasFilas[index] = { grupo: valor, pais: '' };
        } else {
            nuevasFilas[index] = { ...nuevasFilas[index], [campo]: valor };
        }
        setTerceros(nuevasFilas);
    };

    const toggleSeccion = (seccion) => {
        setSeccionesVisiblesAdmin(prev => ({ ...prev, [seccion]: !prev[seccion] }));
    };

    const seleccionarGanador = (partidoId, equipo) => {
        if (bloqueado) return;
        let nuevosGanadores = { ...ganadoresFaseFinal, [partidoId]: equipo };

        if (partidoId < 89) {
            Object.keys(nuevosGanadores).forEach(id => {
                if (id >= 89) delete nuevosGanadores[id];
            });
        }
        setGanadoresFaseFinal(nuevosGanadores);
    };

    const obtenerEquipo = (codigo) => {
        if (codigo.startsWith("Ganador")) {
            const id = codigo.split(" ")[1];
            return ganadoresFaseFinal[id] || "Esperando...";
        }

        if (codigo.length === 2 && !isNaN(codigo[0])) {
            const posicion = parseInt(codigo[0]);
            const grupo = codigo[1];
            return clasificaciones[grupo]?.[posicion] || `${posicion}º ${grupo}`;
        }

        if (codigo.startsWith("3")) {
            if (codigo.length === 2) {
                const grupo = codigo.replace("3", "");
                const tercer = terceros.find(t => t.grupo === grupo);
                return tercer?.pais || `3º ${grupo}`;
            }
            return "Tercero por determinar";
        }

        return codigo;
    };

    const calcularFaseFinal = async () => {
        try {
            const response = await fetch(`${API_URL}/calcularFaseFinal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    terceros: terceros,
                    // Si el modo super admin está activo, le mandamos el objeto completo de partidosFinal para que el server lo respete
                    partidosManuales: modoSuperAdmin ? partidosFinal : null
                })
            });
            const data = await response.json();

            setPartidosFinal(null);
            setTimeout(() => {
                setPartidosFinal(data.faseFinal);
                setSeccionesVisiblesAdmin(prev => ({ ...prev, faseFinal: true }));
            }, 100);
        } catch (error) {
            alert("Error al calcular: verifica que el servidor esté corriendo");
        }
    };

    const manejarExtra = (e) => {
        if (bloqueado) return;
        const { name, value } = e.target;
        setPrediccionesExtra(prev => ({ ...prev, [name]: value }));
    };

    const manejarGolesEspaña = (idPartido, tipo, valor) => {
        if (bloqueado) return;
        setGolesEspaña(prev => ({
            ...prev,
            [idPartido]: { ...prev[idPartido], [tipo]: valor }
        }));
    };

    // 1. CARGA DE DATOS
    useEffect(() => {
        const cargarTodo = async () => {
            try {
                const resPartidos = await fetch(`${API_URL}/partidos`);
                const dataGrupos = await resPartidos.json();

                const resFinal = await fetch(`${API_URL}/partidosFinal`);
                const dataFinal = await resFinal.json();

                setGrupos(dataGrupos);
                setPartidosFinal(dataFinal.faseFinal || dataFinal[0]?.faseFinal);

                const listaPlana = dataGrupos.flatMap(grupo =>
                    grupo.partidos.map(p => ({ id: p.id, equipoA: p.equipoLocal, equipoB: p.equipoVisitante, pronostico: '' }))
                );
                const filtrados = dataGrupos.flatMap(g => g.partidos).filter(p => p.equipoLocal === 'España' || p.equipoVisitante === 'España');
                setPartidosEspaña(filtrados);

                const resPorra = await fetch(`${API_URL}/admin/resultados`);

                if (resPorra.ok) {
                    const dataPorra = await resPorra.json();

                    if (Object.keys(dataPorra).length > 0) {
                        setPartidosPorra(dataPorra.partidosPorra || listaPlana);
                        if (dataPorra.clasificaciones) setClasificaciones(dataPorra.clasificaciones);
                        if (dataPorra.terceros) setTerceros(dataPorra.terceros);
                        if (dataPorra.ganadoresFaseFinal) setGanadoresFaseFinal(dataPorra.ganadoresFaseFinal);
                        if (dataPorra.golesEspaña) setGolesEspaña(dataPorra.golesEspaña);
                        if (dataPorra.partidosFinal) {
                            setPartidosFinal(dataPorra.partidosFinal);
                            setSeccionesVisiblesAdmin(prev => ({ ...prev, faseFinal: true }));
                        }
                        setPrediccionesExtra({
                            pichichiMundial: dataPorra.pichichiMundial || '',
                            pichichiEspaña: dataPorra.pichichiEspaña || ''
                        });
                    } else {
                        setPartidosPorra(listaPlana);
                    }
                } else {
                    setPartidosPorra(listaPlana);
                }
            } catch (error) {
                console.error("Error al cargar los datos:", error);
            }
        };

        if (username) {
            cargarTodo();
        }
    }, [username]);

    const guardarResultados = async () => {
        try {
            const payload = {
                username: username,  //admin
                partidosPorra,
                clasificaciones,
                terceros,
                ganadoresFaseFinal,
                partidosFinal,
                golesEspaña,
                pichichiMundial: prediccionesExtra.pichichiMundial,
                pichichiEspaña: prediccionesExtra.pichichiEspaña
            };

            const response = await fetch(`${API_URL}/admin/guardar-resultados-oficiales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('¡Quiniela guardada correctamente!');
                setBloqueado(true); // <--- VOLVEMOS A BLOQUEAR AL GUARDAR
            } else {
                alert('Error al guardar la quiniela en el servidor.');
            }
        } catch (error) {
            console.error("Error al guardar:", error);
            alert("Error de red: verifica que el servidor esté encendido.");
        }
    };

    // LÓGICA DE SELECCIÓN
    const seleccionarPronostico = (idPartido, valor) => {
        if (bloqueado) return; // Si está bloqueado no hace nada

        setPartidosPorra(prev => {
            const partidoExiste = prev.some(p => Number(p.id) === Number(idPartido));

            if (partidoExiste) {
                return prev.map(partido => {
                    if (Number(partido.id) === Number(idPartido)) {
                        return {
                            ...partido,
                            pronostico: partido.pronostico === valor ? '' : valor
                        };
                    }
                    return partido;
                });
            } else {
                return [...prev, { id: idPartido, pronostico: valor }];
            }
        });
    };

    const actualizarEquipoManual = (partidoId, rol, nuevoPais) => {
        setPartidosFinal(prevPartidosFinal => {
            if (!prevPartidosFinal) return prevPartidosFinal;

            // Clonamos el objeto de fases para no mutar el estado directamente
            const copiaFases = { ...prevPartidosFinal };

            // Buscamos dentro de la lista de dieciseisavos el partido correcto
            copiaFases.dieciseisavos = copiaFases.dieciseisavos.map(partido => {
                if (partido.id === partidoId) {
                    // Modificamos el rol ('local' o 'visitante') con el nombre real del país
                    return { ...partido, [rol]: nuevoPais, manual: true };
                }
                return partido;
            });

            return copiaFases;
        });
    };

    // ESTILOS COMUNES
    const estilos1X2 = {
        cabecera: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
    };

    const estiloTituloSeccion = {
        cursor: 'pointer',
        background: '#a8caeb',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #E5E7EB',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '20px',
        marginBottom: '10px',
        color: '#374151'
    };

    // Lista dinámica interactiva: Junta a todos los 1ºs, 2ºs y 3ºs clasificados
    const equiposClasificados = [
        ...Object.values(clasificaciones).map(g => g[1]),
        ...Object.values(clasificaciones).map(g => g[2]),
        ...terceros.map(t => t.pais)
    ].filter(pais => pais !== undefined && pais !== '').sort();


    return (
        <div style={{ marginTop: '20px' }}>
            <div style={estilos1X2.cabecera}>
                <div>
                    <h2>👋 ¡Hola, {username}!</h2>
                    <p style={{ color: bloqueado ? '#6B7280' : '#10b981', fontWeight: 'bold' }}>
                        {bloqueado ? '🔒 Porra Guardada (Modo Lectura)' : '📝 Porra en Edición...'}
                    </p>
                </div>

                {/* BOTÓN MODIFICAR (Solo si está dentro de plazo y bloqueado) */}
                {dentroDePlazo ? (
                    bloqueado && (
                        <button
                            onClick={() => setBloqueado(false)}
                            style={{ background: '#3b82f6', color: 'white', padding: '10px 15px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                            ✏️ Modificar Porra
                        </button>


                    )
                ) : (
                    <span style={{ color: '#ef4444', fontWeight: 'bold', padding: '10px', background: '#FEE2E2', borderRadius: '8px' }}>
                        ⏳ Plazo finalizado
                    </span>
                )}
            </div>
            {/* --- Botón Super Admin --- */}
            <div style={{ marginBottom: '20px', padding: '10px', background: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontWeight: 'bold', color: '#374151' }}>🛠️ Modo de asignación manual:</span>
                <button
                    onClick={() => setModoSuperAdmin(!modoSuperAdmin)}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        backgroundColor: modoSuperAdmin ? '#dc2626' : '#4b5563',
                        color: 'white',
                        transition: 'background-color 0.2s'
                    }}
                >
                    {modoSuperAdmin ? '🔴 Desactivar Super Admin' : '🚀 Activar Super Admin'}
                </button>
            </div>

            {/* SECCIÓN 1: FASE DE GRUPOS */}
            <h3 onClick={() => toggleSeccion('faseGrupos')} style={estiloTituloSeccion}>
                1. Fase de Grupos {seccionesVisiblesAdmin.faseGrupos ? '▲' : '▼'}
            </h3>

            {seccionesVisiblesAdmin.faseGrupos && (
                <>
                    {grupos.map((grupo) => (
                        <div key={grupo.grupo} style={{ border: '2px solid #FCD34D', borderRadius: '10px', padding: '15px', marginBottom: '25px', background: '#FFFFFF', opacity: bloqueado ? 0.8 : 1 }}>
                            <h3 style={{ color: '#92400E', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #FCD34D' }}>Grupo {grupo.grupo}</h3>
                            {grupo.partidos.map((p) => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ flex: 1 }}>{p.equipoLocal} vs {p.equipoVisitante}</span>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        {['1', 'X', '2'].map(val => {
                                            const pronosticoActual = partidosPorra.find(po => Number(po.id) === Number(p.id))?.pronostico;
                                            const estaSeleccionado = pronosticoActual === val;

                                            return (
                                                <button
                                                    key={val}
                                                    disabled={bloqueado}
                                                    style={{
                                                        padding: '5px 12px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                        cursor: bloqueado ? 'not-allowed' : 'pointer',
                                                        background: estaSeleccionado ? '#FCD34D' : 'white',
                                                        color: estaSeleccionado && bloqueado ? '#92400E' : 'black'
                                                    }}
                                                    onClick={() => seleccionarPronostico(p.id, val)}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}

            {/* 2. PARTIDOS DE ESPAÑA */}
            <h3 onClick={() => toggleSeccion('partidosEspaña')} style={estiloTituloSeccion}>
                2. Partidos de España {seccionesVisiblesAdmin.partidosEspaña ? '▲' : '▼'}
            </h3>

            {seccionesVisiblesAdmin.partidosEspaña && (
                <div style={{ padding: '15px', border: '2px solid #f70000', borderRadius: '10px', marginBottom: '25px', background: '#FFFFFF', opacity: bloqueado ? 0.8 : 1 }}>
                    {partidosEspaña && partidosEspaña.length > 0 ? (
                        partidosEspaña.map((p) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ flex: 1, fontWeight: 'bold' }}>{p.equipoLocal} vs {p.equipoVisitante}</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="-"
                                        disabled={bloqueado}
                                        value={golesEspaña[p.id]?.local || ''}
                                        style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc', background: bloqueado ? '#f3f4f6' : 'white', cursor: bloqueado ? 'not-allowed' : 'text' }}
                                        onChange={(e) => manejarGolesEspaña(p.id, 'local', e.target.value)}
                                    />
                                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>-</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="-"
                                        disabled={bloqueado}
                                        value={golesEspaña[p.id]?.visitante || ''}
                                        style={{ width: '50px', padding: '8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc', background: bloqueado ? '#f3f4f6' : 'white', cursor: bloqueado ? 'not-allowed' : 'text' }}
                                        onChange={(e) => manejarGolesEspaña(p.id, 'visitante', e.target.value)}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <p>Cargando partidos de España...</p>
                    )}
                </div>
            )}

            {/* 3. CLASIFICACIÓN FINAL DE GRUPOS */}
            <h3 onClick={() => toggleSeccion('clasificacionFinal')} style={estiloTituloSeccion}>
                3. Clasificación Final de Grupos {seccionesVisiblesAdmin.clasificacionFinal ? '▲' : '▼'}
            </h3>

            {seccionesVisiblesAdmin.clasificacionFinal && (
                <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB', opacity: bloqueado ? 0.8 : 1 }}>
                    <h4 style={{ color: '#92400E', borderBottom: '2px solid #FCD34D', paddingBottom: '8px', marginBottom: '20px' }}>🏆 Mejores Clasificados</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        {grupos.map((grupo) => (
                            <div key={grupo.grupo} style={{ padding: '15px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                <strong style={{ display: 'block', marginBottom: '10px', color: '#4B5563' }}>Grupo {grupo.grupo}</strong>
                                {[1, 2].map(pos => (
                                    <div key={pos} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                        <span style={{ fontWeight: 'bold', color: '#D97706', width: '20px' }}>{pos}º</span>
                                        <select
                                            disabled={bloqueado}
                                            style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #D1D5DB', background: bloqueado ? '#e5e7eb' : 'white', cursor: bloqueado ? 'not-allowed' : 'pointer' }}
                                            onChange={(e) => manejarClasificacion(grupo.grupo, pos, e.target.value)}
                                            value={clasificaciones[grupo.grupo]?.[pos] || ''}
                                        >
                                            <option value="">Selecciona equipo...</option>
                                            {Array.from(new Set(grupo.partidos.flatMap(p => [p.equipoLocal, p.equipoVisitante])))
                                                .filter(eq => !Object.values(clasificaciones[grupo.grupo] || {}).includes(eq) || eq === clasificaciones[grupo.grupo]?.[pos])
                                                .map(eq => <option key={eq} value={eq}>{eq}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>

                    <h4 style={{ color: '#92400E', borderBottom: '2px solid #FCD34D', paddingBottom: '8px', marginBottom: '20px' }}>🥉 Mejores Terceros</h4>
                    <div style={{ border: '2px solid #f0f0f0', borderRadius: '10px', overflow: 'hidden' }}>
                        <div style={{ display: 'flex', background: '#f3f3f3', fontWeight: 'bold', color: '#78350F', padding: '10px' }}>
                            <div style={{ flex: 1 }}>GRUPO</div>
                            <div style={{ flex: 1 }}>PAÍS</div>
                        </div>
                        {terceros.map((fila, index) => (
                            <div key={index} style={{ display: 'flex', background: index % 2 === 0 ? '#FFFFFF' : '#FFFDF2', borderTop: '1px solid #FDE68A' }}>
                                <select
                                    disabled={bloqueado}
                                    style={{ flex: 1, padding: '10px', border: 'none', background: bloqueado ? 'transparent' : 'transparent', cursor: bloqueado ? 'not-allowed' : 'pointer' }}
                                    onChange={(e) => manejarTerceros(index, 'grupo', e.target.value)}
                                    value={fila.grupo}
                                >
                                    <option value="">Seleccionar Grupo</option>
                                    {grupos.filter(g => !terceros.some((t, i) => t.grupo === g.grupo && i !== index)).map(g => <option key={g.grupo} value={g.grupo}>Grupo {g.grupo}</option>)}
                                </select>
                                <select
                                    disabled={bloqueado}
                                    style={{ flex: 1, padding: '10px', border: 'none', borderLeft: '1px solid #FDE68A', background: bloqueado ? 'transparent' : 'transparent', cursor: bloqueado ? 'not-allowed' : 'pointer' }}
                                    onChange={(e) => manejarTerceros(index, 'pais', e.target.value)}
                                    value={fila.pais}
                                >
                                    <option value="">Seleccionar País</option>
                                    {fila.grupo && grupos.find(g => g.grupo === fila.grupo)?.partidos.flatMap(p => [p.equipoLocal, p.equipoVisitante]).filter((pais, i, arr) => arr.indexOf(pais) === i && !Object.values(clasificaciones[fila.grupo] || {}).includes(pais)).map(pais => <option key={pais} value={pais}>{pais}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>

                    {/* Ocultamos el botón de generar cruces si está bloqueado */}
                    {!bloqueado && (
                        <button
                            type="button"
                            onClick={calcularFaseFinal}
                            style={{ background: '#2563eb', color: 'white', padding: '15px', borderRadius: '8px', cursor: 'pointer', width: '100%', marginTop: '20px', border: 'none', fontWeight: 'bold' }}
                        >
                            🚀 Generar Cruces de Fase Final
                        </button>
                    )}
                </div>
            )}

            {/* 4. FASE FINAL */}
            <h3 onClick={() => toggleSeccion('faseFinal')} style={estiloTituloSeccion}>
                4. Fase Final {seccionesVisiblesAdmin.faseFinal ? '▲' : '▼'}
            </h3>

            {seccionesVisiblesAdmin.faseFinal && partidosFinal && (
                <div style={{ padding: '15px', opacity: bloqueado ? 0.8 : 1 }}>
                    {Object.entries(partidosFinal).map(([fase, listaPartidos]) => (
                        <div key={fase} style={{ marginBottom: '25px' }}>
                            <h4 style={{ textTransform: 'capitalize', color: '#92400E', borderBottom: '2px solid #FCD34D' }}>{fase}</h4>
                            {listaPartidos.map((p) => {
                                const equipoLocal = obtenerEquipo(p.local);
                                const equipoVisitante = obtenerEquipo(p.visitante);

                                return (
                                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee', background: '#f9f9f9', borderRadius: '4px', marginBottom: '5px', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', width: '80px' }}>{p.fecha}</span>

                                        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'center', alignItems: 'center' }}>

                                            {/* --- EQUIPO LOCAL --- */}
                                            {fase.toLowerCase() === 'dieciseisavos' && modoSuperAdmin ? (
                                                <select
                                                    value={equipoLocal} // <-- Esto mantiene el valor calculado automáticamente
                                                    onChange={(e) => actualizarEquipoManual(p.id, 'local', e.target.value)}
                                                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', color: '#000', backgroundColor: '#fff', width: '140px' }}
                                                >
                                                    {/* Mostramos el equipo actual (sea calculado o modificado) */}
                                                    <option value={equipoLocal}>{equipoLocal}</option>

                                                    {/* Mostramos la lista dinámica interactiva de clasificados */}
                                                    {equiposClasificados.filter(pais => pais !== equipoLocal).map((pais) => (
                                                        <option key={pais} value={pais}>{pais}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <button
                                                    disabled={bloqueado}
                                                    style={{ background: ganadoresFaseFinal[p.id] === equipoLocal ? '#FCD34D' : 'white', border: '1px solid #ccc', padding: '5px 10px', cursor: bloqueado ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                                                    onClick={() => seleccionarGanador(p.id, equipoLocal)}
                                                >
                                                    {equipoLocal}
                                                </button>
                                            )}

                                            <span>vs</span>

                                            {/* --- EQUIPO VISITANTE --- */}
                                            {fase.toLowerCase() === 'dieciseisavos' && modoSuperAdmin ? (
                                                <select
                                                    value={equipoVisitante} // <-- Esto mantiene el valor calculado automáticamente
                                                    onChange={(e) => actualizarEquipoManual(p.id, 'visitante', e.target.value)}
                                                    style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc', color: '#000', backgroundColor: '#fff', width: '140px' }}
                                                >
                                                    <option value={equipoVisitante}>{equipoVisitante}</option>
                                                    {equiposClasificados.filter(pais => pais !== equipoVisitante).map((pais) => (
                                                        <option key={pais} value={pais}>{pais}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <button
                                                    disabled={bloqueado}
                                                    style={{ background: ganadoresFaseFinal[p.id] === equipoVisitante ? '#FCD34D' : 'white', border: '1px solid #ccc', padding: '5px 10px', cursor: bloqueado ? 'not-allowed' : 'pointer', borderRadius: '4px' }}
                                                    onClick={() => seleccionarGanador(p.id, equipoVisitante)}
                                                >
                                                    {equipoVisitante}
                                                </button>
                                            )}

                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            {/* 5. PICHICHIS */}
            <h3 onClick={() => toggleSeccion('pichichis')} style={estiloTituloSeccion}>
                5. Pichichis {seccionesVisiblesAdmin.pichichis ? '▲' : '▼'}
            </h3>
            {seccionesVisiblesAdmin.pichichis && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px', opacity: bloqueado ? 0.8 : 1 }}>
                    {[
                        { title: "General del Mundial", name: "pichichiMundial", value: prediccionesExtra.pichichiMundial },
                        { title: "Selección Española", name: "pichichiEspaña", value: prediccionesExtra.pichichiEspaña }
                    ].map((item, index) => (
                        <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#374151', fontSize: '14px' }}>{item.title}</h4>
                            <input
                                name={item.name}
                                disabled={bloqueado}
                                placeholder="Nombre del jugador..."
                                value={item.value || ''}
                                onChange={manejarExtra}
                                style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', width: '100%', boxSizing: 'border-box', background: bloqueado ? '#e5e7eb' : 'white', cursor: bloqueado ? 'not-allowed' : 'text' }}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* BOTÓN DE GUARDAR (Solo aparece si NO está bloqueado) */}
            {!bloqueado && (
                <button
                    style={{ ...estilos.btnSubmit, background: '#10b981', marginTop: '25px', width: '100%', cursor: 'pointer' }}
                    onClick={guardarResultados}
                >
                    💾 Guardar Quiniela
                </button>
            )}
        </div>
    );
}

export default PanelAdmin;