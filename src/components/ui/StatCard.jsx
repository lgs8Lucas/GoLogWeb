import React from 'react';
import InfoTip from './InfoTip';
import './ui.css';

const fmt = (value, decimals) => (typeof value === 'number'
  ? value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  : value);

/**
 * Card de indicador. `value` nulo/indefinido exibe "sem dados" (nunca um zero fabricado).
 * `info` aparece num ⓘ ao lado do rótulo — use para a fórmula e a fonte do número.
 */
const StatCard = ({ label, value, unit, prefix, decimals = 0, icon: Icon, tone = 'neutral', footer, info, loading = false, onClick, emptyText = 'sem dados' }) => {
  const empty = value === null || value === undefined || Number.isNaN(value);
  // div com role=button: o card pode conter o botão ⓘ (botão dentro de botão é HTML inválido)
  const clickable = onClick ? {
    role: 'button',
    tabIndex: 0,
    onClick: (e) => { if (!e.target.closest('.ui-infotip')) onClick(e); },
    onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(e); } }
  } : {};
  return (
    <div className={`ui-stat ui-stat--${tone} ${onClick ? 'is-clickable' : ''}`} {...clickable}>
      <div className="ui-stat__head">
        {Icon && <span className="ui-stat__icon"><Icon size={18} /></span>}
        <span className="ui-stat__label">{label}</span>
        {info && <InfoTip title={label}>{info}</InfoTip>}
      </div>
      {loading ? (
        <div className="ui-skeleton ui-skeleton--value" />
      ) : (
        <div className={`ui-stat__value ${empty ? 'is-empty' : ''}`}>
          {!empty && prefix && <small>{prefix}</small>}
          {empty ? emptyText : fmt(value, decimals)}
          {!empty && unit && <small>{unit}</small>}
        </div>
      )}
      {footer && <div className="ui-stat__footer">{footer}</div>}
    </div>
  );
};

export default StatCard;
