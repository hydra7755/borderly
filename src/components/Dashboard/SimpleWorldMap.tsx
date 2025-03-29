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

interface SimpleWorldMapProps {
  userNationality: string;
  onCountrySelect: (countryCode: string, visaDetails: VisaRequirement) => void;
}

// URL to the topojson world map
const geoUrl = 'https://raw.githubusercontent.com/deldersveld/topojson/master/world-countries.json';

const SimpleWorldMap: React.FC<SimpleWorldMapProps> = ({ userNationality, onCountrySelect }) => {
  // State for visa requirements data
  const [visaRequirements, setVisaRequirements] = useState<Record<string, VisaRequirement>>({});
  
  // Fetch visa requirements when nationality changes
  useEffect(() => {
    const requirements = getVisaRequirementsForCountry(userNationality);
    setVisaRequirements(requirements);
  }, [userNationality]);

  // Get color for a country based on visa requirements
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

  // Handle country click
  const handleCountryClick = (geo: any) => {
    const countryCode = geo.properties.ISO_A2;
    const visaInfo = visaRequirements[countryCode];
    
    if (countryCode !== userNationality && visaInfo) {
      onCountrySelect(countryCode, visaInfo);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Visa Requirements Map</h3>
        <p className="text-gray-600 my-2">
          Explore visa requirements for your {getCountryName(userNationality)} passport.
        </p>
        
        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-free'] }}></div>
            <span>Visa-Free</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['e-visa'] }}></div>
            <span>eVisa</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-on-arrival'] }}></div>
            <span>Visa on Arrival</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: VisaTypeColors['visa-required'] }}></div>
            <span>Visa Required</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 mr-1" style={{ backgroundColor: '#4B5563' }}></div>
            <span>Your Country</span>
          </div>
        </div>
      </div>

      <div style={{ height: "480px" }}>
        <ComposableMap
          projection="geoEquirectangular"
          projectionConfig={{ scale: 147 }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup zoom={1} center={[0, 0]}>
            <Sphere stroke="#DDD" strokeWidth={0.5} />
            <Graticule stroke="#DDD" strokeWidth={0.5} />
            <Geographies geography={geoUrl}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getCountryFill(geo)}
                    stroke="#FFFFFF"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: "none" },
                      hover: { 
                        fill: "#A7F3D0", 
                        outline: "none",
                        cursor: "pointer" 
                      },
                      pressed: { outline: "none" }
                    }}
                    onClick={() => handleCountryClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>
      
      <div className="p-4 text-center text-sm text-gray-500">
        Click on any country to see detailed visa requirements
      </div>
    </div>
  );
};

export default SimpleWorldMap; 