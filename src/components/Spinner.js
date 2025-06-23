import React from "react";

const Spinner = () => (
  <div style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "120px",
    width: "100%",
  }}>
    <div className="loader" />
    <style>{`
      .loader {
        border: 8px solid #f3f3f3;
        border-top: 8px solid #4286f4;
        border-radius: 50%;
        width: 48px;
        height: 48px;
        animation: spin 1s linear infinite;
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

export default Spinner;
