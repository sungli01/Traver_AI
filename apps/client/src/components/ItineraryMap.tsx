import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapPlace {
  title: string;
  lat: number;
  lng: number;
  category: string;
  day: number;
  order: number;
}

interface ItineraryMapProps {
  places: MapPlace[];
  className?: string;
}

const categoryColors: Record<string, string> = {
  transport: '#3b82f6',
  restaurant: '#f97316',
  attraction: '#10b981',
  shopping: '#ec4899',
  activity: '#8b5cf6',
  rest: '#f59e0b',
  accommodation: '#6366f1',
};

export default function ItineraryMap({ places, className = '' }: ItineraryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || places.length === 0) return;

    // Cleanup previous map
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
    });

    mapInstanceRef.current = map;

    // OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    const bounds = L.latLngBounds([]);
    const dayGroups = new Map<number, MapPlace[]>();

    // Group by day
    places.forEach(p => {
      if (!dayGroups.has(p.day)) dayGroups.set(p.day, []);
      dayGroups.get(p.day)!.push(p);
    });

    // Add markers and routes per day
    const dayColors = ['#3b82f6', '#10b981', '#f97316', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

    dayGroups.forEach((dayPlaces, dayNum) => {
      const color = dayColors[(dayNum - 1) % dayColors.length];
      const coords: L.LatLngExpression[] = [];

      dayPlaces.sort((a, b) => a.order - b.order);

      dayPlaces.forEach((place, idx) => {
        const latlng: L.LatLngExpression = [place.lat, place.lng];
        coords.push(latlng);
        bounds.extend(latlng);

        // Custom numbered marker
        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width: 28px; height: 28px; border-radius: 50%;
            background: ${categoryColors[place.category] || color};
            color: white; font-size: 12px; font-weight: 700;
            display: flex; align-items: center; justify-content: center;
            border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">${idx + 1}</div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        L.marker(latlng, { icon: markerIcon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family: sans-serif; min-width: 120px;">
              <strong style="font-size: 13px;">Day ${dayNum} - ${place.title}</strong>
              <div style="font-size: 11px; color: #666; margin-top: 2px;">${place.category}</div>
            </div>
          `);
      });

      // Draw route line
      if (coords.length > 1) {
        L.polyline(coords, {
          color,
          weight: 3,
          opacity: 0.7,
          dashArray: '8, 6',
        }).addTo(map);
      }
    });

    // Fit bounds
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [places]);

  if (places.length === 0) return null;

  return (
    <div className={`rounded-xl overflow-hidden border border-border ${className}`}>
      <div ref={mapRef} style={{ height: '280px', width: '100%' }} />
    </div>
  );
}

/**
 * 장소명 + 목적지로 위경도를 추정하는 유틸 (Nominatim 무료 API)
 * 실시간 호출이 부담되면 프롬프트에서 lat/lng를 받도록 확장 가능
 */
export async function geocodePlace(query: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      { headers: { 'User-Agent': 'VoyageSafe-AI/1.0' } }
    );
    const data = await res.json();
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch {
    return null;
  }
}
