import React from 'react';
import { Clock, User, MapPin } from 'lucide-react';
import '../styles/OccurrenceCard.css';
import { getOccurrenceMeta, formatOccurrenceDate } from '../utils/occurrence';
import OccurrenceAttachment from './OccurrenceAttachment';


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

      <OccurrenceAttachment value={occurrence.attachment} />
    </article>
  );
};

export default OccurrenceCard;
