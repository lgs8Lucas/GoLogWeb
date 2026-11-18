import { decodePolyline } from './polyline';

const toRad = (d) => (d * Math.PI) / 180;

/** Distância em km de uma polilinha [[lat, lng], ...] (Haversine, mesmo cálculo do backend). */
export const polylineKm = (coords = []) => {
  let km = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lon1] = coords[i - 1];
    const [lat2, lon2] = coords[i];
    const a = Math.sin(toRad(lat2 - lat1) / 2) ** 2
      + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
    km += 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  return km;
};

/**
 * Tonelada·km planejada: soma, trecho a trecho do plano (polilinha de chegada de cada parada), das toneladas
 * a bordo × km do trecho. Carga a bordo com a mesma regra do backend (TripLoad): sai com as entregas, desconta cada
 * entrega atendida e soma cada coleta (com as entregas filhas dela, se a coleta é da própria viagem).
 *
 * @param shipments remessas da viagem, já em ordem de parada, com `routeStop.routePlanned`
 * @returns t·km planejada, ou null se o plano não tem os trechos por parada
 */
export const plannedTonKm = (shipments = []) => {
  const legs = shipments.map(s => polylineKm(s.routeStop?.routePlanned ? decodePolyline(s.routeStop.routePlanned) : []));
  if (!legs.some(km => km > 0)) return null;

  const w = (s) => Number(s.weight) || 0;
  const collectIds = new Set(shipments.filter(s => s.typeOperation === 'COLETA').map(s => s.id));
  const parentOf = (s) => s.operationOrigem?.id || s.operationOrigemId;
  const childKgByCollect = {};
  let onboardKg = 0;
  shipments.forEach(s => {
    if (s.typeOperation !== 'ENTREGA') return;
    const parent = parentOf(s);
    if (parent && collectIds.has(parent)) childKgByCollect[parent] = (childKgByCollect[parent] || 0) + w(s);
    else onboardKg += w(s);
  });

  let tonKm = 0;
  shipments.forEach((s, i) => {
    tonKm += (onboardKg / 1000) * legs[i];
    if (s.typeOperation === 'ENTREGA') onboardKg = Math.max(0, onboardKg - w(s));
    else if (s.typeOperation === 'COLETA') onboardKg += childKgByCollect[s.id] ?? w(s);
  });
  return tonKm;
};
