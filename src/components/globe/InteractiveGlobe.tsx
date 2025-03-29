import React, { useRef, useEffect, memo } from 'react';
import Globe from 'react-globe.gl';
import { useWindowSize } from '../../hooks/useWindowSize';
import { motion } from 'framer-motion';

// We'll remove all the country point data for a cleaner look matching the reference image
interface ArcData {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
}

// Empty arc data for cleaner look
const ARC_DATA: ArcData[] = [];

interface InteractiveGlobeProps {
  className?: string;
  rotationSpeed?: number;
  globeWidth?: number;
  globeHeight?: number;
}

// Memoize the Globe component to prevent unnecessary re-renders
const InteractiveGlobe: React.FC<InteractiveGlobeProps> = memo(({ 
  className = '', 
  rotationSpeed = 0.2,
  globeWidth,
  globeHeight
}) => {
  const globeEl = useRef<any>();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  
  // Adjust globe size for mobile and allow override through props
  const defaultWidth = isMobile ? 350 : 500;
  const defaultHeight = isMobile ? 350 : 500;
  const finalWidth = globeWidth || defaultWidth;
  const finalHeight = globeHeight || defaultHeight;
  
  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotation
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = rotationSpeed;
      
      // Set initial position to show Europe/Africa
      globeEl.current.pointOfView({
        lat: 22,
        lng: 15,
        altitude: 2.2
      }, 0);
      
      // Add a light to create shadow effect
      if (globeEl.current.scene()) {
        const scene = globeEl.current.scene();
        scene.children.forEach((child: any) => {
          if (child.type === 'DirectionalLight') {
            child.intensity = 1.5;
            child.position.set(200, 200, 200);
          }
        });
      }

      // Cleanup function to dispose of Three.js resources
      return () => {
        if (globeEl.current && globeEl.current.scene()) {
          const scene = globeEl.current.scene();
          scene.traverse((object: any) => {
            if (object.geometry) {
              object.geometry.dispose();
            }
            if (object.material) {
              if (Array.isArray(object.material)) {
                object.material.forEach((material: any) => material.dispose());
              } else {
                object.material.dispose();
              }
            }
          });
        }
      };
    }
  }, [rotationSpeed]);
  
  return (
    <motion.div 
      className={`relative ${className}`}
      style={{ width: '100%', height: '100%' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.7 }}
    >
      {/* Enhanced glow effect for 3D feel */}
      <div 
        className="absolute inset-0 bg-blue-500 opacity-15 rounded-full filter blur-3xl"
        style={{ 
          width: finalWidth,
          height: finalHeight,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
      
      {/* Shadow effect below globe */}
      <div 
        className="absolute rounded-full bg-black/15 filter blur-md"
        style={{ 
          width: finalWidth * 0.85,
          height: finalHeight * 0.08,
          left: '50%',
          top: '87%',
          transform: 'translate(-50%, -50%) rotateX(45deg)',
        }}
      />
      
      <Globe
        ref={globeEl}
        width={finalWidth}
        height={finalHeight}
        globeImageUrl="/images/earth-blue-marble.jpg"
        bumpImageUrl="/images/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)" // Transparent background
        backgroundImageUrl=""
        atmosphereColor="rgba(120, 170, 255, 0.25)"
        atmosphereAltitude={0.18}
        showGlobe={true}
        showAtmosphere={true}
      />
    </motion.div>
  );
});

export default InteractiveGlobe; 