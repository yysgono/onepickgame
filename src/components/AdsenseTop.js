import { useEffect } from "react";

export default function AdsenseTop() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", maxWidth: "728px" }}
        data-ad-client="ca-pub-2906270915716379"
        data-ad-slot="3294216783"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}