import React from 'react';
import './ui.css';

/** Card de seção com cabeçalho padrão (ícone, título, descrição e ações). */
const SectionCard = ({ icon: Icon, title, description, actions, children, className = '', bodyClassName = '', badge }) => (
  <section className={`ui-section ${className}`}>
    {(title || actions) && (
      <header className="ui-section__head">
        <div className="ui-section__title">
          {Icon && <span className="ui-section__icon"><Icon size={18} /></span>}
          <div>
            <h2>{title}{badge}</h2>
            {description && <p>{description}</p>}
          </div>
        </div>
        {actions && <div className="ui-section__actions">{actions}</div>}
      </header>
    )}
    <div className={`ui-section__body ${bodyClassName}`}>{children}</div>
  </section>
);

export default SectionCard;
