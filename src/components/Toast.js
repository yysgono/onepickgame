import React, { useEffect, useState } from "react";

function Toast({ message, onClose, duration = 2000 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const hideTimer = setTimeout(() => setVisible(false), duration - 400);
    const closeTimer = setTimeout(() => onClose(), duration);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(closeTimer);
    };
  }, [message, onClose, duration]);

  if (!message) return null;
  return (
    <div style={{
      position: "fixed",
      bottom: 40,
      left: "50%",
      transform: "translateX(-50%)",
      background: "#ffffff",
      color: "#202534",
      padding: "14px 28px",
      borderRadius: 12,
      fontWeight: 600,
      fontSize: 18,
      zIndex: 9999,
      boxShadow: "0 4px 16px rgba(25,32,52,0.07)",
      opacity: visible ? 1 : 0,
      transition: "opacity 0.4s"
    }}>
      {message}
    </div>
  );
}
export default Toast;
