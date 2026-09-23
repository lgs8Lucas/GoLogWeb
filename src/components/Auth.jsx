import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, Truck } from 'lucide-react';
import { authService } from '../services/authService';
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
      setErrorMsg(error.response?.data?.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-left-brand">
        <div className="brand-glow-effect"></div>
        <div className="brand-content-box fade-in">
          <img src={LogoBranco} alt="GoLog TMS" className="brand-main-logo" />
          <h1 className="brand-headline">Plataforma Inteligente de Gestão de Transportes</h1>
          <p className="brand-description">
            Monitoramento em tempo real, roteirização avançada e controle sustentável de emissões de CO₂ para a sua frota.
          </p>
          <div className="brand-features-list">
            <div className="feature-item">
              <Truck size={18} color="var(--secondary-color)" />
              <span>Gestão Integrada de Frotas & Motoristas</span>
            </div>
            <div className="feature-item">
              <ShieldCheck size={18} color="var(--secondary-color)" />
              <span>Telemetria em Tempo Real & Alertas IoT</span>
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-form">
        <div className="auth-card-box fade-in">
          <div className="auth-header">
            <div className="brand-badge-small">GoLog TMS</div>
            <h2>Acesse sua conta</h2>
            <p>Insira suas credenciais corporativas para prosseguir</p>
          </div>

          <form className="auth-form-body" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="auth-error-banner fade-in">
                {errorMsg}
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="email">E-mail corporativo</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="usuario@golog.com.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Senha de acesso</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
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
            </div>

            <div className="auth-options">
              <label className="checkbox-label">
                <input type="checkbox" defaultChecked />
                <span>Manter sessão ativa</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert('Contate o administrador do sistema para redefinir sua senha.'); }} className="forgot-link">Esqueceu a senha?</a>
            </div>

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
              {isLoading ? (
                <span>Autenticando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-info">
            &copy; {new Date().getFullYear()} GoLog TMS. Todos os direitos reservados.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
