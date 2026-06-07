import React from 'react';

function LoginForm({ esRegistro, setEsRegistro, usernameInput, setUsernameInput, password, setPassword, manejarSubmit, estilos }) {
    return (
        <div style={{ maxWidth: '400px', margin: '0 auto', marginTop: '40px' }}>
            <h2>{esRegistro ? '📝 Crear Cuenta Nueva' : '🔑 Iniciar Sesión'}</h2>
            <form style={estilos.form} onSubmit={manejarSubmit}>
                <input
                    style={estilos.input}
                    type="text"
                    placeholder="Nombre de usuario"
                    required
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                />
                <input
                    style={estilos.input}
                    type="password"
                    placeholder="Contraseña"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button style={estilos.btnSubmit} type="submit">{esRegistro ? '🚀 Registrarme' : '🔓 Entrar'}</button>
            </form>
            <button style={estilos.enlace} onClick={() => { setEsRegistro(!esRegistro); setPassword(''); }}>
                {esRegistro ? '¿Ya tienes cuenta? Inicia sesión aquí' : '¿No tienes cuenta aún? Regístrate aquí'}
            </button>
        </div>
    );
}

export default LoginForm;