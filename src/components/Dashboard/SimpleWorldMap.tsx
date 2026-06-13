import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule,
} from 'react-simple-maps';
import { getCountryName, countryCodeMap } from '../../data/countryCodes';
import { getFlagUrl } from '../../utils/countries';
import {
  buildPassportMobilityIndex,
  getPassportMobilityStats,
  normalizeCountryKey,
  PassportMobilityStats,
} from '../../services/visaCsvData';
import './LoadingPlane.css';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const INITIAL_MAP_CENTER: [number, number] = [20, 10];
const INITIAL_MAP_ZOOM = 1.5;

/** Map TopoJSON country names to names used in our visa CSV. Keys are normalized via normalizeGeoKey(). */
const GEO_NAME_ALIASES: Record<string, string> = {
  'united states of america': 'United States',
  'united states': 'United States',
  'united kingdom': 'United Kingdom',
  'dem rep congo': 'DR Congo',
  'democratic republic of the congo': 'DR Congo',
  'congo': 'Congo',
  'republic of congo': 'Congo',
  'cote d ivoire': 'Ivory Coast',
  'ivory coast': 'Ivory Coast',
  'eswatini': 'Swaziland',
  'czechia': 'Czech Republic',
  'bosnia and herz': 'Bosnia and Herzegovina',
  'dominican rep': 'Dominican Republic',
  'eq guinea': 'Equatorial Guinea',
  'central african rep': 'Central African Republic',
  's sudan': 'South Sudan',
  'solomon is': 'Solomon Islands',
  'saint vincent and the grenadines': 'Saint Vincent and the Grenadines',
  'st vincent and the grenadines': 'Saint Vincent and the Grenadines',
  'saint kitts and nevis': 'Saint Kitts and Nevis',
  'st kitts and nevis': 'Saint Kitts and Nevis',
  'antigua and barbuda': 'Antigua and Barbuda',
  'antigua & barbuda': 'Antigua and Barbuda',
  'sao tome and principe': 'Sao Tome and Principe',
  'timor-leste': 'Timor-Leste',
  'east timor': 'Timor-Leste',
  'cabo verde': 'Cape Verde',
  'cape verde': 'Cape Verde',
  'macedonia': 'North Macedonia',
  'north macedonia': 'North Macedonia',
  'south korea': 'South Korea',
  'north korea': 'North Korea',
  'dem rep korea': 'North Korea',
  'taiwan': 'Taiwan',
  'hong kong': 'Hong Kong',
  'macao': 'Macao',
  'macau': 'Macao',
  'palestine': 'Palestine',
  'kosovo': 'Kosovo',
  'vatican': 'Vatican',
  'myanmar': 'Myanmar',
  'burma': 'Myanmar',
  'laos': 'Laos',
  'syria': 'Syria',
  'iran': 'Iran',
  'vietnam': 'Vietnam',
  'viet nam': 'Vietnam',
  'tanzania': 'Tanzania',
  'brunei': 'Brunei',
  'greenland': 'Greenland',
  'united arab emirates': 'United Arab Emirates',
  'w sahara': 'Western Sahara',
  'n cyprus': 'Cyprus',
  'falkland is': 'Falkland Islands',
};

interface GeoProperties {
  name?: string;
  NAME?: string;
  iso_a2?: string;
  ISO_A2?: string;
}

/** world-atlas@2 uses lowercase `name`; older topojson used `NAME` + `ISO_A2`. */
function getGeoCountryLabel(props: GeoProperties): string {
  return (props.name || props.NAME || '').trim();
}

function getGeoIsoCode(props: GeoProperties): string | undefined {
  const code = props.iso_a2 || props.ISO_A2;
  if (!code || code === '-99') return undefined;
  return code;
}

interface CountryRankData {
  passport_rank?: string;
  visa_free_countries?: string;
}

interface VisaRequirementsMapProps {
  userNationality?: string;
  onCountrySelect?: (countryCode: string, stats: PassportMobilityStats) => void;
}

interface HoveredCountry {
  code: string;
  name: string;
  stats: PassportMobilityStats | null;
  rank: string | null;
}

const LoadingPlane: React.FC = () => (
  <div className="loading-container">
    <div className="loading-plane">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-teal-600"
      >
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L10 12l-2 3H3l-1 1 3 2 2 3 1-1v-5l3-2 3.5 6.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    </div>
    <div className="loading-text">Loading world map...</div>
  </div>
);

function normalizeGeoKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function resolveGeoCountryName(geoName: string, isoCode?: string): string {
  if (isoCode && isoCode.length === 2) {
    const fromCode = getCountryName(isoCode.toUpperCase());
    if (fromCode && fromCode !== isoCode.toUpperCase()) return fromCode;
  }

  const normalized = normalizeGeoKey(geoName);
  if (GEO_NAME_ALIASES[normalized]) return GEO_NAME_ALIASES[normalized];

  const lower = geoName.trim().toLowerCase();
  for (const [, name] of Object.entries(countryCodeMap)) {
    if (name.toLowerCase() === lower) return name;
  }

  return geoName.trim();
}

function resolveCountryCode(geoName: string, isoCode?: string): string {
  if (isoCode && isoCode.length === 2 && isoCode !== '-99') {
    return isoCode.toUpperCase();
  }

  const resolvedName = resolveGeoCountryName(geoName, isoCode);
  for (const [code, name] of Object.entries(countryCodeMap)) {
    if (name.toLowerCase() === resolvedName.toLowerCase()) return code;
  }
  return '';
}

const StatRow: React.FC<{ label: string; value: number; color: string }> = ({
  label,
  value,
  color,
}) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
    <div className="flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm text-gray-600">{label}</span>
    </div>
    <span className="text-sm font-semibold text-gray-900">{value}</span>
  </div>
);

const PassportStatsCard: React.FC<{ country: HoveredCountry }> = ({ country }) => {
  const { name, code, stats, rank } = country;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-5 w-full max-w-xs">
      <div className="flex items-center gap-3 mb-4">
        {code && (
          <img
            src={getFlagUrl(code.toLowerCase())}
            alt=""
            className="w-10 h-7 object-cover rounded shadow-sm"
          />
        )}
        <div>
          <h4 className="font-semibold text-gray-900 leading-tight">{name}</h4>
          {rank && (
            <p className="text-xs text-gray-500 mt-0.5">Passport rank #{rank}</p>
          )}
        </div>
      </div>

      {stats ? (
        <>
          <p className="text-xs text-gray-500 mb-3">
            Where {name} passport holders can travel
          </p>
          <StatRow label="Visa-free" value={stats.visaFree} color="#22c55e" />
          <StatRow label="eVisa / ETA" value={stats.evisa} color="#14b8a6" />
          <StatRow label="Traditional visa" value={stats.traditional} color="#ef4444" />
          {stats.visaOnArrival > 0 && (
            <StatRow label="Visa on arrival" value={stats.visaOnArrival} color="#f59e0b" />
          )}
          <p className="text-xs text-gray-400 mt-3">
            {stats.totalDestinations} destinations tracked
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-500">Passport data not available for this country.</p>
      )}
    </div>
  );
};

const VisaRequirementsMap: React.FC<VisaRequirementsMapProps> = ({
  userNationality = '',
  onCountrySelect,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [rankByCountryKey, setRankByCountryKey] = useState<Record<string, CountryRankData>>({});
  const [activeCountry, setActiveCountry] = useState<HoveredCountry | null>(null);
  const [isTouchMode, setIsTouchMode] = useState(false);
  const statsPanelRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    coordinates: INITIAL_MAP_CENTER,
    zoom: INITIAL_MAP_ZOOM,
  });

  const mobilityIndex = useMemo(() => buildPassportMobilityIndex(), []);

  const userCountryCode = useMemo(() => {
    if (!userNationality) return '';
    const trimmed = userNationality.trim();
    if (trimmed.length === 2) return trimmed.toUpperCase();
    const fromName = Object.entries(countryCodeMap).find(
      ([, name]) => name.toLowerCase() === trimmed.toLowerCase()
    )?.[0];
    if (fromName) return fromName;
    return resolveCountryCode(trimmed) || trimmed.toUpperCase();
  }, [userNationality]);

  useEffect(() => {
    const touchQuery = window.matchMedia('(hover: none), (pointer: coarse)');
    const mobileLayoutQuery = window.matchMedia('(max-width: 1023px)');

    const updateTouchMode = () => {
      setIsTouchMode(touchQuery.matches || mobileLayoutQuery.matches);
    };

    updateTouchMode();
    touchQuery.addEventListener('change', updateTouchMode);
    mobileLayoutQuery.addEventListener('change', updateTouchMode);

    return () => {
      touchQuery.removeEventListener('change', updateTouchMode);
      mobileLayoutQuery.removeEventListener('change', updateTouchMode);
    };
  }, []);

  useEffect(() => {
    fetch('/countrydata.json')
      .then((res) => res.json())
      .then((data: Array<{ country_name: string; passport_rank?: string; visa_free_countries?: string }>) => {
        const map: Record<string, CountryRankData> = {};
        for (const item of data) {
          const key = normalizeCountryKey(
            item.country_name.replace('&', 'and').replace('Antigua & Barbuda', 'Antigua and Barbuda')
          );
          map[key] = {
            passport_rank: item.passport_rank,
            visa_free_countries: item.visa_free_countries,
          };
          if (item.country_name.includes('Antigua')) {
            map[normalizeCountryKey('Antigua and Barbuda')] = map[key];
          }
        }
        setRankByCountryKey(map);
      })
      .catch(() => {
        // Rank data is optional
      })
      .finally(() => setIsLoading(false));
  }, []);

  const lookupStats = useCallback(
    (props: GeoProperties): { name: string; code: string; stats: PassportMobilityStats | null; rank: string | null } => {
      const geoName = getGeoCountryLabel(props);
      const isoCode = getGeoIsoCode(props);
      const name = resolveGeoCountryName(geoName, isoCode);
      const code = resolveCountryCode(geoName, isoCode);
      const key = normalizeCountryKey(name);
      const stats = mobilityIndex.get(key) ?? getPassportMobilityStats(name);
      const rank = rankByCountryKey[key]?.passport_rank ?? null;

      return { name: name || geoName, code, stats, rank };
    },
    [mobilityIndex, rankByCountryKey]
  );

  const handleMouseEnter = useCallback(
    (geo: { properties: GeoProperties }) => {
      if (isTouchMode) return;
      setActiveCountry(lookupStats(geo.properties));
    },
    [lookupStats, isTouchMode]
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouchMode) return;
    setActiveCountry(null);
  }, [isTouchMode]);

  const handleCountryClick = useCallback(
    (geo: { properties: GeoProperties }) => {
      const info = lookupStats(geo.properties);

      if (isTouchMode) {
        setActiveCountry((prev) =>
          prev?.code === info.code && info.code ? null : info
        );
        requestAnimationFrame(() => {
          statsPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });
        return;
      }

      if (info.code && info.stats && onCountrySelect) {
        onCountrySelect(info.code, info.stats);
      }
    },
    [lookupStats, onCountrySelect, isTouchMode]
  );

  const getCountryFill = useCallback(
    (geo: { properties: GeoProperties }) => {
      const geoName = getGeoCountryLabel(geo.properties);
      const isoCode = getGeoIsoCode(geo.properties);
      const code = resolveCountryCode(geoName, isoCode);
      const name = resolveGeoCountryName(geoName, isoCode);

      const isActive =
        (activeCountry?.code && code && activeCountry.code === code) ||
        (activeCountry?.name && name && activeCountry.name === name);

      if (isActive) return '#0d9488';

      if (userCountryCode && code === userCountryCode) return '#64748b';

      return '#e2e8f0';
    },
    [activeCountry, userCountryCode]
  );

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  if (isLoading) {
    return (
      <div className="relative bg-white rounded-lg shadow-md overflow-hidden" style={{ minHeight: '520px' }}>
        <LoadingPlane />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden relative" style={{ minHeight: '520px' }}>
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <h3 className="text-xl font-semibold text-gray-900">Passport Power Map</h3>
        <p className="text-gray-600 text-sm mt-1 hidden lg:block">
          Hover over any country to see where its passport holders can travel — visa-free, eVisa, or traditional visa.
        </p>
        <p className="text-gray-600 text-sm mt-1 lg:hidden">
          Tap any country on the map to see where its passport holders can travel — visa-free, eVisa, or traditional visa.
        </p>
        {userCountryCode && (
          <p className="text-xs text-gray-500 mt-2">
            Your passport ({getCountryName(userCountryCode)}) is highlighted in gray.
          </p>
        )}
      </div>

      <div className="relative flex flex-col lg:flex-row">
        {/* Map */}
        <div className="flex-1 relative">
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-1">
            <button
              type="button"
              onClick={handleZoomIn}
              className="bg-white text-gray-800 font-bold p-2 rounded shadow hover:bg-gray-50 text-base"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={handleZoomOut}
              className="bg-white text-gray-800 font-bold p-2 rounded shadow hover:bg-gray-50 text-base"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>

          <div className="w-full h-[420px] lg:h-[480px] overflow-hidden flex justify-center bg-slate-50">
            <ComposableMap
              projectionConfig={{ scale: 147, center: INITIAL_MAP_CENTER }}
              width={800}
              height={450}
              style={{ width: '100%', height: 'auto' }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={setPosition}
                maxZoom={4}
              >
                <Sphere stroke="#cbd5e1" strokeWidth={0.5} />
                <Graticule stroke="#cbd5e1" strokeWidth={0.5} />
                <Geographies geography={geoUrl}>
                  {({ geographies }: { geographies: Array<{ rsmKey: string; properties: GeoProperties }> }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        fill={getCountryFill(geo)}
                        stroke="#ffffff"
                        strokeWidth={0.5}
                        style={{
                          default: {
                            outline: 'none',
                            transition: 'all 0.25s ease-out',
                          },
                          hover: isTouchMode
                            ? { outline: 'none', cursor: 'pointer' }
                            : {
                                outline: 'none',
                                fill: '#0d9488',
                                cursor: 'pointer',
                                transform: 'translateY(-3px) scale(1.02)',
                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.15))',
                              },
                          pressed: isTouchMode
                            ? {
                                outline: 'none',
                                fill: '#0d9488',
                                transform: 'translateY(-2px) scale(1.01)',
                              }
                            : { outline: 'none' },
                        }}
                        onMouseEnter={() => handleMouseEnter(geo)}
                        onMouseLeave={handleMouseLeave}
                        onClick={() => handleCountryClick(geo)}
                      />
                    ))
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>

        {/* Stats card panel */}
        <div
          ref={statsPanelRef}
          className="lg:w-72 xl:w-80 p-4 lg:p-6 flex items-start justify-center lg:border-l border-gray-200 bg-gray-50 min-h-[200px]"
        >
          {activeCountry ? (
            <PassportStatsCard country={activeCountry} />
          ) : (
            <div className="text-center text-gray-400 text-sm py-8 px-4">
              <svg
                className="w-12 h-12 mx-auto mb-3 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden lg:inline">Hover over a country to explore its passport mobility</span>
              <span className="lg:hidden">Tap a country on the map to explore its passport mobility</span>
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 sm:px-6 py-3 border-t border-gray-200 flex flex-wrap gap-4 text-xs text-gray-600">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-600" />
          <span className="hidden lg:inline">Hovered country</span>
          <span className="lg:hidden">Selected country</span>
        </span>
        {userCountryCode && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-500" /> Your country
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-green-500" /> Visa-free
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-teal-500" /> eVisa / ETA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-red-500" /> Traditional visa
        </span>
      </div>
    </div>
  );
};

export default VisaRequirementsMap;
