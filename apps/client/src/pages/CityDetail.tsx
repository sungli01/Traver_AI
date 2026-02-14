import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Clock, Globe, CreditCard, Languages, ShieldCheck,
  Plane, Bus, CreditCard as CardIcon, Lightbulb, MapPin,
  Utensils, Camera, ShoppingBag, Coffee, Hotel, CalendarDays,
  ChevronDown, ChevronUp, Thermometer, Droplets
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  attraction: { label: '관광명소', icon: <Camera className="h-4 w-4" />, color: 'text-blue-400' },
  restaurant: { label: '맛집', icon: <Utensils className="h-4 w-4" />, color: 'text-orange-400' },
  cafe: { label: '카페', icon: <Coffee className="h-4 w-4" />, color: 'text-amber-400' },
  shopping: { label: '쇼핑', icon: <ShoppingBag className="h-4 w-4" />, color: 'text-pink-400' },
  hotel: { label: '숙소', icon: <Hotel className="h-4 w-4" />, color: 'text-purple-400' },
};

const MONTH_LABELS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

const KR_PRICE: Record<string, number> = { meal: 9000, coffee: 4500, beer: 4000, taxi_1km: 800, subway: 1400, hotel_avg: 100000 };
const PRICE_LABELS: Record<string, string> = { meal: '식사 1끼', coffee: '커피', beer: '맥주', taxi_1km: '택시 1km', subway: '지하철', hotel_avg: '호텔 1박' };

export default function CityDetail() {
  const { cityName } = useParams<{ cityName: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cityName) return;
    fetch(`${API}/api/city/${encodeURIComponent(cityName)}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [cityName]);

  const weatherData = useMemo(() => {
    if (!data?.info?.weather_summary) return [];
    const ws = typeof data.info.weather_summary === 'string' ? JSON.parse(data.info.weather_summary) : data.info.weather_summary;
    return MONTH_LABELS.map((m, i) => ({
      month: m,
      high: ws[String(i + 1)]?.high ?? 0,
      low: ws[String(i + 1)]?.low ?? 0,
      rain: ws[String(i + 1)]?.rain ?? 0,
    }));
  }, [data]);

  const priceData = useMemo(() => {
    if (!data?.info?.price_index) return [];
    const pi = typeof data.info.price_index === 'string' ? JSON.parse(data.info.price_index) : data.info.price_index;
    return Object.entries(pi).map(([key, val]) => ({
      name: PRICE_LABELS[key] || key,
      city: val as number,
      korea: KR_PRICE[key] || 0,
      ratio: KR_PRICE[key] ? Math.round(((val as number) / KR_PRICE[key]) * 100) : 100,
    }));
  }, [data]);

  const placesByCategory = useMemo(() => {
    if (!data?.places) return {};
    const grouped: Record<string, any[]> = {};
    for (const p of data.places) {
      const cat = p.category || 'other';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(p);
    }
    return grouped;
  }, [data]);

  const transportInfo = useMemo(() => {
    if (!data?.info?.transport_info) return null;
    return typeof data.info.transport_info === 'string' ? JSON.parse(data.info.transport_info) : data.info.transport_info;
  }, [data]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!data?.info && !data?.places?.length) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-lg">도시 정보를 찾을 수 없습니다.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/cities')}>도시 목록으로</Button>
      </div>
    );
  }

  const info = data.info;
  const tips: string[] = info?.local_tips || [];

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
        <img
          src={info?.image_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200'}
          alt={cityName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20" onClick={() => navigate('/cities')}>
            <ArrowLeft className="h-4 w-4 mr-1" /> 도시 목록
          </Button>
        </div>
        <div className="absolute bottom-6 left-6 right-6">
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-4xl md:text-5xl font-bold text-white">
            {cityName}
          </motion.h1>
          <p className="text-white/80 text-lg mt-1">{info?.country}</p>
        </div>
      </div>

      {/* Quick Info Bar */}
      {info && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: <Clock className="h-4 w-4" />, label: '시차', value: info.timezone },
            { icon: <CreditCard className="h-4 w-4" />, label: '통화', value: info.currency },
            { icon: <Languages className="h-4 w-4" />, label: '언어', value: info.language },
            { icon: <Globe className="h-4 w-4" />, label: '인구', value: info.population },
            { icon: <ShieldCheck className="h-4 w-4" />, label: '비자', value: info.visa_info?.slice(0, 30) + (info.visa_info?.length > 30 ? '...' : '') },
          ].map((item, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur">
              <CardContent className="p-3 flex items-start gap-2">
                <div className="text-primary mt-0.5">{item.icon}</div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Overview */}
      {info?.overview && (
        <Card>
          <CardContent className="p-6">
            <p className="text-base leading-relaxed">{info.overview}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="weather" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          <TabsTrigger value="weather">🌤 날씨</TabsTrigger>
          <TabsTrigger value="price">💰 물가</TabsTrigger>
          <TabsTrigger value="transport">🚇 교통</TabsTrigger>
          <TabsTrigger value="places">📍 관광</TabsTrigger>
          <TabsTrigger value="events">🎉 이벤트</TabsTrigger>
          <TabsTrigger value="tips">💡 팁</TabsTrigger>
          <TabsTrigger value="map">🗺 지도</TabsTrigger>
        </TabsList>

        {/* Weather Tab */}
        <TabsContent value="weather" className="space-y-6">
          {info?.best_season && (
            <Card>
              <CardHeader><CardTitle className="text-lg">🌟 베스트 시즌</CardTitle></CardHeader>
              <CardContent><p>{info.best_season}</p></CardContent>
            </Card>
          )}
          {weatherData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Thermometer className="h-5 w-5" /> 월별 기온 & 강수량</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={weatherData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis yAxisId="temp" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" label={{ value: '°C', position: 'insideTopLeft', fontSize: 12 }} />
                    <YAxis yAxisId="rain" orientation="right" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" label={{ value: 'mm', position: 'insideTopRight', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, color: 'hsl(var(--foreground))' }} />
                    <Legend />
                    <Area yAxisId="temp" type="monotone" dataKey="high" stroke="#f97316" fill="#f9731620" name="최고기온(°C)" />
                    <Area yAxisId="temp" type="monotone" dataKey="low" stroke="#3b82f6" fill="#3b82f620" name="최저기온(°C)" />
                    <Bar yAxisId="rain" dataKey="rain" fill="#06b6d4" opacity={0.5} name="강수량(mm)" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Price Tab */}
        <TabsContent value="price" className="space-y-6">
          {priceData.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">한국 대비 물가 비교</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {priceData.map((item, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.city.toLocaleString()}원
                        <span className={`ml-2 font-medium ${item.ratio > 100 ? 'text-red-400' : 'text-green-400'}`}>
                          {item.ratio > 100 ? '▲' : '▼'} {item.ratio}%
                        </span>
                      </span>
                    </div>
                    <div className="flex gap-1 h-4">
                      <div className="bg-primary/60 rounded-sm h-full transition-all" style={{ width: `${Math.min(item.ratio, 200) / 2}%` }} />
                      <div className="bg-muted rounded-sm h-full" style={{ width: `${Math.max(0, 100 - item.ratio / 2)}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground mt-4">* 한국(서울) = 100% 기준</p>
              </CardContent>
            </Card>
          )}
          {info?.visa_info && (
            <Card>
              <CardHeader><CardTitle className="text-lg">🛂 비자 정보</CardTitle></CardHeader>
              <CardContent><p>{info.visa_info}</p></CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Transport Tab */}
        <TabsContent value="transport" className="space-y-4">
          {transportInfo && (
            <>
              {transportInfo.airport && (
                <TransportCard icon={<Plane className="h-5 w-5" />} title="공항 → 시내" content={transportInfo.airport} />
              )}
              {transportInfo.local && (
                <TransportCard icon={<Bus className="h-5 w-5" />} title="시내 교통" content={
                  Array.isArray(transportInfo.local) ? transportInfo.local.join(' · ') : transportInfo.local
                } />
              )}
              {transportInfo.card && (
                <TransportCard icon={<CardIcon className="h-5 w-5" />} title="교통카드" content={transportInfo.card} />
              )}
              {transportInfo.tips && (
                <TransportCard icon={<Lightbulb className="h-5 w-5" />} title="교통 팁" content={transportInfo.tips} />
              )}
            </>
          )}
          {data.routes?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">✈️ 관련 경로</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.routes.slice(0, 10).map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <span className="text-sm">{r.from_city} → {r.to_city} ({r.transport_type})</span>
                      <span className="text-sm font-medium">{r.cost_krw?.toLocaleString()}원 · {r.duration_min}분</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Places Tab */}
        <TabsContent value="places" className="space-y-6">
          {Object.entries(placesByCategory).map(([cat, places]) => {
            const meta = CATEGORY_META[cat] || { label: cat, icon: <MapPin className="h-4 w-4" />, color: 'text-foreground' };
            return (
              <div key={cat}>
                <h3 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${meta.color}`}>
                  {meta.icon} {meta.label} ({places.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {places.slice(0, 9).map((p: any) => (
                    <Card key={p.id || p.name} className="hover:ring-1 hover:ring-primary/30 transition-all">
                      <CardContent className="p-4 space-y-2">
                        <div className="flex justify-between items-start">
                          <h4 className="font-semibold text-sm">{p.name}</h4>
                          {p.rating && (
                            <Badge variant="secondary" className="text-xs shrink-0">⭐ {p.rating}</Badge>
                          )}
                        </div>
                        {p.name_local && <p className="text-xs text-muted-foreground">{p.name_local}</p>}
                        <p className="text-xs text-muted-foreground line-clamp-2">{p.description}</p>
                        {p.signature && (
                          <div className="flex flex-wrap gap-1">
                            {(Array.isArray(p.signature) ? p.signature : []).slice(0, 3).map((s: string, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between text-xs text-muted-foreground">
                          {p.avg_cost != null && <span>💰 {p.avg_cost.toLocaleString()}원</span>}
                          {p.review_count && <span>📝 {(p.review_count / 1000).toFixed(1)}K</span>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                {places.length > 9 && (
                  <p className="text-center text-sm text-muted-foreground mt-3">
                    +{places.length - 9}개 더 보기
                  </p>
                )}
              </div>
            );
          })}
        </TabsContent>

        {/* Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {data.events?.length > 0 ? (
            data.events.map((e: any, i: number) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CalendarDays className="h-5 w-5 text-primary" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold">{e.name || e.title}</h4>
                    {e.start_date && <p className="text-xs text-muted-foreground">{e.start_date} ~ {e.end_date || ''}</p>}
                    <p className="text-sm text-muted-foreground">{e.description}</p>
                    {e.tags && <div className="flex gap-1 flex-wrap">{e.tags.map((t: string, j: number) => <Badge key={j} variant="outline" className="text-[10px]">{t}</Badge>)}</div>}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-center text-muted-foreground py-8">등록된 이벤트가 없습니다.</p>
          )}
        </TabsContent>

        {/* Tips Tab */}
        <TabsContent value="tips" className="space-y-3">
          {tips.map((tip, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold text-sm">
                    {i + 1}
                  </div>
                  <p className="text-sm pt-1">{tip}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>

        {/* Map Tab */}
        <TabsContent value="map">
          <Card>
            <CardContent className="p-0 overflow-hidden rounded-xl" style={{ height: 450 }}>
              <CityMap places={data.places || []} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TransportCard({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  const [open, setOpen] = useState(true);
  return (
    <Card>
      <CardContent className="p-4">
        <button className="flex items-center justify-between w-full" onClick={() => setOpen(!open)}>
          <div className="flex items-center gap-2 font-semibold">
            <div className="text-primary">{icon}</div>
            {title}
          </div>
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {open && <p className="mt-3 text-sm text-muted-foreground whitespace-pre-line">{content}</p>}
      </CardContent>
    </Card>
  );
}

function CityMap({ places }: { places: any[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-full bg-muted animate-pulse" />;

  const validPlaces = places.filter(p => p.lat && p.lng);
  if (validPlaces.length === 0) return <div className="flex items-center justify-center h-full text-muted-foreground">좌표 정보가 없습니다.</div>;

  const centerLat = validPlaces.reduce((s, p) => s + p.lat, 0) / validPlaces.length;
  const centerLng = validPlaces.reduce((s, p) => s + p.lng, 0) / validPlaces.length;

  // Dynamic import for leaflet
  return <LeafletMap center={[centerLat, centerLng]} places={validPlaces} />;
}

function LeafletMap({ center, places }: { center: [number, number]; places: any[] }) {
  const [L, setL] = useState<any>(null);
  const [components, setComponents] = useState<any>(null);

  useEffect(() => {
    Promise.all([
      import('leaflet'),
      import('react-leaflet'),
    ]).then(([leaflet, rl]) => {
      // Fix default marker icons
      delete (leaflet.default.Icon.Default.prototype as any)._getIconUrl;
      leaflet.default.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });
      setL(leaflet.default);
      setComponents(rl);
    });
  }, []);

  if (!components) return <div className="h-full bg-muted animate-pulse" />;

  const { MapContainer, TileLayer, Marker, Popup } = components;

  return (
    <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://osm.org">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {places.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]}>
          <Popup>
            <div className="text-xs">
              <strong>{p.name}</strong>
              {p.category && <span className="ml-1 text-gray-500">({CATEGORY_META[p.category]?.label || p.category})</span>}
              {p.rating && <span className="ml-1">⭐{p.rating}</span>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
