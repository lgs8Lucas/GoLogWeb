import React, { useEffect, useRef, useState } from 'react';

// Chave da API do Google Maps via env (ou fallback padrão)
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Carregador assíncrono singleton da SDK do Google Maps
let googleMapsPromise = null;
const loadGoogleMapsScript = (apiKey) => {
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const keyParam = apiKey ? `&key=${apiKey}` : '';
      script.src = `https://maps.googleapis.com/maps/api/js?libraries=geometry,places${keyParam}`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google && window.google.maps) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps SDK não pôde ser carregada.'));
        }
      };
      script.onerror = (err) => {
        reject(err);
      };
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
};

// Gerador de ícones SVG customizados para o Google Maps
const getSvgMarkerIcon = (googleMaps, type, bgColor) => {
  let pathD = 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z';
  
  if (type === 'START' || type === 'END') {
    pathD = 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z';
  } else if (type === 'COLETA') {
    pathD = 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm1-15h17l-3-4H5L3 7z';
  } else if (type === 'ENTREGA') {
    pathD = 'M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z';
  }

  return {
    path: pathD,
    fillColor: bgColor,
    fillOpacity: 1,
    strokeWeight: 1.5,
    strokeColor: '#FFFFFF',
    scale: 1.4,
    anchor: new googleMaps.Point(12, 22),
    labelOrigin: new googleMaps.Point(12, 9)
  };
};

// Estilo moderno e limpo para o Google Maps compatível com o tema TMS
const tmsMapStyle = [
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'simplified' }]
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.icon',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c4e0e5' }]
  }
];

const MapComponent = ({
  center = [-22.3659, -47.3809], // [lat, lng] padrão Araras/SP
  zoom = 13,
  polylines = [], // Array de { id, coords: [[lat, lng], ...], color, label, distance, stops: [...] }
  className = 'map-container',
  interactive = true
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const overlaysRef = useRef([]); // Polylines, Markers, InfoWindows
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  // Inicializa o Google Maps SDK
  useEffect(() => {
    let isMounted = true;
    loadGoogleMapsScript(GOOGLE_MAPS_API_KEY)
      .then(() => {
        if (isMounted) setMapsLoaded(true);
      })
      .catch((err) => {
        console.error('Falha ao carregar Google Maps:', err);
        if (isMounted) setLoadError(err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Cria a instância do mapa no container DOM
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current || !window.google?.maps) return;

    if (!mapInstanceRef.current) {
      const lat = Array.isArray(center) ? center[0] : -22.3659;
      const lng = Array.isArray(center) ? center[1] : -47.3809;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom,
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        mapTypeControl: interactive,
        scaleControl: interactive,
        streetViewControl: false,
        rotateControl: false,
        fullscreenControl: interactive,
        styles: tmsMapStyle
      });
    }
  }, [mapsLoaded, zoom, interactive]);

  // Atualiza polylines, marcadores e fitBounds sempre que mudarem
  useEffect(() => {
    if (!mapsLoaded || !mapInstanceRef.current || !window.google?.maps) return;

    const googleMaps = window.google.maps;
    const map = mapInstanceRef.current;

    // Limpa overlays anteriores
    overlaysRef.current.forEach((overlay) => {
      if (overlay.setMap) overlay.setMap(null);
      if (overlay.close) overlay.close();
    });
    overlaysRef.current = [];

    const bounds = new googleMaps.LatLngBounds();
    let hasCoords = false;

    polylines.forEach((poly) => {
      if (!poly.coords || poly.coords.length === 0) return;

      const path = poly.coords.map((c) => {
        const lat = Array.isArray(c) ? c[0] : c.lat;
        const lng = Array.isArray(c) ? c[1] : c.lng;
        const latLng = new googleMaps.LatLng(lat, lng);
        bounds.extend(latLng);
        hasCoords = true;
        return latLng;
      });

      // Desenha a linha da rota
      const polylineOverlay = new googleMaps.Polyline({
        path,
        geodesic: true,
        strokeColor: poly.color || '#2ab29b',
        strokeOpacity: 0.8,
        strokeWeight: 5,
        map
      });
      overlaysRef.current.push(polylineOverlay);

      // InfoWindow compartilhada
      const infoWindow = new googleMaps.InfoWindow();

      // Ponto Inicial (Bandeira Verde)
      if (path.length > 0) {
        const startMarker = new googleMaps.Marker({
          position: path[0],
          map,
          title: `Início: ${poly.label || ''}`,
          icon: getSvgMarkerIcon(googleMaps, 'START', '#10b981')
        });
        if (interactive) {
          startMarker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 6px; font-family: sans-serif;">
                <strong style="color: #10b981;">Início da Rota</strong>
                <p style="margin: 4px 0 0; font-size: 12px;">${poly.label || 'Partida'}</p>
              </div>
            `);
            infoWindow.open(map, startMarker);
          });
        }
        overlaysRef.current.push(startMarker);
      }

      // Ponto Final (Bandeira Vermelha)
      if (path.length > 1) {
        const endMarker = new googleMaps.Marker({
          position: path[path.length - 1],
          map,
          title: `Destino: ${poly.label || ''}`,
          icon: getSvgMarkerIcon(googleMaps, 'END', '#ef4444')
        });
        if (interactive) {
          endMarker.addListener('click', () => {
            infoWindow.setContent(`
              <div style="padding: 6px; font-family: sans-serif;">
                <strong style="color: #ef4444;">Destino Final</strong>
                <p style="margin: 4px 0 0; font-size: 12px;">${poly.label || 'Chegada'}</p>
              </div>
            `);
            infoWindow.open(map, endMarker);
          });
        }
        overlaysRef.current.push(endMarker);
      }

      // Paradas Intermediárias (Entregas e Coletas)
      if (poly.stops && Array.isArray(poly.stops)) {
        poly.stops.forEach((stop, idx) => {
          let lat;
          let lng;
          let isCollection = false;
          let isDelivery = false;
          let label = `Parada ${idx + 1}`;

          if (Array.isArray(stop)) {
            lat = stop[0];
            lng = stop[1];
          } else if (stop && stop.coord) {
            lat = Array.isArray(stop.coord) ? stop.coord[0] : stop.coord.lat;
            lng = Array.isArray(stop.coord) ? stop.coord[1] : stop.coord.lng;
            isCollection = stop.type === 'COLETA';
            isDelivery = stop.type === 'ENTREGA';
            if (stop.label) label = `${isCollection ? 'Coleta: ' : isDelivery ? 'Entrega: ' : ''}${stop.label}`;
          } else {
            return;
          }

          if (lat == null || lng == null) return;

          const stopLatLng = new googleMaps.LatLng(lat, lng);
          bounds.extend(stopLatLng);
          hasCoords = true;

          const markerColor = isCollection ? '#0ea5e9' : isDelivery ? '#10b981' : '#f59e0b';
          const markerType = isCollection ? 'COLETA' : isDelivery ? 'ENTREGA' : 'STOP';

          const stopMarker = new googleMaps.Marker({
            position: stopLatLng,
            map,
            title: label,
            icon: getSvgMarkerIcon(googleMaps, markerType, markerColor)
          });

          if (interactive) {
            stopMarker.addListener('click', () => {
              infoWindow.setContent(`
                <div style="padding: 6px; font-family: sans-serif;">
                  <span style="font-size: 11px; font-weight: 700; color: ${markerColor}; text-transform: uppercase;">
                    ${isCollection ? 'Coleta' : isDelivery ? 'Entrega' : 'Parada'}
                  </span>
                  <h4 style="margin: 2px 0 4px; font-size: 13px; color: #1e293b;">${label}</h4>
                </div>
              `);
              infoWindow.open(map, stopMarker);
            });
          }
          overlaysRef.current.push(stopMarker);
        });
      }
    });

    // Ajusta o zoom e foco do mapa para enquadrar todas as coordenadas
    if (hasCoords) {
      map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
    } else if (center) {
      const lat = Array.isArray(center) ? center[0] : -22.3659;
      const lng = Array.isArray(center) ? center[1] : -47.3809;
      map.setCenter({ lat, lng });
      map.setZoom(zoom);
    }
  }, [mapsLoaded, polylines, center, zoom, interactive]);

  if (loadError) {
    return (
      <div className={className} style={{ height: '100%', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', color: '#64748b' }}>
        <p>Não foi possível carregar o Google Maps. Verifique a conexão com a internet.</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height: '100%', width: '100%', position: 'relative' }}>
      <div ref={mapRef} style={{ height: '100%', width: '100%', borderRadius: 'inherit' }} />
    </div>
  );
};

export default MapComponent;
