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
    <div style={{ width: "100%", textAlign: "center", margin: "20px 0" }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{
          display: "block",
          width: "728px",   // ⭐ 고정으로 바꿔
          height: "90px",   // ⭐ 명시해야 뜸
          margin: "0 auto"
        }}
        data-ad-client="ca-pub-2906270915716379"
        data-ad-slot="3294216783"
        data-ad-format="horizontal"   // ⭐ auto 금지
      />
    </div>
  );
}