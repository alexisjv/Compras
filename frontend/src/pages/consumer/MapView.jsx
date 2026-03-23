import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

export default function MapView() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selected, setSelected] = useState(null);

  if (!state?.listB) {
    navigate('/consumer');
    return null;
  }

  const { listB, event } = state;

  useEffect(() => {
    if (!MAPS_KEY) return;
    if (window.google) { initMap(); return; }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => { setMapLoaded(true); initMap(); };
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  const initMap = () => {
    if (!mapRef.current || !listB.length) return;
    const center = { lat: event.userLat, lng: event.userLng };
    const map = new window.google.maps.Map(mapRef.current, {
      center,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    });

    // User marker
    new window.google.maps.Marker({
      position: center,
      map,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 10,
        fillColor: '#7e22ce',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 3,
      },
      title: 'Tu ubicación',
    });

    // Store markers with route path
    const waypoints = [];
    listB.forEach((stop, i) => {
      const pos = { lat: stop.lat, lng: stop.lng };
      waypoints.push(pos);

      const marker = new window.google.maps.Marker({
        position: pos,
        map,
        label: { text: String(i + 1), color: '#fff', fontWeight: 'bold', fontSize: '12px' },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 16,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
        title: stop.commerceName,
      });

      marker.addListener('click', () => setSelected(stop));
    });

    // Draw route line
    if (waypoints.length > 1) {
      const path = [center, ...waypoints];
      new window.google.maps.Polyline({
        path,
        map,
        strokeColor: '#7e22ce',
        strokeOpacity: 0.7,
        strokeWeight: 3,
        icons: [{ icon: { path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW }, offset: '100%' }],
      });
    }

    // Fit bounds
    const bounds = new window.google.maps.LatLngBounds();
    bounds.extend(center);
    waypoints.forEach(w => bounds.extend(w));
    map.fitBounds(bounds, 60);
  };

  const openGoogleMaps = () => {
    if (!listB.length) return;
    const origin = `${event.userLat},${event.userLng}`;
    const waypts = listB.slice(0, -1).map(s => `${s.lat},${s.lng}`).join('|');
    const dest = `${listB[listB.length - 1].lat},${listB[listB.length - 1].lng}`;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}${waypts ? `&waypoints=${waypts}` : ''}&destination=${dest}&travelmode=driving`;
    window.open(url, '_blank');
  };

  return (
    <div className="page-container flex flex-col min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-800 to-brand-700 px-6 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="text-white/70 text-sm">←</button>
        <div>
          <h1 className="text-lg font-bold text-white">Ruta de compras</h1>
          <p className="text-white/60 text-xs">{listB.length} paradas</p>
        </div>
      </div>

      {/* Map */}
      <div className="relative flex-1">
        {!MAPS_KEY ? (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-8 text-center">
            <div className="text-5xl mb-4">🗺️</div>
            <h3 className="font-bold text-gray-800 text-lg mb-2">Mapa no disponible</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-4">
              Configurá tu API Key de Google Maps en el archivo <code className="bg-gray-200 px-1 rounded">.env</code>:
            </p>
            <code className="bg-gray-800 text-green-400 rounded-xl px-4 py-2 text-xs">
              VITE_GOOGLE_MAPS_API_KEY=tu_clave_aquí
            </code>
          </div>
        ) : (
          <div ref={mapRef} className="absolute inset-0" />
        )}

        {/* Stop popup */}
        {selected && (
          <div className="absolute bottom-4 left-4 right-4 bg-white rounded-2xl shadow-2xl p-4 z-10">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="font-bold text-gray-900">{selected.commerceName}</p>
                <p className="text-xs text-gray-500">{selected.address}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-400 text-lg">×</button>
            </div>
            <div className="space-y-1">
              {selected.offers.map((o, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-600">{o.productName}</span>
                  <span className="font-semibold">${o.price}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stops list */}
      <div className="bg-white border-t border-gray-100 px-4 py-4 max-h-56 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">Paradas</p>
          <button
            onClick={openGoogleMaps}
            className="text-xs font-semibold text-brand-700 bg-brand-50 px-3 py-1.5 rounded-lg active:scale-95 transition-all"
          >
            Abrir en Google Maps →
          </button>
        </div>
        <div className="space-y-2">
          {listB.map((stop, i) => (
            <button
              key={i}
              onClick={() => setSelected(stop)}
              className="w-full flex items-center gap-3 text-left"
            >
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{stop.commerceName}</p>
                <p className="text-xs text-gray-400 truncate">{stop.address}</p>
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{stop.distance.toFixed(1)} km</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
