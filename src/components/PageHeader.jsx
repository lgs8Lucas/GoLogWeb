import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PageHeader = ({ title, description, icon: Icon, onBack, children }) => {
  const navigate = useNavigate();

  return (
    <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {onBack && (
          <button 
            onClick={() => {
              if (typeof onBack === 'string') navigate(onBack);
              else if (typeof onBack === 'function') onBack();
              else navigate(-1);
            }}
            className="back-button"
            style={{ 
              background: 'transparent', 
              border: '1px solid var(--border-color)', 
              borderRadius: '8px', 
              padding: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-color)',
              marginRight: '0.5rem'
            }}
            aria-label="Voltar"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        
        {Icon && (
          <div style={{ 
            width: '48px', height: '48px', 
            borderRadius: '8px', 
            backgroundColor: 'var(--border-color)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <Icon size={24} color="var(--primary-color)" />
          </div>
        )}
        
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-color)', margin: 0 }}>{title}</h1>
          {description && <p style={{ fontSize: '0.875rem', color: 'var(--text-light)', margin: 0 }}>{description}</p>}
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
