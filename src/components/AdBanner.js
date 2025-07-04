import React from 'react';

const AdBanner = ({ position, img, width = 300, height = 250, style }) => {
  // 위치별 스타일
  let posStyle = {};
  let bannerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
    ...style,
  };

  // 상단은 static, 나머지는 fixed
  if (position === 'top') {
    posStyle = { width, height, margin: '0 auto', left: 0, right: 0, top: 0, position: 'static' };
    bannerStyle.position = 'static';
    bannerStyle.margin = '0 auto';
  } else if (position === 'bottom') {
    posStyle = { bottom: 28, left: '50%', transform: 'translateX(-50%)', position: 'fixed', width, height };
    bannerStyle.position = 'fixed';
  } else if (position === 'left') {
    posStyle = { top: '28vh', left: 30, transform: 'translateY(0)', position: 'fixed', width, height };
    bannerStyle.position = 'fixed';
  } else if (position === 'right') {
    posStyle = { top: '28vh', right: 30, transform: 'translateY(0)', position: 'fixed', width, height };
    bannerStyle.position = 'fixed';
  }

  return (
    <div
      className={`ad-banner ${position}`}
      style={{ ...bannerStyle, ...posStyle }}
    >
      <img
        src={img}
        alt="banner"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: 13,
          boxShadow: '0 2px 18px #0002',
        }}
      />
    </div>
  );
};

export default AdBanner;
