import { useEffect } from "react";

export default function AdSense() {
  useEffect(() => {
    try {
      if (window.adsbygoogle && window.adsbygoogle.loaded) {
        window.adsbygoogle.push({});
      } else {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // 광고 로드 실패 시 무시
    }
  }, []);

  return (
    <div className="ad-container">
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-2906270915716379"
        data-ad-slot="3294216783"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
