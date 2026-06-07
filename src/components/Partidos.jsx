import React, { useState, useEffect } from 'react';

function Partidos() {
    const [partidosGrupos, setPartidosGrupos] = useState([]);
    const [faseFinal, setFaseFinal] = useState({});

    // Control de qué secciones están abiertas
    const [seccionesVisibles, setSeccionesVisibles] = useState({
        faseGrupos: true,
        octavos: false,
        cuartos: false,
        semis: false,
        final: false
    });

    useEffect(() => {
        // Cargamos los partidos de grupos
        fetch('http://localhost:5000/api/partidos')
            .then(res => res.json())
            .then(data => setPartidosGrupos(data))
            .catch(err => console.error("Error al cargar partidos de grupos:", err));

        // Cargamos los partidos de la fase final (necesitarás este endpoint)
        fetch('http://localhost:5000/api/partidosFinal')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setFaseFinal(data[0].faseFinal || {});
                } else {
                    setFaseFinal(data.faseFinal || {});
                }
            })
            .catch(err => console.error("Error al cargar fase final:", err));
    }, []);

    const toggleSeccion = (seccion) => {
        setSeccionesVisibles(prev => ({ ...prev, [seccion]: !prev[seccion] }));
    };

    const estiloTituloSeccion = {
        cursor: 'pointer', background: '#F9FAFB', padding: '15px', borderRadius: '8px',
        border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginTop: '20px', marginBottom: '10px', color: '#374151'
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>⚽ Calendario y Resultados Oficiales</h2>

            {/* FASE DE GRUPOS */}
            <h3 onClick={() => toggleSeccion('faseGrupos')} style={estiloTituloSeccion}>
                Fase de Grupos {seccionesVisibles.faseGrupos ? '▲' : '▼'}
            </h3>
            {seccionesVisibles.faseGrupos && partidosGrupos.map(grupo => (
                <div key={grupo.grupo} style={{ marginBottom: '20px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <h4 style={{ background: '#eee', margin: 0, padding: '10px' }}>Grupo {grupo.grupo}</h4>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <tbody>
                            {grupo.partidos.map(p => (
                                <tr key={p.id} style={{ textAlign: 'center', borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{p.fecha}</td>
                                    <td style={{ padding: '8px' }}>{p.hora}</td>
                                    <td style={{ textAlign: 'right', paddingRight: '10px' }}>{p.equipoLocal}</td>
                                    <td><strong>{p.resultado || 'VS'}</strong></td>
                                    <td style={{ textAlign: 'left', paddingLeft: '10px' }}>{p.equipoVisitante}</td>
                                    <td style={{ padding: '8px' }}>{p.resultado}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ))}

            {/* RENDERIZADO DINÁMICO DE FASES FINALES */}
            {['dieciseisavos', 'octavos', 'cuartos', 'semifinales', 'final'].map((fase) => (
                <React.Fragment key={fase}>
                    <h3 onClick={() => toggleSeccion(fase)} style={estiloTituloSeccion}>
                        {fase.charAt(0).toUpperCase() + fase.slice(1)} {seccionesVisibles[fase] ? '▲' : '▼'}
                    </h3>
                    {/* Verifica que 'faseFinal[fase]' no sea undefined */}
                    {seccionesVisibles[fase] && faseFinal[fase] && (
                        <div style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
                            {/* Asegúrate de que los campos coincidan con tu JSON: local/visitante */}
                            {faseFinal[fase].map(p => (
                                <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px', borderBottom: '1px solid #eee' }}>
                                    <span>{p.fecha}</span>
                                    <span><strong>{p.local}</strong> {p.resultado || 'vs'} <strong>{p.visitante}</strong></span>
                                </div>
                            ))}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );
}

export default Partidos;