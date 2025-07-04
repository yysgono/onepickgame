import React from 'react';

const AdBanner = ({
  position,
  img,
  width = 300,
  height = 250,
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
    // 상단 배너는 static, 크기 제한은 css에서!
    isFixed = false;
    posStyle = {};
  } else if (position === 'bottom') {
    posStyle = { position: 'fixed', left: '50%', bottom: 0, transform: 'translateX(-50%)' };
  } else if (position === 'left') {
    posStyle = { position: 'fixed', top: '50%', left: 24, transform: 'translateY(-50%)' };
    localStyle = { ...localStyle, width, maxWidth: 360, minWidth: 120, maxHeight: '95vh' };
  } else if (position === 'right') {
    posStyle = { position: 'fixed', top: '50%', right: 24, transform: 'translateY(-50%)' };
    localStyle = { ...localStyle, width, maxWidth: 360, minWidth: 120, maxHeight: '95vh' };
  }

  return (
    <div
      className={`ad-banner ${position}`}
      style={{
        ...(isFixed ? { position: 'fixed', zIndex: 1000 } : { position: 'static' }),
        ...localStyle,
        ...posStyle,
      }}
    >
      <img
        src={img}
        alt="banner"
        style={{
          width: position === 'top' ? '100%' : '100%',
          height: position === 'top' ? 'auto' : '100%',
          objectFit: 'cover',
          borderRadius: position === 'top' ? 14 : 13,
          boxShadow: '0 2px 18px #0002',
          maxWidth: position === 'top' ? 1200 : undefined,
          maxHeight: position === 'top' ? 140 : undefined,
          minWidth: position === 'top' ? 320 : undefined,
        }}
      />
    </div>
  );
};

export default AdBanner;
