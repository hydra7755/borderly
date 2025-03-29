import React, { useState, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Sphere,
  Graticule
} from 'react-simple-maps';
import { getVisaRequirementsForCountry } from '../../data/visaRequirements';
import { VisaTypeColors, VisaRequirement } from '../../types/visaRequirements';
import { getCountryName } from '../../data/countryCodes';

interface WorldMapProps {
  userNationality: string;
  onCountrySelect?: (countryCode: string, visaDetails: VisaRequirement) => void;
}

// URL to the world map topojson
const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

const WorldMap: React.FC<WorldMapProps> = ({ userNationality, onCountrySelect }) => {
  const [tooltipContent, setTooltipContent] = useState<{ 
    country: string; 
    visaInfo: VisaRequirement | null; 
    position: { x: number; y: number } 
  } | null>(null);
  const [visaRequirements, setVisaRequirements] = useState<Record<string, VisaRequirement>>({});
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  useEffect(() => {
    // Get visa requirements for the current user's nationality
    const requirements = getVisaRequirementsForCountry(userNationality);
    setVisaRequirements(requirements);
  }, [userNationality]);

  // Handle mouse entering a country
  const handleMouseEnter = (geo: any, evt: React.MouseEvent) => {
    const countryCode = geo.properties.ISO_A2;
    const visaInfo = visaRequirements[countryCode] || null;
    
    // Don't show tooltip for user's own country
    if (countryCode === userNationality) return;
    
    setTooltipContent({
      country: geo.properties.NAME || getCountryName(countryCode),
      visaInfo,
      position: { x: evt.clientX, y: evt.clientY }
    });
    setShowTooltip(true);
  };

  // Handle mouse leaving a country
  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  // Handle clicking on a country
  const handleCountryClick = (geo: any) => {
    const countryCode = geo.properties.ISO_A2;
    const visaInfo = visaRequirements[countryCode] || null;
    
    // Don't select user's own country
    if (countryCode === userNationality) return;
    
    setSelectedCountry(countryCode);
    
    if (onCountrySelect && visaInfo) {
      onCountrySelect(countryCode, visaInfo);
    }
  };

  // Determine the color of a country
  const getCountryFill = (geo: any) => {
    const countryCode = geo.properties.ISO_A2;
    
    // If it's the user's own country, return a distinct color
    if (countryCode === userNationality) {
      return '#4B5563'; // Gray for own country
    }
    
    const visaInfo = visaRequirements[countryCode];
    if (!visaInfo) {
      return '#E5E7EB'; // Light gray for unknown status
    }
    
    return VisaTypeColors[visaInfo.visaType] || '#E5E7EB';
  };

  return (
    <div className="worldmap-container relative bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold mb-2">Visa Requirements Map</h3>
        <p className="text-gray-600 mb-4">
          Explore visa requirements for your {getCountryName(userNationality)} passport around the world.
        </p>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-2">
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: VisaTypeColors['visa-free'] }}></div>
            <span className="text-sm">Visa-Free</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: VisaTypeColors['e-visa'] }}></div>
            <span className="text-sm">eVisa</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: VisaTypeColors['visa-on-arrival'] }}></div>
            <span className="text-sm">Visa on Arrival</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: VisaTypeColors['visa-required'] }}></div>
            <span className="text-sm">Visa Required</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#4B5563' }}></div>
            <span className="text-sm">Your Country</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: '#E5E7EB' }}></div>
            <span className="text-sm">No Data</span>
          </div>
        </div>
      </div>

      <div className="world-map-wrapper" style={{ height: '500px', overflow: 'hidden' }}>
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{
            scale: 147,
          }}
          style={{ width: '100%', height: '100%' }}
        >
          <ZoomableGroup zoom={1} center={[0, 0]}>
            <Sphere stroke="#DDD" strokeWidth={0.5} />
            <Graticule stroke="#DDD" strokeWidth={0.5} />
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFill(geo)}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        outline: 'none',
                      },
                      hover: {
                        fill: selectedCountry === geo.properties.ISO_A2 
                          ? getCountryFill(geo) 
                          : '#A7F3D0',
                        outline: 'none',
                        cursor: 'pointer',
                      },
                      pressed: {
                        outline: 'none',
                      },
                    }}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleCountryClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Tooltip */}
      {tooltipContent && showTooltip && (
        <div 
          className="fixed bg-white p-2 rounded-md shadow-md border border-gray-200 z-10 min-w-40"
          style={{ 
            left: `${tooltipContent.position.x}px`, 
            top: `${tooltipContent.position.y}px`,
            transform: 'translate(10px, -110%)'
          }}
        >
          <h4 className="font-medium">{tooltipContent.country}</h4>
          {tooltipContent.visaInfo ? (
            <div className="text-sm">
              <p>
                <span className="font-medium">Status:</span> 
                <span className="ml-1 capitalize">{tooltipContent.visaInfo.visaType.replace('-', ' ')}</span>
              </p>
              <p>
                <span className="font-medium">Duration:</span> 
                <span className="ml-1">{tooltipContent.visaInfo.duration}</span>
              </p>
              {tooltipContent.visaInfo.notes && (
                <p>
                  <span className="font-medium">Notes:</span> 
                  <span className="ml-1">{tooltipContent.visaInfo.notes}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No visa information available</p>
          )}
        </div>
      )}
    </div>
  );
};

export default WorldMap; 