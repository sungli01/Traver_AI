import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Globe, Sun, Snowflake, Leaf, CloudRain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

interface CityInfo {
  city: string;
  country: string;
  overview: string;
  image_url: string;
  best_season: string;
  currency: string;
  timezone: string;
  language: string;
}

const SEASON_ICONS: Record<string, React.ReactNode> = {
  '봄': <Sun className="h-3 w-3" />,
  '여름': <CloudRain className="h-3 w-3" />,
  '가을': <Leaf className="h-3 w-3" />,
  '겨울': <Snowflake className="h-3 w-3" />,
};

export default function CityGuide() {
  const [cities, setCities] = useState<CityInfo[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API}/api/cities`)
      .then(r => r.json())
      .then(data => { setCities(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = cities.filter(c =>
    c.city.toLowerCase().includes(search.toLowerCase()) ||
    c.country.toLowerCase().includes(search.toLowerCase()) ||
    (c.overview || '').includes(search)
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold bg-gradient-to-r from-primary via-blue-400 to-purple-400 bg-clip-text text-transparent"
        >
          🌏 도시 가이드
        </motion.h1>
        <p className="text-muted-foreground text-lg">여행 전 알아야 할 모든 것 — 날씨, 물가, 교통, 관광명소</p>
        <div className="max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="도시명 또는 국가 검색..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* City Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-72 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((city, i) => (
            <motion.div
              key={city.city}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="group cursor-pointer overflow-hidden hover:ring-2 hover:ring-primary/50 transition-all duration-300"
                onClick={() => navigate(`/city/${city.city}`)}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={city.image_url || `https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600`}
                    alt={city.city}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <h3 className="text-xl font-bold text-white">{city.city}</h3>
                    <div className="flex items-center gap-1 text-white/80 text-sm">
                      <MapPin className="h-3 w-3" />
                      {city.country}
                    </div>
                  </div>
                </div>
                <CardContent className="p-4 space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{city.overview}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      <Globe className="h-3 w-3 mr-1" />{city.currency}
                    </Badge>
                    <Badge variant="outline" className="text-xs">{city.timezone}</Badge>
                    <Badge variant="outline" className="text-xs">{city.language}</Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>검색 결과가 없습니다.</p>
        </div>
      )}
    </div>
  );
}
