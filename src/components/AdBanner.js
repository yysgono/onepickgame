// src/components/AdBanner.js

import React from 'react';

const AdBanner = ({
  position,
  img,
  width = 300,
  height = 600, // 사이드 기본 300x600
  style = {},
}) => {
  let posStyle = {};
  let isFixed = true;
  let localStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    ...style,
  };

  if (position === 'top') {
    isFixed = false;
    posStyle = {};
    width = '100%';
    height = 'auto';
  } else if (position === 'bottom') {
    posStyle = { position: 'fixed', left: '50%', bottom: 0, transform: 'translateX(-50%)' };
    width = 970;
    height = 90;
  } else if (position === 'left') {
    posStyle = { position: 'fixed', top: '50%', left: 24, transform: 'translateY(-50%)' };
    width = 300;
    height = 600;
  } else if (position === 'right') {
    posStyle = { position: 'fixed', top: '50%', right: 24, transform: 'translateY(-50%)' };
    width = 300;
    height = 600;
  }

  return (
    <div
      className={`ad-banner ${position}`}
      style={{
        ...(isFixed ? { position: 'fixed', zIndex: 1000 } : { position: 'static' }),
        ...localStyle,
        ...posStyle,
        width: position === "top" ? "100%" : width,
        height: position === "top" ? "auto" : height,
        minWidth: position === "top" ? undefined : width,
        minHeight: position === "top" ? undefined : height,
        maxWidth: position === "top" ? undefined : width,
        maxHeight: position === "top" ? undefined : height,
        pointerEvents: position === "left" || position === "right" ? "none" : "auto",
      }}
    >
      <img
        src={img}
        alt="banner"
        style={{
          width: width,
          height: height,
          objectFit: 'cover',
          borderRadius: 16,
          boxShadow: '0 2px 18px #0002',
          display: "block",
          pointerEvents: position === "left" || position === "right" ? "auto" : "auto",
        }}
      />
    </div>
  );
};

export default AdBanner;
