import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polyline, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import { renderToString } from 'react-dom/server';
import { MapPin, Flag, Navigation } from 'lucide-react';

const createCustomIcon = (IconComponent, color) => {
  const iconHtml = renderToString(<IconComponent size={24} color={color} fill="white" strokeWidth={2} />);
  return L.divIcon({
    html: `<div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px; background-color: white; border-radius: 50%; box-shadow: 0 2px 4px rgba(0,0,0,0.3); border: 2px solid ${color};">${iconHtml}</div>`,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

const startIcon = createCustomIcon(Navigation, 'var(--success-color, #10b981)');
const endIcon = createCustomIcon(Flag, 'var(--danger-color, #ef4444)');
const stopIcon = createCustomIcon(MapPin, 'var(--primary-color, #3b82f6)');

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
              {poly.stops && poly.stops.map((stopCoord, i) => (
                <Marker key={`stop-${poly.id}-${i}`} position={stopCoord} icon={stopIcon}>
                  {interactive && <Popup><strong>Parada {i + 1}</strong></Popup>}
                </Marker>
              ))}

            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
