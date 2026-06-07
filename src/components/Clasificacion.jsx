import React, { useState, useEffect } from 'react';
import * as Flags from 'country-flag-icons/react/3x2';

function Clasificacion() {
    const [grupos, setGrupos] = useState([]);

    useEffect(() => {
        fetch('http://localhost:5000/api/clasificacion')
            .then(res => res.json())
            .then(data => {
                // 'data' será el objeto con los grupos y sus equipos ordenados
                setGrupos(data);
            });
    }, []);

    return (
        <div style={{ padding: '20px' }}>
            <h2>📊 Clasificación Mundial 2026</h2>
            {grupos.map(grupo => (
                <div key={grupo.grupo} style={{ marginBottom: '30px', border: '1px solid #ccc', borderRadius: '8px', overflow: 'hidden' }}>
                    <h3 style={{ background: '#eee', margin: 0, padding: '10px' }}>Grupo {grupo.grupo}</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9f9f9' }}>
                                <th>Equipo</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>DG</th><th>Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grupo.equipos.map(eq => {
                                // Buscamos el componente dinámicamente
                                const Flag = Flags[eq.codigo];
                                return (
                                    <tr key={eq.pais} style={{ textAlign: 'center', borderTop: '1px solid #eee' }}>
                                        <td style={{ textAlign: 'left', padding: '8px', display: 'flex', alignItems: 'center' }}>
                                            <div style={{ width: '25px', marginRight: '10px' }}>
                                                {/* Si Flag existe, lo renderizamos, si no, mostramos el código como texto */}
                                                {Flag ? <Flag /> : <span>{" "}</span>}
                                            </div>
                                            {eq.pais}
                                        </td>
                                        <td>{eq.pj}</td><td>{eq.g}</td><td>{eq.e}</td><td>{eq.p}</td><td>{eq.dg}</td><td>{eq.pts}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ))}
        </div>
    );
}

export default Clasificacion;