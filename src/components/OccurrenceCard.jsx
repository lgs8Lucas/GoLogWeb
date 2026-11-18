import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Clock,
  User,
  MapPin,
  Paperclip,
  Download,
  X,
  ExternalLink
} from 'lucide-react';
import '../styles/OccurrenceCard.css';
import { getOccurrenceMeta, formatOccurrenceDate, parseAttachment } from '../utils/occurrence';


const AttachmentPreview = ({ attachment }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (attachment.kind === 'text') {
    return (
      <div className="occ-attachment">
        <span className="occ-attachment__label"><Paperclip size={13} /> {attachment.label}</span>
        <p className="occ-attachment__text">{attachment.text}</p>
      </div>
    );
  }

  if (attachment.kind === 'link') {
    return (
      <div className="occ-attachment">
        <a className="occ-attachment__link" href={attachment.src} target="_blank" rel="noopener noreferrer">
          <Paperclip size={13} /> {attachment.label} <ExternalLink size={12} />
        </a>
      </div>
    );
  }

  return (
    <div className="occ-attachment">
      <div className="occ-attachment__head">
        <span className="occ-attachment__label"><Paperclip size={13} /> {attachment.label}</span>
        <a
          className="occ-attachment__action"
          href={attachment.src}
          download={attachment.fileName}
          target="_blank"
          rel="noopener noreferrer"
          title="Baixar anexo"
        >
          <Download size={13} /> Baixar
        </a>
      </div>
      <button type="button" className="occ-attachment__thumb" onClick={() => setIsOpen(true)} title="Ampliar">
        <img src={attachment.src} alt={attachment.label} loading="lazy" />
      </button>

      {isOpen && createPortal(
        <div className="occ-lightbox fade-in" onClick={() => setIsOpen(false)}>
          <div className="occ-lightbox__content" onClick={(e) => e.stopPropagation()}>
            <div className="occ-lightbox__header">
              <strong>{attachment.label}</strong>
              <button type="button" className="modal-close-btn" onClick={() => setIsOpen(false)} aria-label="Fechar">
                <X size={20} />
              </button>
            </div>
            <div className="occ-lightbox__image">
              <img src={attachment.src} alt={attachment.label} />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

/**
 * Card de ocorrência: tipo, data/hora, emissor, parada vinculada,
 * descrição e anexo (assinatura SVG, imagem ou link).
 *
 * @param occurrence  item de GET /occurrence
 * @param shipment    entrega vinculada (opcional), para exibir cliente/parada
 * @param senderName  nome do emissor já resolvido (a listagem só traz senderId)
 */
const OccurrenceCard = ({ occurrence, shipment, senderName }) => {
  const meta = getOccurrenceMeta(occurrence.type);
  const Icon = meta.icon;
  const when = formatOccurrenceDate(occurrence);
  const attachment = useMemo(() => parseAttachment(occurrence.attachment), [occurrence.attachment]);
  const sender = occurrence.senderName || occurrence.sender?.name || senderName || 'Usuário não identificado';

  const stopLabel = shipment
    ? [
        shipment.routeStop?.sequenceOrder != null ? `Parada ${shipment.routeStop.sequenceOrder}` : null,
        shipment.customer?.legalName || 'Cliente'
      ].filter(Boolean).join(' · ')
    : null;

  return (
    <article className={`occ-card occ-card--${meta.tone}`}>
      <header className="occ-card__header">
        <span className="occ-card__type">
          <span className="occ-card__icon"><Icon size={15} /></span>
          {meta.label}
        </span>
        {when && (
          <time className="occ-card__time" dateTime={occurrence.dateTime || occurrence.createdAt}>
            <Clock size={13} /> {when}
          </time>
        )}
      </header>

      {occurrence.description && <p className="occ-card__description">{occurrence.description}</p>}

      <div className="occ-card__meta">
        <span><User size={13} /> {sender}</span>
        {stopLabel && <span><MapPin size={13} /> {stopLabel}</span>}
      </div>

      {attachment && <AttachmentPreview attachment={attachment} />}
    </article>
  );
};

export default OccurrenceCard;
