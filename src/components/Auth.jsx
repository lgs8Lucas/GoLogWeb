import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { userService } from '../services/userService';
import '../styles/Auth.css';
import LogoBranco from '../assets/LogoBranco.png';

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const token = await authService.login(email, password);
      localStorage.setItem('golog_token', token);
      navigate('/');
    } catch (error) {
      console.error("Erro na autenticação:", error);
      setErrorMsg(error.response?.data?.message || 'Falha na autenticação. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Painél esquerdo - Ilustrativo */}
      <div className="auth-image-panel">
        {/* TODO: Colocar imagem ilustrativa */}
        <div className="auth-brand-content fade-in">
          <img src={LogoBranco} alt="GoLog" className="auth-brand-logo" />
          <p className="brand-subtitle">
            Sistema multiplataforma para otimização logística e monitoramento de frotas com integração IoT.
          </p>
        </div>
      </div>

      {/* Painél direito - Formulário */}
      <div className="auth-form-panel">
        <div className="auth-card fade-in">
          <div className="form-header">
            <div className="user-avatar-placeholder">
              {/* Ícone padrão de usuário SVG */}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <h2>Acesso ao Painel</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {errorMsg && (
              <div
                className="form-group fade-in"
                style={{
                  color: errorMsg.includes('sucesso') ? '#28a745' : '#ff4d4d',
                  fontSize: '0.9rem',
                  marginBottom: '1rem',
                  textAlign: 'center'
                }}
              >
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="exemplo@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha</label>
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-options fade-in">
              <label className="checkbox-group">
                <input type="checkbox" defaultChecked />
                <span>Manter conectado.</span>
              </label>
              <a href="#forgot" className="forgot-link">Esqueci minha senha.</a>
            </div>

            <button type="submit" className="submit-btn fade-in" disabled={isLoading}>
              {isLoading ? 'Aguarde...' : "Entrar"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Auth;
