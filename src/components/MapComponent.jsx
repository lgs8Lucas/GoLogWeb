import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Truck, MapPin } from 'lucide-react';
import { renderToString } from 'react-dom/server';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (iconColor) => {
  const svgString = renderToString(<Truck size={20} color="#ffffff" />);

  return L.divIcon({
    html: `
      <div style="
        background-color: ${iconColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
      ">
        ${svgString}
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const truckIconNormal = createCustomIcon('var(--primary-color)');
const truckIconActive = createCustomIcon('var(--success-color)');
const truckIconDelayed = createCustomIcon('var(--danger-color)');

const MapUpdater = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
};

const MapComponent = ({
  center = [-23.55052, -46.633308],
  zoom = 11,
  markers = [],
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

        <MapUpdater center={center} zoom={zoom} />

        {markers.map((marker) => {
          let icon = truckIconNormal;
          if (marker.status === 'active') icon = truckIconActive;
          if (marker.status === 'delayed') icon = truckIconDelayed;

          return (
            <Marker
              key={marker.id}
              position={[marker.lat, marker.lng]}
              icon={icon}
            >
              {interactive && (
                <Popup>
                  <div style={{ padding: '4px', textAlign: 'center' }}>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: 'var(--primary-color)' }}>{marker.label}</h3>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>Status: {marker.status || 'Normal'}</p>
                    {marker.speed && <p style={{ margin: '4px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>{marker.speed} km/h</p>}
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default MapComponent;
