import { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ScheduleData } from './ScheduleEditor';

interface ScheduleMapProps {
  scheduleData: ScheduleData;
  activeDay?: number;
  className?: string;
  selectedActivityId?: string | null;
}

const getTileUrl = (destination: string) => {
  if (/일본|도쿄|오사카|교토|후쿠오카|삿포로|나고야|요코하마|고베|나라|하코네|오키나와|Tokyo|Osaka|Kyoto|Japan/.test(destination))
    return 'https://{s}.tile.openstreetmap.jp/{z}/{x}/{y}.png';
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
};

const categoryColors: Record<string, string> = {
  transport: '#3b82f6',
  restaurant: '#f97316',
  attraction: '#10b981',
  shopping: '#ec4899',
  activity: '#8b5cf6',
  rest: '#f59e0b',
};

const dayColors = ['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f97316', '#06b6d4', '#ec4899', '#f59e0b'];

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function ScheduleMap({ scheduleData, activeDay, className = '', selectedActivityId }: ScheduleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  // Compute distances per day
  const dayDistances = useMemo(() => {
    const distances: Record<number, number> = {};
    let total = 0;
    scheduleData.days.forEach(day => {
      let dayDist = 0;
      const coords = day.activities.filter(a => a.lat && a.lng);
      for (let i = 1; i < coords.length; i++) {
        dayDist += haversineDistance(coords[i - 1].lat!, coords[i - 1].lng!, coords[i].lat!, coords[i].lng!);
      }
      distances[day.day] = dayDist;
      total += dayDist;
    });
    distances[0] = total; // 0 = total
    return distances;
  }, [scheduleData]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, { zoomControl: true, scrollWheelZoom: true });
    mapInstanceRef.current = map;

    L.tileLayer(getTileUrl(scheduleData.destination || ''), {
      attribution: '© OpenStreetMap',
      maxZoom: 18,
    }).addTo(map);

    markersRef.current.clear();

    const bounds = L.latLngBounds([]);
    let hasMarkers = false;

    scheduleData.days.forEach(day => {
      const color = dayColors[(day.day - 1) % dayColors.length];
      const isActive = activeDay === day.day;
      const isInactive = activeDay != null && activeDay !== day.day;
      const coords: L.LatLngExpression[] = [];

      day.activities.forEach((act, idx) => {
        if (!act.lat || !act.lng) return;
        const latlng: L.LatLngExpression = [act.lat, act.lng];
        coords.push(latlng);
        bounds.extend(latlng);
        hasMarkers = true;

        const opacity = isInactive ? 0.35 : 1;
        const isSelected = selectedActivityId === act.id;
        const size = isSelected ? 38 : isActive ? 32 : 28;

        const markerIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="
            width:${size}px;height:${size}px;border-radius:50%;
            background:${categoryColors[act.category] || color};
            color:white;font-size:${isSelected ? 15 : isActive ? 13 : 11}px;font-weight:700;
            display:flex;align-items:center;justify-content:center;
            border:${isSelected ? '4px solid #fbbf24' : isActive ? '3px solid white' : '2px solid white'};
            box-shadow:0 ${isSelected ? '4px 12px' : '2px 6px'} rgba(0,0,0,${isSelected ? 0.6 : isActive ? 0.5 : 0.3});
            opacity:${opacity};
            ${isSelected ? 'transform:scale(1.2);animation:bounce 0.6s ease;z-index:9999;' : isActive ? 'transform:scale(1.1);' : ''}
          ">${idx + 1}</div>
          ${isSelected ? '<style>@keyframes bounce{0%,100%{transform:scale(1.2)}50%{transform:scale(1.5)}}</style>' : ''}`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });

        const marker = L.marker(latlng, { icon: markerIcon, zIndexOffset: isSelected ? 1000 : 0 })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:140px;">
              <strong style="font-size:13px;">Day ${day.day} - ${act.title}</strong>
              <div style="font-size:11px;color:#666;margin-top:2px;">${
                ({ transport: '교통', restaurant: '식사', attraction: '관광', shopping: '쇼핑', activity: '액티비티', rest: '휴식' }[act.category]) || act.category
              }</div>
              ${act.cost ? `<div style="font-size:11px;font-weight:600;margin-top:2px;">${act.cost}</div>` : ''}
            </div>
          `);

        markersRef.current.set(act.id, marker);

        if (isSelected) {
          setTimeout(() => {
            map.flyTo(latlng as L.LatLngExpression, Math.max(map.getZoom(), 15), { duration: 0.8 });
            marker.openPopup();
          }, 100);
        }
      });

      if (coords.length > 1) {
        // Add clickable route segments
        for (let i = 1; i < coords.length; i++) {
          const segCoords = [coords[i - 1], coords[i]] as L.LatLngExpression[];
          const fromAct = day.activities.filter(a => a.lat && a.lng)[i - 1];
          const toAct = day.activities.filter(a => a.lat && a.lng)[i];
          L.polyline(segCoords, {
            color,
            weight: isActive ? 5 : 3,
            opacity: isInactive ? 0.2 : isActive ? 0.9 : 0.6,
            dashArray: isActive ? undefined : '8, 6',
          }).addTo(map).on('click', () => {
            if (fromAct?.lat && fromAct?.lng && toAct?.lat && toAct?.lng) {
              window.open(`https://www.google.com/maps/dir/${fromAct.lat},${fromAct.lng}/${toAct.lat},${toAct.lng}`, '_blank');
            }
          }).bindTooltip('클릭하여 길찾기', { sticky: true, className: 'text-xs' });
        }
      }
    });

    if (hasMarkers && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    } else {
      map.setView([37.5665, 126.978], 5);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [scheduleData, activeDay, selectedActivityId]);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div ref={mapRef} className="flex-1 min-h-0" />
      {/* Legend + distance */}
      <div className="shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
            🚗 총 이동거리: 약 {dayDistances[0]?.toFixed(1) || 0} km
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1">
          {scheduleData.days.map(day => {
            const color = dayColors[(day.day - 1) % dayColors.length];
            const dist = dayDistances[day.day] || 0;
            return (
              <div key={day.day} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color, opacity: activeDay != null && activeDay !== day.day ? 0.3 : 1 }}
                />
                <span className={`font-medium ${activeDay === day.day ? 'text-gray-900 dark:text-gray-100 font-bold' : 'text-gray-500'}`}>
                  Day {day.day} ({dist.toFixed(1)}km)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
