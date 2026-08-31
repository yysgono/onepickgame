import { useEffect, useRef } from "react";

export default function AdsenseTop() {
  const adRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (adRef.current) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        }
      } catch (e) {
        console.log(e);
      }
    }, 300); // ⭐ 딜레이 핵심

    return () => clearTimeout(timer);
  }, []);

return (
  <div
    style={{
      width: "100%",
      display: "flex",
      justifyContent: "center",
      boxSizing: "border-box",
      padding: "0 10px",
      margin: "10px 0 0",
      overflow: "hidden",
    }}
  >
    <ins
      ref={adRef}
      className="adsbygoogle"
      style={{
        display: "block",
        width: "100%",
        maxWidth: "728px",
               margin: "0 auto",
      }}
      data-ad-client="ca-pub-2906270915716379"
      data-ad-slot="3294216783"
      data-ad-format="horizontal"
      data-full-width-responsive="true"
    />
  </div>
);
}