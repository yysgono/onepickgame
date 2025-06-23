// src/components/Spinner.js
import React from "react";

const Spinner = () => (
  <div style={{
    display: "flex", justifyContent: "center", alignItems: "center", height: 140
  }}>
    <div className="loader"></div>
    <style>
      {`
      .loader {
        border: 8px solid #f3f3f3;
        border-top: 8px solid #1976ed;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg);}
        100% { transform: rotate(360deg);}
      }
      `}
    </style>
  </div>
);

export default Spinner;
