import React from 'react';
import './ui.css';

/** Abas padrão. items: [{ id, label, icon, count }] */
const Tabs = ({ items, value, onChange, ariaLabel = 'Seções' }) => (
  <div className="ui-tabs" role="tablist" aria-label={ariaLabel}>
    {items.map(({ id, label, icon: Icon, count }) => (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={value === id}
        className={`ui-tabs__tab ${value === id ? 'is-active' : ''}`}
        onClick={() => onChange(id)}
      >
        {Icon && <Icon size={16} />}
        <span>{label}</span>
        {count !== undefined && count !== null && <span className="ui-tabs__count">{count}</span>}
      </button>
    ))}
  </div>
);

export default Tabs;
