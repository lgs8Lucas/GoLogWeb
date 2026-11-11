import React from 'react';
import { Inbox } from 'lucide-react';
import './ui.css';

/** Estado vazio com orientação do próximo passo. */
const EmptyState = ({ icon: Icon = Inbox, title, description, action }) => (
  <div className="ui-empty">
    <span className="ui-empty__icon"><Icon size={26} /></span>
    {title && <strong>{title}</strong>}
    {description && <p>{description}</p>}
    {action && <div className="ui-empty__action">{action}</div>}
  </div>
);

export default EmptyState;
