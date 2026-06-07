import React from 'react';

function Reglas() {
    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.6' }}>
            <h2 style={{ color: '#2c3e50', borderBottom: '2px solid #3498db', paddingBottom: '10px' }}>
                📜 Reglas de la Porra - Mundial 2026
            </h2>
            <p>¡Bienvenido a la porra! Aquí tienes el sistema de puntuación para competir por el primer puesto. ¡Mucha suerte!</p>

            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#2980b9' }}>1. Fase de Grupos</h3>
                <ul>
                    <li><strong>Resultado 1X2:</strong> 1 punto por acertar el ganador o el empate en cualquiera de los 72 partidos de la fase de grupos.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#2980b9' }}>2. Partidos de España</h3>
                <ul>
                    <li><strong>Resultado exacto:</strong> 5 puntos.</li>
                    <li><strong>Diferencia de goles:</strong> 3 puntos (si aciertas la diferencia de goles, aunque el resultado exacto sea distinto, ej: pronóstico 3-1, resultado real 2-0).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#2980b9' }}>3. Clasificación Final de Grupos</h3>
                <ul>
                    <li>3 puntos por acertar equipo y posición exacta (1º o 2º).</li>
                    <li>1 punto por acertar que el equipo se clasifica, pero fallar la posición.</li>
                    <li>Nota: No se otorgan puntos por el tercer clasificado.</li>
                    <li><strong>Mejores terceros:</strong> 3 puntos por cada equipo acertado (sin importar el orden).</li>
                </ul>
            </section>

            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#2980b9' }}>4. Fase Final</h3>
                <ul>
                    <li><strong>Dieciseisavos:</strong> 3 puntos por acierto de ganador/empate/perdedor.</li>
                    <li><strong>Octavos:</strong> 4 puntos por acierto de ganador/empate/perdedor.</li>
                    <li><strong>Cuartos:</strong> 6 puntos por acierto de ganador/empate/perdedor.</li>
                    <li><strong>Semifinales:</strong> 7 puntos por acierto de ganador/empate/perdedor.</li>
                    <li><strong>Final:</strong> 10 puntos por acertar el ganador del Mundial.</li>
                </ul>
            </section>

            <section style={{ marginBottom: '20px' }}>
                <h3 style={{ color: '#2980b9' }}>5. Pichichis</h3>
                <ul>
                    <li><strong>Pichichi del Mundial:</strong> 5 puntos.</li>
                    <li><strong>Pichichi español:</strong> 5 puntos.</li>
                </ul>
            </section>
        </div>
    );
}

export default Reglas;