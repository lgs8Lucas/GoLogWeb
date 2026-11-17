/**
 * Status de viagem derivado das paradas (remessas) vinculadas ao transporte.
 * O backend não expõe um status próprio do transporte, então a fonte da verdade
 * é o status de cada remessa: PENDENTE | AGUARDANDO_INICIO | INICIADO | FINALIZADO.
 */

const DONE = new Set(['FINALIZADO', 'DELIVERED', 'CONCLUIDO', 'COMPLETED']);
const CANCELLED = new Set(['CANCELADO', 'CANCELLED']);
const STARTED = new Set(['INICIADO', 'IN_TRANSIT', 'EM_TRANSITO', 'EM_VIAGEM', 'IN_DELIVERY', 'EM_ENTREGA']);

export const isStopDone = (s) => DONE.has(s?.status);

export const TRIP_STATUS = {
  PLANNED: { key: 'PLANNED', label: 'Aguardando início', tone: 'pending' },
  IN_PROGRESS: { key: 'IN_PROGRESS', label: 'Em viagem', tone: 'info' },
  DELAYED: { key: 'DELAYED', label: 'Atrasado', tone: 'danger' },
  FINISHED: { key: 'FINISHED', label: 'Concluída', tone: 'concluido' }
};

export const getTripStatus = (shipments = [], transport = {}) => {
  const relevant = shipments.filter(s => !CANCELLED.has(s?.status));
  if (relevant.length === 0) return TRIP_STATUS.PLANNED;

  const doneCount = relevant.filter(isStopDone).length;
  if (doneCount === relevant.length) return TRIP_STATUS.FINISHED;

  const started = doneCount > 0 || relevant.some(s => STARTED.has(s?.status));
  if (!started) return TRIP_STATUS.PLANNED;

  return transport?.timeStopped > 0 ? TRIP_STATUS.DELAYED : TRIP_STATUS.IN_PROGRESS;
};

export const isTripFinished = (shipments, transport) =>
  getTripStatus(shipments, transport).key === TRIP_STATUS.FINISHED.key;
