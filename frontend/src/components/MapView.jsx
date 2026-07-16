import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { regionLabel, typeLabel } from '../constants';
import OccupancyBadge from './OccupancyBadge';
import OpenStatusBadge from './OpenStatusBadge';
import { formatDistance } from '../lib/geo';

// Harita, gizli (display:none) bir konteynerin içinde mount edildiğinde Leaflet
// boyutu 0x0 olarak hesaplar; konteyner sonradan görünür olduğunda (ör. mobilde
// Liste/Harita sekmesi değiştiğinde) tile'lar bozuk kalır. ResizeObserver ile
// konteyner boyutu her değiştiğinde invalidateSize() çağrılır.
function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);

  return null;
}

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const ANTALYA_CENTER = [36.8969, 30.7133];

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:16px;height:16px;border-radius:9999px;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px #2563eb66;"></div>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapView({ places, activeId, onMarkerHover, userLocation }) {
  return (
    <MapContainer center={ANTALYA_CENTER} zoom={12} className="w-full h-full">
      <MapResizeHandler />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> katkıda bulunanlar'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {userLocation && (
        <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
          <Popup>Konumunuz</Popup>
        </Marker>
      )}
      {places.map((place) => (
        <Marker
          key={place.id}
          position={[place.lat, place.lng]}
          icon={markerIcon}
          eventHandlers={{
            mouseover: () => onMarkerHover?.(place.id),
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{place.name}</p>
              <p className="text-xs text-gray-500">
                {typeLabel(place.type)} · {regionLabel(place.region)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {place.ratings?.overallRating ?? '-'} / 5 · {place.ratings?.reviewCount || 0} değerlendirme
              </p>
              {place.distanceKm != null && (
                <p className="text-xs text-brand-600 font-medium mt-0.5">{formatDistance(place.distanceKm)} uzaklıkta</p>
              )}
              <div className="mt-1 flex items-center gap-1 flex-wrap">
                {place.occupancy && <OccupancyBadge occupancy={place.occupancy} />}
                <OpenStatusBadge openTime={place.openTime} closeTime={place.closeTime} />
              </div>
              <Link to={`/mekan/${place.id}`} className="text-xs text-brand-600 hover:underline mt-1 inline-block">
                Detayları Gör →
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
