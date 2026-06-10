import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polyline, Popup, Marker } from 'react-leaflet';
const createCustomIcon = (svgPath, bgColor) => {
  const markerHtml = `
    <div style="position: relative; display: flex; justify-content: center; align-items: center; width: 36px; height: 36px; background-color: ${bgColor}; border-radius: 50%; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 2px solid white;">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        ${svgPath}
      </svg>
    </div>
  `;

  return L.divIcon({
    html: markerHtml,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

// Flag
const flagPath = '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>';
const startIcon = createCustomIcon(flagPath, '#10b981'); // Bandeira Verde
const endIcon = createCustomIcon(flagPath, '#ef4444');   // Bandeira Vermelha

// Building (Empresa)
const buildingPath = '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/>';
const collectionIcon = createCustomIcon(buildingPath, '#0ea5e9'); // Azul info

// Box (Caixa)
const boxPath = '<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>';
const deliveryIcon = createCustomIcon(boxPath, '#10b981'); // Verde Sucesso

// MapPin
const pinPath = '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>';
const stopIcon = createCustomIcon(pinPath, '#f59e0b'); // Laranja Warning

const MapUpdater = ({ center, zoom, polylines }) => {
  const map = useMap();
  useEffect(() => {
    if (polylines && polylines.length > 0) {
      const allCoords = polylines.flatMap(p => p.coords);
      if (allCoords.length > 0) {
        const bounds = L.latLngBounds(allCoords);
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    } else if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, polylines, map]);
  return null;
};

const MapComponent = ({
  center = [-22.3659, -47.3809], // Default to Araras area
  zoom = 13,
  polylines = [], // Array of { id, coords: [[lat, lng], ...], color, label, distance, status, stops: [[lat,lng]...] }
  className = "map-container",
  interactive = true
}) => {
  return (
    <div className={className} style={{ height: '100%', width: '100%', zIndex: 1, position: 'relative' }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: 'inherit' }}
        zoomControl={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        scrollWheelZoom={interactive}
        attributionControl={interactive}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        <MapUpdater center={center} zoom={zoom} polylines={polylines} />

        {polylines.map((poly) => {
          if (!poly.coords || poly.coords.length === 0) return null;
          const startCoord = poly.coords[0];
          const endCoord = poly.coords[poly.coords.length - 1];

          return (
            <React.Fragment key={poly.id}>
              <Polyline
                positions={poly.coords}
                pathOptions={{
                  color: poly.color || 'var(--primary-color, #3b82f6)',
                  weight: 5,
                  opacity: 0.55 // Reduced opacity for cleaner look
                }}
              >
                {interactive && poly.label && (
                  <Popup>
                    <div style={{ padding: '4px', textAlign: 'center' }}>
                      <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--primary-color)' }}>{poly.label}</h3>
                      {poly.distance && (
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                          Distância: {(poly.distance / 1000).toFixed(2)} km
                        </p>
                      )}
                    </div>
                  </Popup>
                )}
              </Polyline>

              {/* Start Marker */}
              <Marker position={startCoord} icon={startIcon}>
                {interactive && <Popup><strong>Início:</strong> {poly.label}</Popup>}
              </Marker>

              {/* End Marker */}
              <Marker position={endCoord} icon={endIcon}>
                {interactive && <Popup><strong>Fim:</strong> {poly.label}</Popup>}
              </Marker>

              {/* Intermediate Stops if provided */}
              {poly.stops && poly.stops.map((stop, i) => {
                let stopCoord;
                let isCollection = false;
                let isDelivery = false;
                let label = `Parada ${i + 1}`;

                if (Array.isArray(stop)) {
                  stopCoord = stop;
                } else if (stop && stop.coord) {
                  stopCoord = stop.coord;
                  isCollection = stop.type === 'COLETA';
                  isDelivery = stop.type === 'ENTREGA';
                  if (stop.label) label = `${isCollection ? 'Coleta: ' : isDelivery ? 'Entrega: ' : ''}${stop.label}`;
                } else {
                  return null;
                }

                const iconToUse = isCollection ? collectionIcon : isDelivery ? deliveryIcon : stopIcon;

                return (
                  <Marker key={`stop-${poly.id}-${i}`} position={stopCoord} icon={iconToUse} zIndexOffset={1000}>
                    {interactive && <Popup><strong>{label}</strong></Popup>}
                  </Marker>
                );
              })}

            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
