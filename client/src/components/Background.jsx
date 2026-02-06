import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
// Import Vanta effect (might attach to window.VANTA)
import 'vanta/dist/vanta.globe.min';

const Background = () => {
  const [vantaEffect, setVantaEffect] = useState(null);
  const myRef = useRef(null);

  useEffect(() => {
    if (!vantaEffect && myRef.current) {
      // Vanta might be on window.VANTA.GLOBE or just window.GLOBE depending on the script
      // Usually vanta.globe.min.js defines window.VANTA.GLOBE or window.GLOBE
      const initVanta = window.VANTA?.GLOBE || window.GLOBE;
      
      if (typeof initVanta === 'function') {
          setVantaEffect(initVanta({
            el: myRef.current,
            THREE: THREE,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x3a6df0,       // Accent Blue
            color2: 0x8e2de2,      // Accent Purple
            backgroundColor: 0x10121b // Dark Background
          }));
      } else {
          console.error("Vanta GLOBE not found on window.VANTA or window");
      }
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

  return (
    <div 
      ref={myRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none' // Ensure clicks pass through
      }} 
    />
  );
};

export default Background;
