import React, { useEffect, useRef, useState } from 'react';
import { Info } from 'lucide-react';
import './ui.css';

/** Ícone ⓘ que abre um balão com a explicação/metodologia (clique ou foco; fecha ao clicar fora). */
const InfoTip = ({ title, children, align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc); };
  }, [open]);

  return (
    <span className="ui-infotip" ref={ref}>
      <button type="button" className="ui-infotip__btn" onClick={() => setOpen(o => !o)} aria-label={title ? `Como é calculado: ${title}` : 'Mais informações'} aria-expanded={open}>
        <Info size={13} />
      </button>
      {open && (
        <span className={`ui-infotip__pop ui-infotip__pop--${align}`} role="tooltip">
          {title && <strong>{title}</strong>}
          <span>{children}</span>
        </span>
      )}
    </span>
  );
};

export default InfoTip;
