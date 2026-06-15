import React, { useState, useEffect } from 'react';

function Predicciones({ username, token, estilos, esSoloLectura = false }) {
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

    const [resultadosOficiales, setResultadosOficiales] = useState({
        pichichiMundial: '',
        pichichiEspaña: '',
        partidosPorra: [],      // Para 1X2 de Fase de Grupos
        golesEspaña: {},        // Para los resultados de España (goles local/visitante)
        clasificaciones: {},    // Para los aciertos de puestos en grupos
        ganadoresFaseFinal: {}  // Para los aciertos de ganadores en cruces
    });

    // NUEVO ESTADO: Bloqueo de la porra
    const [bloqueado, setBloqueado] = useState(true);

    const [seccionesVisibles, setSeccionesVisibles] = useState({
        faseGrupos: false,
        partidosEspaña: false,
        clasificacionFinal: false,
        faseFinal: false,
        pichichis: false
    });

    // COMPROBACIÓN DE FECHA LÍMITE
    // Ajusta el año si es necesario (he puesto 2026 como ejemplo)
    const fechaLimite = new Date('2026-06-11T19:59:59');
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
        setSeccionesVisibles(prev => ({ ...prev, [seccion]: !prev[seccion] }));
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
                body: JSON.stringify({ clasificaciones, terceros })
            });
            const data = await response.json();

            setPartidosFinal(null);
            setTimeout(() => {
                setPartidosFinal(data.faseFinal);
                setSeccionesVisibles(prev => ({ ...prev, faseFinal: true }));
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

    const calcularPuntosPartido_cabecera = (idPartido, pronosticoUsuario) => {
        // Añadimos el ?. por si partidosPorra no ha cargado de la API
        const oficial = resultadosOficiales.partidosPorra?.find(p => Number(p.id) === Number(idPartido));

        // Si existe el resultado y coincide el pronóstico, devuelve 1 punto
        if (oficial && pronosticoUsuario && oficial.pronostico === pronosticoUsuario) {
            return 1;
        }
        return 0;
    };

    const calcularPuntosPartido = (idPartido, pronosticoUsuario) => {
        // Buscamos el resultado oficial del partido
        const oficial = resultadosOficiales.partidosPorra?.find(p => Number(p.id) === Number(idPartido));

        // 1. Si no existe un resultado oficial cargado por el admin, devolvemos '-'
        if (!oficial || !oficial.pronostico) {
            return '-';
        }

        // 2. Si existe el resultado y coincide el pronóstico, devuelve 1 punto
        if (pronosticoUsuario && oficial.pronostico === pronosticoUsuario) {
            return 1;
        }

        // 3. Si el resultado oficial existe pero el pronóstico es incorrecto, entonces sí devuelve 0
        return 0;
    };

    const calcularPuntosEspaña = (idPartido, golesUsuarioLocal, golesUsuarioVisitante) => {
        // 1. Obtenemos el resultado oficial para este partido
        const oficial = resultadosOficiales?.golesEspaña?.[idPartido];

        // 2. Si el partido oficial no existe en el objeto, devolvemos 0
        if (!oficial) return 0;

        // 3. Validamos que existan tanto los goles oficiales como los del usuario y no sean cadenas vacías o undefined
        if (
            oficial.local === undefined || oficial.local === '' ||
            oficial.visitante === undefined || oficial.visitante === '' ||
            golesUsuarioLocal === undefined || golesUsuarioLocal === '' ||
            golesUsuarioVisitante === undefined || golesUsuarioVisitante === ''
        ) {
            return 0; // Si falta cualquier dato, no se calculan puntos aún
        }

        // 4. Convertimos de forma segura a números
        const uLocal = Number(golesUsuarioLocal);
        const uVisitante = Number(golesUsuarioVisitante);
        const oLocal = Number(oficial.local);
        const oVisitante = Number(oficial.visitante);

        // 5. Regla: Resultado exacto (5 puntos)
        if (uLocal === oLocal && uVisitante === oVisitante) {
            return 5;
        }

        // 6. Regla: Diferencia de goles (3 puntos)
        const diffUsuario = uLocal - uVisitante;
        const diffOficial = oLocal - oVisitante;

        if (diffUsuario === diffOficial) {
            return 3;
        }

        // Si no acierta nada
        return 0;
    };

    const calcularPuntosClasificacion = (grupo, posicion, equipoUsuario) => {
        // 1. Obtenemos los resultados oficiales del grupo
        const oficialesGrupo = resultadosOficiales.clasificaciones?.[grupo];
        if (!oficialesGrupo || !equipoUsuario) return 0;

        const oficialPosicionExacta = oficialesGrupo[posicion];
        const equipoUsuarioNormalizado = equipoUsuario.trim().toLowerCase();

        // 2. Acierto de posición exacta (1º o 2º) -> 3 puntos
        if (oficialPosicionExacta && equipoUsuarioNormalizado === oficialPosicionExacta.trim().toLowerCase()) {
            return 3;
        }

        // 3. Acierto de clasificación pero fallando la posición -> 1 punto
        // Buscamos si el equipo del usuario aparece en alguna otra posición del grupo (1º o 2º)
        const estaClasificado = Object.values(oficialesGrupo).some(
            (equipoOficial) => equipoOficial?.trim().toLowerCase() === equipoUsuarioNormalizado
        );

        if (estaClasificado) {
            return 1;
        }

        // 4. Si no está clasificado o no coincide -> 0 puntos
        return 0;
    };

    // 4. Para los MEJORES TERCEROS
    const calcularPuntosTerceros = (grupoUsuario, paisUsuario) => {
        if (!grupoUsuario || !paisUsuario) return 0;

        const existeEnOficiales = resultadosOficiales.terceros?.some(
            tercero =>
                tercero.grupo === grupoUsuario &&
                tercero.pais?.trim().toLowerCase() === paisUsuario.trim().toLowerCase()
        );

        return existeEnOficiales ? 3 : 0;
    };

    const calcularPuntosFaseFinal = (idCruce, ganadorUsuario, fase) => {
        const ganadorOficial = resultadosOficiales.ganadoresFaseFinal?.[idCruce];
        if (!ganadorOficial || !ganadorUsuario) return 0;

        // Comparamos el ganador
        const esAcierto = ganadorUsuario.trim().toLowerCase() === ganadorOficial.trim().toLowerCase();

        if (!esAcierto) return 0;

        // Asignamos puntos según la fase
        switch (fase.toLowerCase()) {
            case 'dieciseisavos': return 3;
            case 'octavos': return 4;
            case 'cuartos': return 6;
            case 'semifinales': return 7;
            case 'final': return 10;
            default: return 0;
        }
    };

    const calcularPuntosPichichi = (prediccion, oficial) => {
        if (!prediccion || !oficial) return 0;
        return prediccion.trim().toLowerCase() === oficial.trim().toLowerCase() ? 5 : 0;
    };

    const calcularTotalPuntos = () => {
        let total = 0;

        // 1. Sumar Pichichis
        total += calcularPuntosPichichi(prediccionesExtra.pichichiMundial, resultadosOficiales.pichichiMundial);
        total += calcularPuntosPichichi(prediccionesExtra.pichichiEspaña, resultadosOficiales.pichichiEspaña);

        // 2. Sumar Fase de Grupos
        partidosPorra.forEach(p => {
            total += calcularPuntosPartido_cabecera(p.id, p.pronostico);
        });

        // 3. Sumar España
        Object.keys(golesEspaña).forEach(id => {
            const goles = golesEspaña[id];
            total += calcularPuntosEspaña(id, goles.local, goles.visitante);
        });

        // 4. Sumar Fase Final
        Object.entries(partidosFinal || {}).forEach(([fase, lista]) => {
            lista.forEach(p => {
                total += calcularPuntosFaseFinal(p.id, ganadoresFaseFinal[p.id], fase);
            });
        });

        // 5. Sumar Clasificaciones de Grupos
        Object.keys(clasificaciones).forEach(grupo => {
            [1, 2].forEach(pos => {
                total += calcularPuntosClasificacion(grupo, pos, clasificaciones[grupo]?.[pos]);
            });
        });

        // 6. Sumar Mejores Terceros
        terceros.forEach((fila) => {
            total += calcularPuntosTerceros(fila.grupo, fila.pais);
        });

        return total;
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

                const resPorra = await fetch(`${API_URL}/porra/${username}`);

                const resAdmin = await fetch(`${API_URL}/admin/resultados`);
                if (resAdmin.ok) {
                    const dataAdmin = await resAdmin.json();
                    setResultadosOficiales(dataAdmin);
                }

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

    // 2. GUARDADO DE DATOS
    const guardarPorra = async () => {
        try {
            const payload = {
                username: username,
                partidosPorra,
                clasificaciones,
                terceros,
                ganadoresFaseFinal,
                partidosFinal,
                golesEspaña,
                pichichiMundial: prediccionesExtra.pichichiMundial,
                pichichiEspaña: prediccionesExtra.pichichiEspaña
            };

            const response = await fetch(`${API_URL}/porra`, {
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

    // ESTILOS COMUNES
    const estilos1X2 = {
        cabecera: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }
    };

    const estiloTituloSeccion = {
        cursor: 'pointer',
        background: '#F9FAFB',
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

    const puntosTotales = calcularTotalPuntos();

    return (
        <div style={{ marginTop: '20px' }}>
            <div style={estilos1X2.cabecera}>
                <div>
                    {/* Ocultamos el saludo si estamos en modo lectura */}
                    {!esSoloLectura && <h2>👋 ¡Hola, {username}!</h2>}

                    {/* Ocultamos todo el párrafo de estado si estamos en modo lectura */}
                    {!esSoloLectura && (
                        <p style={{ color: bloqueado ? '#6B7280' : '#10b981', fontWeight: 'bold' }}>
                            {bloqueado ? '🔒 Porra Guardada (Modo Lectura)' : '📝 Porra en Edición...'}
                        </p>
                    )}
                </div>

                {/* Ocultamos los botones de control si estamos en modo solo lectura */}
                {!esSoloLectura && (
                    dentroDePlazo ? (
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
                    )
                )}
            </div>

            <div style={{ padding: '15px', background: '#D1FAE5', borderRadius: '10px', textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#065F46' }}>Tu Puntuación Actual: {puntosTotales} pts</h2>
            </div>

            {/* SECCIÓN 1: FASE DE GRUPOS */}
            <h3 onClick={() => toggleSeccion('faseGrupos')} style={estiloTituloSeccion}>
                1. Fase de Grupos {seccionesVisibles.faseGrupos ? '▲' : '▼'}
            </h3>

            {seccionesVisibles.faseGrupos && (
                <>
                    {grupos.map((grupo) => (
                        <div key={grupo.grupo} style={{ border: '2px solid #FCD34D', borderRadius: '10px', padding: '15px', marginBottom: '25px', background: '#FFFFFF', opacity: bloqueado ? 0.8 : 1 }}>
                            <h3 style={{ color: '#92400E', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid #FCD34D' }}>Grupo {grupo.grupo}</h3>

                            {/* Cabecera de la "tabla" */}
                            <div style={{ display: 'flex', fontWeight: 'bold', paddingBottom: '10px', fontSize: '12px', color: '#666' }}>
                                <span style={{ flex: 1 }}>Partido</span>
                                <span style={{ width: '120px', textAlign: 'center' }}>Pronóstico</span>
                                <span style={{ width: '60px', textAlign: 'center' }}>Pts</span>
                            </div>

                            {grupo.partidos.map((p) => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', borderBottom: '1px solid #f0f0f0' }}>
                                    <span style={{ flex: 1 }}>{p.equipoLocal} vs {p.equipoVisitante}</span>

                                    <div style={{ display: 'flex', gap: '5px', width: '120px', justifyContent: 'center' }}>
                                        {['1', 'X', '2'].map(val => {
                                            const pronosticoActual = partidosPorra.find(po => Number(po.id) === Number(p.id))?.pronostico;
                                            const estaSeleccionado = pronosticoActual === val;

                                            return (
                                                <button
                                                    key={val}
                                                    disabled={bloqueado}
                                                    style={{
                                                        padding: '5px 10px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ccc',
                                                        cursor: bloqueado ? 'not-allowed' : 'pointer',
                                                        background: estaSeleccionado ? '#FCD34D' : 'white',
                                                        color: 'black'
                                                    }}
                                                    onClick={() => seleccionarPronostico(p.id, val)}
                                                >
                                                    {val}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Nueva columna de Puntos */}
                                    <div style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: '#059669' }}>
                                        {calcularPuntosPartido(p.id, partidosPorra.find(po => Number(po.id) === Number(p.id))?.pronostico)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}
                </>
            )}

            {/* 2. PARTIDOS DE ESPAÑA */}
            <h3 onClick={() => toggleSeccion('partidosEspaña')} style={estiloTituloSeccion}>
                2. Partidos de España {seccionesVisibles.partidosEspaña ? '▲' : '▼'}
            </h3>

            {seccionesVisibles.partidosEspaña && (
                <div style={{ padding: '15px', border: '2px solid #f70000', borderRadius: '10px', marginBottom: '25px', background: '#FFFFFF', opacity: bloqueado ? 0.8 : 1 }}>

                    {/* Cabecera */}
                    <div style={{ display: 'flex', fontWeight: 'bold', paddingBottom: '10px', fontSize: '12px', color: '#666' }}>
                        <span style={{ flex: 1 }}>Partido</span>
                        <span style={{ width: '130px', textAlign: 'center' }}>Pronóstico</span>
                        <span style={{ width: '60px', textAlign: 'center' }}>Pts</span>
                    </div>

                    {partidosEspaña && partidosEspaña.length > 0 ? (
                        partidosEspaña.map((p) => (
                            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f0f0f0' }}>
                                <span style={{ flex: 1, fontWeight: 'bold' }}>{p.equipoLocal} vs {p.equipoVisitante}</span>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '130px', justifyContent: 'center' }}>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="-"
                                        disabled={bloqueado}
                                        value={golesEspaña[p.id]?.local || ''}
                                        style={{ width: '40px', padding: '8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc', background: bloqueado ? '#f3f4f6' : 'white' }}
                                        onChange={(e) => manejarGolesEspaña(p.id, 'local', e.target.value)}
                                    />
                                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>-</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="-"
                                        disabled={bloqueado}
                                        value={golesEspaña[p.id]?.visitante || ''}
                                        style={{ width: '40px', padding: '8px', textAlign: 'center', borderRadius: '4px', border: '1px solid #ccc', background: bloqueado ? '#f3f4f6' : 'white' }}
                                        onChange={(e) => manejarGolesEspaña(p.id, 'visitante', e.target.value)}
                                    />
                                </div>

                                {/* Nueva columna de Puntos */}
                                <div style={{ width: '60px', textAlign: 'center', fontWeight: 'bold', color: '#059669' }}>
                                    {calcularPuntosEspaña(
                                        p.id, golesEspaña[p.id]?.local, golesEspaña[p.id]?.visitante
                                    )}
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
                3. Clasificación Final de Grupos {seccionesVisibles.clasificacionFinal ? '▲' : '▼'}
            </h3>

            {seccionesVisibles.clasificacionFinal && (
                <div style={{ padding: '20px', background: '#FFFFFF', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #E5E7EB', opacity: bloqueado ? 0.8 : 1 }}>
                    <h4 style={{ color: '#92400E', borderBottom: '2px solid #FCD34D', paddingBottom: '8px', marginBottom: '20px' }}>🏆 Mejores Clasificados</h4>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                        {grupos.map((grupo) => (
                            <div key={grupo.grupo} style={{ padding: '15px', borderRadius: '8px', background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                    <strong style={{ color: '#4B5563' }}>Grupo {grupo.grupo}</strong>
                                    <span style={{ fontSize: '12px', color: '#666' }}>Pts</span>
                                </div>
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
                                        {/* Columna de puntos */}
                                        <div style={{ width: '40px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                            {calcularPuntosClasificacion(grupo.grupo, pos, clasificaciones[grupo.grupo]?.[pos])}
                                        </div>
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
                            <div style={{ width: '50px', textAlign: 'center' }}>PTS</div>
                        </div>
                        {terceros.map((fila, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', background: index % 2 === 0 ? '#FFFFFF' : '#FFFDF2', borderTop: '1px solid #FDE68A' }}>
                                {/* Selector de Grupo */}
                                <select
                                    disabled={bloqueado}
                                    style={{ flex: 1, padding: '10px', border: 'none', background: 'transparent' }}
                                    onChange={(e) => manejarTerceros(index, 'grupo', e.target.value)}
                                    value={fila.grupo}
                                >
                                    <option value="">Seleccionar Grupo</option>
                                    {grupos
                                        .filter(g => {
                                            // Comprobamos si este grupo ya ha sido seleccionado en OTRA fila distinta a la actual
                                            const grupoYaSeleccionado = terceros.some((t, idx) => idx !== index && t.grupo === g.grupo);
                                            // Si ya está seleccionado en otra fila, lo ocultamos (retornamos false)
                                            return !grupoYaSeleccionado;
                                        })
                                        .map(g => <option key={g.grupo} value={g.grupo}>Grupo {g.grupo}</option>)
                                    }
                                </select>

                                {/* Selector de País */}
                                <select
                                    disabled={bloqueado}
                                    style={{ flex: 1, padding: '10px', border: 'none', borderLeft: '1px solid #FDE68A', background: 'transparent' }}
                                    onChange={(e) => manejarTerceros(index, 'pais', e.target.value)}
                                    value={fila.pais}
                                >
                                    <option value="">Seleccionar País</option>
                                    {fila.grupo && grupos.find(g => g.grupo === fila.grupo)?.partidos
                                        .flatMap(p => [p.equipoLocal, p.equipoVisitante])
                                        .filter((v, i, a) => a.indexOf(v) === i) // Elimina duplicados base de los partidos
                                        .filter(pais => {
                                            // Obtenemos los equipos guardados en el 1º y 2º puesto del grupo actual
                                            const elegidosGrupo = Object.values(clasificaciones[fila.grupo] || {});
                                            // Solo permitimos mostrar el país si NO está incluido en esos dos puestos
                                            return !elegidosGrupo.includes(pais);
                                        })
                                        .map(pais => <option key={pais} value={pais}>{pais}</option>)
                                    }
                                </select>

                                {/* Columna de puntos */}
                                <div style={{ width: '40px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                    {calcularPuntosTerceros(fila.grupo, fila.pais)}
                                </div>
                            </div>
                        ))}
                    </div>

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
                4. Fase Final {seccionesVisibles.faseFinal ? '▲' : '▼'}
            </h3>

            {seccionesVisibles.faseFinal && partidosFinal && (
                <div style={{ padding: '15px', opacity: bloqueado ? 0.8 : 1 }}>
                    {Object.entries(partidosFinal).map(([fase, listaPartidos]) => (
                        <div key={fase} style={{ marginBottom: '25px' }}>
                            <h4 style={{ textTransform: 'capitalize', color: '#92400E', borderBottom: '2px solid #FCD34D', display: 'flex', justifyContent: 'space-between' }}>
                                {fase}
                                <span style={{ fontSize: '12px', color: '#666' }}>Pts</span>
                            </h4>
                            {listaPartidos.map((p) => {
                                const equipoLocal = obtenerEquipo(p.local);
                                const equipoVisitante = obtenerEquipo(p.visitante);

                                return (
                                    <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #eee', background: '#f9f9f9', borderRadius: '4px', marginBottom: '5px' }}>
                                        <span style={{ fontSize: '0.8rem', color: '#666', width: '60px' }}>{p.fecha}</span>
                                        <div style={{ display: 'flex', gap: '10px', flex: 1, justifyContent: 'center' }}>
                                            <button
                                                disabled={bloqueado}
                                                style={{ background: ganadoresFaseFinal[p.id] === equipoLocal ? '#FCD34D' : 'white', border: '1px solid #ccc', padding: '5px 10px', cursor: bloqueado ? 'not-allowed' : 'pointer', borderRadius: '4px', flex: 1 }}
                                                onClick={() => seleccionarGanador(p.id, equipoLocal)}
                                            >
                                                {equipoLocal}
                                            </button>
                                            <span>vs</span>
                                            <button
                                                disabled={bloqueado}
                                                style={{ background: ganadoresFaseFinal[p.id] === equipoVisitante ? '#FCD34D' : 'white', border: '1px solid #ccc', padding: '5px 10px', cursor: bloqueado ? 'not-allowed' : 'pointer', borderRadius: '4px', flex: 1 }}
                                                onClick={() => seleccionarGanador(p.id, equipoVisitante)}
                                            >
                                                {equipoVisitante}
                                            </button>
                                        </div>
                                        {/* Columna de puntos */}
                                        <div style={{ width: '40px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                            {calcularPuntosFaseFinal(p.id, ganadoresFaseFinal[p.id],
                                                fase // <--- Pasamos la fase actual del bucle
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
                5. Pichichis {seccionesVisibles.pichichis ? '▲' : '▼'}
            </h3>
            {seccionesVisibles.pichichis && (
                <div style={{ padding: '20px', backgroundColor: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb', marginTop: '10px', opacity: bloqueado ? 0.8 : 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {[
                            { title: "General del Mundial", name: "pichichiMundial", value: prediccionesExtra.pichichiMundial },
                            { title: "Selección Española", name: "pichichiEspaña", value: prediccionesExtra.pichichiEspaña }
                        ].map((item, index) => (
                            <div key={index} style={{ display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                    <h4 style={{ margin: 0, color: '#374151', fontSize: '14px' }}>{item.title}</h4>
                                    <span style={{ fontSize: '12px', color: '#666' }}>Pts</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <input
                                        name={item.name}
                                        disabled={bloqueado}
                                        placeholder="Nombre del jugador..."
                                        value={item.value || ''}
                                        onChange={manejarExtra}
                                        style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: '1px solid #d1d5db', background: bloqueado ? '#e5e7eb' : 'white' }}
                                    />
                                    <div style={{ width: '30px', textAlign: 'right', fontWeight: 'bold', color: '#059669' }}>
                                        {item.name === 'pichichiMundial'
                                            ? calcularPuntosPichichi(prediccionesExtra.pichichiMundial, resultadosOficiales.pichichiMundial)
                                            : calcularPuntosPichichi(prediccionesExtra.pichichiEspaña, resultadosOficiales.pichichiEspaña)
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* BOTÓN DE GUARDAR (Solo aparece si NO está bloqueado) */}
            {!bloqueado && (
                <button
                    style={{ ...estilos.btnSubmit, background: '#10b981', marginTop: '25px', width: '100%', cursor: 'pointer' }}
                    onClick={guardarPorra}
                >
                    💾 Guardar Quiniela
                </button>
            )}
        </div>
    );
}

export default Predicciones;
