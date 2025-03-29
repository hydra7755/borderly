import React, { useState, useEffect, useRef } from 'react';
import { VisaRequirement, VisaTypeColors } from '../../types/visaRequirements';
import { getVisaRequirementsForCountry } from '../../data/visaRequirements';
import { getCountryName } from '../../data/countryCodes';

interface InteractiveMapProps {
  userNationality: string;
  onCountrySelect: (countryCode: string, visaDetails: VisaRequirement) => void;
  onSaveCountry?: (countryCode: string) => Promise<void>;
}

const InteractiveMap: React.FC<InteractiveMapProps> = ({ 
  userNationality, 
  onCountrySelect,
  onSaveCountry 
}) => {
  const [visaRequirements, setVisaRequirements] = useState<Record<string, VisaRequirement>>({});
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const mapRef = useRef<HTMLObjectElement>(null);
  
  useEffect(() => {
    const requirements = getVisaRequirementsForCountry(userNationality);
    setVisaRequirements(requirements);
  }, [userNationality]);

  // Apply colors to map after it loads
  useEffect(() => {
    const applyColorsToMap = () => {
      if (!mapRef.current) return;
      
      // Get the SVG document inside the Object tag
      const svgDoc = mapRef.current.contentDocument;
      if (!svgDoc) return;
      
      // Get all country paths
      const paths = svgDoc.querySelectorAll('path[data-country-code]');
      
      // Apply styles to each path
      paths.forEach((path) => {
        const countryCode = path.getAttribute('data-country-code');
        if (!countryCode) return;
        
        // Add event listeners
        path.addEventListener('mouseenter', (e) => {
          setHoveredCountry(countryCode);
          const rect = mapRef.current?.getBoundingClientRect();
          const mouseEvent = e as MouseEvent;
          if (rect) {
            setTooltipPosition({ 
              x: mouseEvent.clientX - rect.left, 
              y: mouseEvent.clientY - rect.top 
            });
          }
        });
        
        path.addEventListener('mouseleave', () => {
          setHoveredCountry(null);
        });
        
        path.addEventListener('click', () => {
          if (countryCode !== userNationality) {
            const visaInfo = visaRequirements[countryCode];
            if (visaInfo) {
              onCountrySelect(countryCode, visaInfo);
            }
          }
        });
        
        // Apply colors based on visa requirements
        if (countryCode === userNationality) {
          path.classList.add('user-country');
        } else if (visaRequirements[countryCode]) {
          path.classList.add(visaRequirements[countryCode].visaType);
        }
      });
    };
    
    // Add a small delay to ensure SVG is loaded
    const timer = setTimeout(applyColorsToMap, 500);
    
    return () => clearTimeout(timer);
  }, [visaRequirements, userNationality, onCountrySelect]);

  // Function to handle saving a country
  const handleSaveCountry = (countryCode: string) => {
    if (onSaveCountry) {
      onSaveCountry(countryCode);
    }
  };

  return (
    <div className="bg-white rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-xl font-semibold">Interactive Visa Requirements Map</h3>
        <p className="text-gray-600 my-2">
          Explore visa requirements for your {getCountryName(userNationality)} passport.
          Hover over any country to see details.
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

      <div className="relative overflow-hidden" style={{ height: "500px" }}>
        {/* Interactive SVG World Map */}
        <div 
          className="world-map-container"
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            overflow: 'hidden'
          }}
        >
          {/* External CSS for map styling */}
          <link rel="stylesheet" href="/map-styles.css" />
          
          <object 
            ref={mapRef}
            type="image/svg+xml" 
            data="/world-map.svg" 
            className="world-map" 
            aria-label="World Map"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Tooltip for hovered country */}
          {hoveredCountry && (
            <div 
              className="absolute bg-white p-2 rounded-md shadow-md border border-gray-200 z-10 pointer-events-auto"
              style={{ 
                left: `${tooltipPosition.x}px`, 
                top: `${tooltipPosition.y - 20}px`,
                transform: 'translate(-50%, -100%)'
              }}
            >
              <h4 className="font-medium">{getCountryName(hoveredCountry)}</h4>
              {visaRequirements[hoveredCountry] ? (
                <div className="text-sm">
                  <p>
                    <span className="font-medium">Status:</span> 
                    <span className="ml-1 capitalize">
                      {visaRequirements[hoveredCountry].visaType.replace('-', ' ')}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Duration:</span> 
                    <span className="ml-1">{visaRequirements[hoveredCountry].duration}</span>
                  </p>
                  {onSaveCountry && hoveredCountry !== userNationality && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveCountry(hoveredCountry);
                      }}
                      className="mt-2 text-xs bg-primary-600 text-white px-2 py-1 rounded hover:bg-primary-700"
                    >
                      Save Country
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No visa information available</p>
              )}
            </div>
          )}
        </div>
      </div>
      
      <div className="p-4 text-center text-sm text-gray-500">
        Hover over any country to see visa requirements. Click for details.
      </div>
    </div>
  );
};

export default InteractiveMap; 