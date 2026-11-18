import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Paperclip, Download, X, ExternalLink } from 'lucide-react';
import '../styles/OccurrenceCard.css';
import { parseAttachment } from '../utils/occurrence';

const DownloadLink = ({ attachment, children }) => (
  <a
    className="occ-attachment__action"
    href={attachment.src}
    download={attachment.fileName}
    target="_blank"
    rel="noopener noreferrer"
    title="Baixar anexo"
  >
    <Download size={13} /> {children}
  </a>
);

/**
 * Anexo de uma ocorrência (assinatura SVG, imagem, link ou texto).
 * `compact` mostra só a miniatura, para uso em tabelas; a ampliação
 * permite baixar o arquivo nos dois modos.
 */
const OccurrenceAttachment = ({ value, compact = false, emptyText = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const attachment = useMemo(() => parseAttachment(value), [value]);

  if (!attachment) return emptyText;

  if (attachment.kind === 'text') {
    if (compact) {
      return <span className="occ-attachment__text" title={attachment.text}><Paperclip size={12} /> {attachment.text}</span>;
    }
    return (
      <div className="occ-attachment">
        <span className="occ-attachment__label"><Paperclip size={13} /> {attachment.label}</span>
        <p className="occ-attachment__text">{attachment.text}</p>
      </div>
    );
  }

  if (attachment.kind === 'link') {
    const link = (
      <a className="occ-attachment__link" href={attachment.src} target="_blank" rel="noopener noreferrer">
        <Paperclip size={13} /> {compact ? 'Abrir' : attachment.label} <ExternalLink size={12} />
      </a>
    );
    return compact ? link : <div className="occ-attachment">{link}</div>;
  }

  const thumb = (
    <button
      type="button"
      className={`occ-attachment__thumb${compact ? ' occ-attachment__thumb--compact' : ''}`}
      onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}
      title={`Ampliar ${attachment.label.toLowerCase()}`}
    >
      <img src={attachment.src} alt={attachment.label} loading="lazy" />
    </button>
  );

  const lightbox = isOpen && createPortal(
    <div className="occ-lightbox fade-in" onClick={() => setIsOpen(false)}>
      <div className="occ-lightbox__content" onClick={(e) => e.stopPropagation()}>
        <div className="occ-lightbox__header">
          <strong>{attachment.label}</strong>
          <div className="occ-lightbox__actions">
            <DownloadLink attachment={attachment}>Baixar</DownloadLink>
            <button type="button" className="modal-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="occ-lightbox__image">
          <img src={attachment.src} alt={attachment.label} />
        </div>
      </div>
    </div>,
    document.body
  );

  if (compact) {
    return <>{thumb}{lightbox}</>;
  }

  return (
    <div className="occ-attachment">
      <div className="occ-attachment__head">
        <span className="occ-attachment__label"><Paperclip size={13} /> {attachment.label}</span>
        <DownloadLink attachment={attachment}>Baixar</DownloadLink>
      </div>
      {thumb}
      {lightbox}
    </div>
  );
};

export default OccurrenceAttachment;
