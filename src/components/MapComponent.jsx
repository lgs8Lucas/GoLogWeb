import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';

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
  polylines = [], // Array of { id, coords: [[lat, lng], ...], color, label, distance, status }
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
          return (
            <Polyline
              key={poly.id}
              positions={poly.coords}
              pathOptions={{
                color: poly.color || 'var(--primary-color)',
                weight: 5,
                opacity: 0.85
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
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
