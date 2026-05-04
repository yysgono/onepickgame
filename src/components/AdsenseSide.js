// src/components/AdsenseSide.js
import React, { useEffect } from "react";

export default function AdsenseSide() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-2906270915716379"
      data-ad-slot="3294216783"
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}