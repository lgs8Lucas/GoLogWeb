import React, { useState } from 'react';
import '../styles/Auth.css';
import LogoBranco from '../assets/LogoBranco.png';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleMode = () => setIsLogin(!isLogin);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(isLogin ? "Logando..." : "Cadastrando...");
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
            <h2>{isLogin ? "Bem-vindo ao GoLog" : "Crie sua conta"}</h2>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="form-group fade-in">
                <label className="form-label" htmlFor="name">Nome completo</label>
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  placeholder="Seu nome completo"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="exemplo@gmail.com"
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
                required
              />
            </div>

            {isLogin && (
              <div className="form-options fade-in">
                <label className="checkbox-group">
                  <input type="checkbox" defaultChecked />
                  <span>Manter conectado.</span>
                </label>
                <a href="#forgot" className="forgot-link">Esqueci minha senha.</a>
              </div>
            )}

            <button type="submit" className="submit-btn fade-in">
              {isLogin ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <div className="toggle-mode">
            {isLogin ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
            <button type="button" onClick={toggleMode} className="toggle-btn">
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
