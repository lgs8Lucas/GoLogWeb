import React, { useState } from 'react';
import { Lightbulb, Info, AlertTriangle, X, ChevronDown } from 'lucide-react';
import './ui.css';

const ICONS = { tip: Lightbulb, info: Info, warning: AlertTriangle };
const storageKey = (id) => `golog_hint_${id}`;

const readDismissed = (id) => {
  if (!id) return false;
  try { return localStorage.getItem(storageKey(id)) === '1'; } catch { return false; }
};

/**
 * Dica contextual. Explica o efeito de um parâmetro ou o próximo passo do fluxo.
 *
 * - `id` persiste o "Entendi" por usuário (localStorage); sem `id` a dica não pode ser dispensada.
 * - `compact` mostra só o título e expande o texto ao clicar.
 */
const Hint = ({ id, title, children, tone = 'tip', compact = false, className = '' }) => {
  const [dismissed, setDismissed] = useState(() => readDismissed(id));
  const [open, setOpen] = useState(!compact);
  if (dismissed) return null;
  const Icon = ICONS[tone] || Lightbulb;

  const dismiss = () => {
    try { localStorage.setItem(storageKey(id), '1'); } catch { /* sem storage: some só nesta sessão */ }
    setDismissed(true);
  };

  return (
    <div className={`ui-hint ui-hint--${tone} ${className}`} role="note">
      <div className="ui-hint__icon"><Icon size={16} /></div>
      <div className="ui-hint__body">
        {title && (
          <button type="button" className="ui-hint__title" onClick={() => compact && setOpen(o => !o)} aria-expanded={open}>
            {title}
            {compact && <ChevronDown size={14} className={`ui-hint__chev ${open ? 'is-open' : ''}`} />}
          </button>
        )}
        {open && <div className="ui-hint__text">{children}</div>}
      </div>
      {id && (
        <button type="button" className="ui-hint__close" onClick={dismiss} title="Entendi, não mostrar de novo" aria-label="Dispensar dica">
          <X size={14} />
        </button>
      )}
    </div>
  );
};

export default Hint;
