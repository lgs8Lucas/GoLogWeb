import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/Map.css';

/**
 * Mapa operacional do GoLog (Leaflet + base OpenStreetMap em tom neutro).
 *
 * Substitui o Google Maps JS, que exigia chave de API e exibia "For development purposes only".
 * A interface de props é a mesma da versão anterior, então as telas não precisam mudar:
 *
 *   polylines: [{ id, coords: [[lat, lng], ...], color, label,
 *                 variant?: 'planned' | 'realized',   // realizado = trajeto da telemetria (tracejado, sem marcador de partida)
 *                 vehicle?: { coord: [lat, lng], label, at },   // última posição recebida por telemetria
 *                 stops: [{ coord: [lat, lng], type: 'COLETA'|'ENTREGA', label, status, sequence }] }]
 *
 * O enquadramento automático só acontece quando o conjunto de rotas muda: atualizações periódicas
 * (posição, trajeto realizado) não tiram o zoom que o usuário escolheu.
 *
 * Paradas são numeradas pela sequência da rota, coloridas por tipo (coleta/entrega) e esmaecidas quando
 * concluídas. Passar o mouse sobre uma rota a destaca.
 */
const DEFAULT_CENTER = [-22.3659, -47.3809]; // Araras/SP
const ROUTE_PALETTE = ['#2ab29b', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#0ea5e9', '#ec4899', '#84cc16', '#f97316', '#14b8a6'];

// Leaflet desenha em SVG por atributo: "var(--x, #hex)" não é resolvido, então usa o fallback hexadecimal
const resolveColor = (color, index) => {
  if (!color) return ROUTE_PALETTE[index % ROUTE_PALETTE.length];
  const m = /var\([^,]+,\s*([^)]+)\)/.exec(color);
  if (m) return m[1].trim();
  if (color.startsWith('var(')) return ROUTE_PALETTE[index % ROUTE_PALETTE.length];
  return color;
};

const toLatLng = (c) => {
  if (!c) return null;
  const lat = Array.isArray(c) ? c[0] : c.lat;
  const lng = Array.isArray(c) ? c[1] : c.lng;
  const nLat = Number(lat);
  const nLng = Number(lng);
  return Number.isFinite(nLat) && Number.isFinite(nLng) ? [nLat, nLng] : null;
};

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const stopIcon = (stop, idx, routeColor) => {
  const isCollect = stop.type === 'COLETA';
  const done = stop.status === 'FINALIZADO' || stop.status === 'CONCLUIDO';
  const seq = stop.sequence ?? idx + 1;
  const cls = `gl-stop ${isCollect ? 'gl-stop--collect' : 'gl-stop--delivery'} ${done ? 'gl-stop--done' : ''}`;
  return L.divIcon({
    className: 'gl-marker',
    html: `<div class="${cls}" style="--route:${routeColor}"><span>${done ? '✓' : seq}</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14]
  });
};

const startIcon = (routeColor) => L.divIcon({
  className: 'gl-marker',
  html: `<div class="gl-start" style="--route:${routeColor}"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M14.4 6 14 4H5v17h2v-7h5.6l.4 2h7V6z"/></svg></div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13]
});

const STALE_MINUTES = 15;

const timeAgo = (date) => {
  const min = Math.max(0, Math.round((Date.now() - date.getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  return h < 24 ? `há ${h}h${String(min % 60).padStart(2, '0')}` : `há ${Math.floor(h / 24)} dia(s)`;
};

const vehicleIcon = (routeColor, stale) => L.divIcon({
  className: 'gl-marker',
  html: `<div class="gl-vehicle ${stale ? 'gl-vehicle--stale' : ''}" style="--route:${routeColor}">`
    + '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M3 5h11v9h1.2l1.3-5H21l2 4v4h-2a2.5 2.5 0 0 1-5 0H9a2.5 2.5 0 0 1-5 0H3zm15.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2m-12 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2"/></svg>'
    + '</div>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -17]
});

const MapComponent = ({
  center = DEFAULT_CENTER,
  zoom = 13,
  polylines = [],
  className = 'map-container',
  interactive = true,
  showLegend = true
}) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const fitKeyRef = useRef(null);

  // Cria o mapa uma única vez
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return undefined;
    const map = L.map(containerRef.current, {
      center: toLatLng(center) || DEFAULT_CENTER,
      zoom,
      zoomControl: false,
      attributionControl: true,
      scrollWheelZoom: interactive,
      dragging: interactive,
      doubleClickZoom: interactive
    });
    // Tiles do OpenStreetMap (sem chave, funcionam em qualquer domínio); o tom neutro vem de filtro CSS em Map.css
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    if (interactive) L.control.zoom({ position: 'bottomright' }).addTo(map);
    layerRef.current = L.featureGroup().addTo(map);
    mapRef.current = map;

    // O container costuma mudar de tamanho (cards, modais, painel recolhível)
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redesenha rotas e paradas
  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();

    const bounds = [];
    polylines.forEach((poly, index) => {
      const color = resolveColor(poly.color, index);
      const path = (poly.coords || []).map(toLatLng).filter(Boolean);
      const realized = poly.variant === 'realized';

      if (path.length > 1) {
        // Contorno branco + linha colorida: legível sobre qualquer base
        const casing = L.polyline(path, { color: '#ffffff', weight: 8, opacity: 0.9, interactive: false });
        const line = L.polyline(path, { color, weight: 4.5, opacity: 0.9, lineJoin: 'round', dashArray: realized ? '2 9' : null, lineCap: 'round' });
        if (interactive) {
          line.on('mouseover', () => { line.setStyle({ weight: 7, opacity: 1 }); line.bringToFront(); });
          line.on('mouseout', () => line.setStyle({ weight: 4.5, opacity: 0.9 }));
          if (poly.label) line.bindTooltip(escapeHtml(poly.label), { sticky: true, className: 'gl-tooltip' });
        }
        group.addLayer(casing);
        group.addLayer(line);
        bounds.push(...path);
        if (!realized) group.addLayer(L.marker(path[0], { icon: startIcon(color), keyboard: false, title: 'Partida' }));
      }

      const vehiclePos = toLatLng(poly.vehicle?.coord);
      if (vehiclePos) {
        const at = poly.vehicle.at ? new Date(poly.vehicle.at) : null;
        const validAt = at && !Number.isNaN(at.getTime());
        const stale = !validAt || (Date.now() - at.getTime()) > STALE_MINUTES * 60000;
        bounds.push(vehiclePos);
        const marker = L.marker(vehiclePos, { icon: vehicleIcon(color, stale), zIndexOffset: 1000, title: 'Última posição' });
        if (interactive) {
          marker.bindPopup(
            `<div class="gl-popup"><span class="gl-popup__kind">Última posição${stale ? ' · sem sinal recente' : ''}</span>`
            + `<strong>${escapeHtml(poly.vehicle.label || poly.label || 'Veículo')}</strong>`
            + (validAt ? `<small>${at.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${timeAgo(at)}</small>` : '')
            + '</div>',
            { closeButton: false, className: 'gl-popup-wrap' }
          );
        }
        group.addLayer(marker);
      }

      (poly.stops || []).forEach((raw, idx) => {
        const stop = Array.isArray(raw) ? { coord: raw } : raw;
        const pos = toLatLng(stop?.coord);
        if (!pos) return;
        bounds.push(pos);
        const marker = L.marker(pos, { icon: stopIcon(stop, idx, color), riseOnHover: true });
        if (interactive) {
          const kind = stop.type === 'COLETA' ? 'Coleta' : stop.type === 'ENTREGA' ? 'Entrega' : 'Parada';
          marker.bindPopup(
            `<div class="gl-popup"><span class="gl-popup__kind gl-popup__kind--${stop.type === 'COLETA' ? 'collect' : 'delivery'}">${kind} · parada ${stop.sequence ?? idx + 1}</span>`
            + `<strong>${escapeHtml(stop.label || 'Sem identificação')}</strong>`
            + (stop.status ? `<small>${escapeHtml(stop.statusLabel || stop.status)}</small>` : '')
            + (poly.label ? `<small class="gl-popup__route">${escapeHtml(poly.label)}</small>` : '')
            + '</div>',
            { closeButton: false, className: 'gl-popup-wrap' }
          );
        }
        group.addLayer(marker);
      });
    });

    // Reenquadra só quando muda o conjunto de rotas (ou ao aparecerem pontos pela primeira vez)
    const fitKey = `${polylines.map(p => p.id).join('|')}#${bounds.length > 0}`;
    if (fitKeyRef.current !== fitKey) {
      fitKeyRef.current = fitKey;
      if (bounds.length > 0) {
        map.fitBounds(L.latLngBounds(bounds), { padding: [36, 36], maxZoom: 15 });
      } else {
        map.setView(toLatLng(center) || DEFAULT_CENTER, zoom);
      }
    }
  }, [polylines, center, zoom, interactive]);

  const hasRoutes = polylines.some(p => (p.coords && p.coords.length > 1) || (p.stops && p.stops.length > 0) || p.vehicle);
  const hasVehicle = polylines.some(p => p.vehicle);
  const hasRealized = polylines.some(p => p.variant === 'realized' && p.coords?.length > 1);

  return (
    <div className={`${className} gl-map`} style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={containerRef} className="gl-map__canvas" />
      {showLegend && hasRoutes && (
        <div className="gl-map__legend" aria-hidden="true">
          <span><i className="gl-dot gl-dot--start" /> Partida</span>
          <span><i className="gl-dot gl-dot--collect" /> Coleta</span>
          <span><i className="gl-dot gl-dot--delivery" /> Entrega</span>
          <span><i className="gl-dot gl-dot--done" /> Concluída</span>
          {hasRealized && <span><i className="gl-dot gl-dot--realized" /> Realizado</span>}
          {hasVehicle && <span><i className="gl-dot gl-dot--vehicle" /> Veículo</span>}
        </div>
      )}
      {!hasRoutes && (
        <div className="gl-map__empty">Nenhuma rota planejada para exibir</div>
      )}
    </div>
  );
};

export default MapComponent;
