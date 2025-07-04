// src/components/AdBanner.js

import React from 'react';

const AdBanner = ({
  position,
  img,
  width,
  height,
  style = {},
}) => {
  // 사이드 배너는 항상 고정값
  if (position === 'left' || position === 'right') {
    width = 300;
    height = 600;
  }

  let posStyle = {};
  let isFixed = true;

  if (position === 'left') {
    posStyle = { left: 24, top: '50%', transform: 'translateY(-50%)' };
  } else if (position === 'right') {
    posStyle = { right: 24, top: '50%', transform: 'translateY(-50%)' };
  } else if (position === 'top') {
    isFixed = false;
  } else if (position === 'bottom') {
    posStyle = { left: '50%', bottom: 0, transform: 'translateX(-50%)' };
  }

  // 사이드 배너만 픽셀 고정
  const fixedSize = (position === 'left' || position === 'right')
    ? {
        width: 300,
        height: 600,
        minWidth: 300,
        minHeight: 600,
        maxWidth: 300,
        maxHeight: 600,
      }
    : {};

  return (
    <div
      className={`ad-banner ${position}`}
      style={{
        position: isFixed ? 'fixed' : 'static',
        zIndex: 1000,
        pointerEvents: (position === 'left' || position === 'right') ? 'none' : 'auto',
        ...fixedSize,
        ...posStyle,
        ...style,
      }}
    >
      <img
        src={img}
        alt="ad"
        style={{
          width: (position === 'left' || position === 'right') ? 300 : width || "100%",
          height: (position === 'left' || position === 'right') ? 600 : height || "auto",
          objectFit: 'cover',
          borderRadius: 16,
          pointerEvents: 'auto',
          display: 'block',
        }}
      />
    </div>
  );
};

export default AdBanner;
