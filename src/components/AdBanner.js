import React from "react";

const AdBanner = ({
  position,
  img,
  width,
  height,
  style = {},
  dynamic = false,
  visible = true,
}) => {
  // width/height 강제 고정 (dynamic 옵션 무시, 요청시만 적용)
  let w = width, h = height;

  if (!visible) return null;

  let posStyle = {};
  let isFixed = true;

  if (position === "left") {
    posStyle = { left: 24, top: "50%", transform: "translateY(-50%)" };
  } else if (position === "right") {
    posStyle = { right: 24, top: "50%", transform: "translateY(-50%)" };
  } else if (position === "top") {
    isFixed = false;
  } else if (position === "bottom") {
    posStyle = { left: "50%", bottom: 0, transform: "translateX(-50%)" };
  }

  return (
    <div
      className={`ad-banner ${position}`}
      style={{
        position: isFixed ? "fixed" : "static",
        zIndex: 1000,
        width: w,
        height: h,
        minWidth: w,
        minHeight: h,
        maxWidth: w,
        maxHeight: h,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents:
          position === "left" || position === "right" ? "none" : "auto",
        ...posStyle,
        ...style,
      }}
    >
      <img
        src={img}
        alt="ad"
        style={{
          width: w,
          height: h,
          objectFit: "cover",
          borderRadius: 16,
          pointerEvents: "auto",
          display: "block",
        }}
      />
    </div>
  );
};

export default AdBanner;
