// src/components/Spinner.js
import React from "react";

const Spinner = ({ size = 60 }) => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: size + 24,
    margin: "50px 0"
  }}>
    <div style={{
      width: size,
      height: size,
      border: `${size / 10}px solid #e3f0fb`,
      borderTop: `${size / 10}px solid #1976ed`,
      borderRadius: "50%",
      animation: "spin 1.1s linear infinite"
    }} />
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg);}
          100% { transform: rotate(360deg);}
        }
      `}
    </style>
  </div>
);

export default Spinner;
