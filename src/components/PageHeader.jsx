import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, description, icon: Icon, onBack, children }) => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (typeof onBack === 'string') navigate(onBack);
    else if (typeof onBack === 'function') onBack();
    else navigate(-1);
  };

  return (
    <div className="page-header-container fade-in">
      <div className="page-header-left">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {onBack && (
            <button 
              onClick={handleBackClick}
              className="btn btn-outline"
              style={{ padding: '0.5rem', borderRadius: 'var(--radius-md)' }}
              aria-label="Voltar"
              title="Voltar"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {Icon && (
            <div style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: 'var(--primary-glow)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <Icon size={22} color="var(--primary-color)" />
            </div>
          )}
          
          <div>
            <h1 className="page-header-title">{title}</h1>
            {description && <p className="page-header-subtitle">{description}</p>}
          </div>
        </div>
      </div>
      
      {children && (
        <div className="page-header-actions">
          {children}
        </div>
      )}
    </div>
  );
};

export default PageHeader;
