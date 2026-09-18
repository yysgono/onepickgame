OnePickGame SEO v3 패치

목표
- 티어표 상세 페이지를 이상형 월드컵 상세처럼 서버에서 검색엔진이 읽을 수 있는 HTML로 제공
- 티어표 상세에 self-canonical / robots / hreflang / OG / JSON-LD / H1 / 설명 / 후보명 노출
- 티어표 sitemap은 실제 번역 언어가 있는 상세 URL만 포함
- 퀴즈는 제목 번역만 있다고 indexable 처리하지 않고, 실제 content_languages + original_language 기준으로 색인 언어 결정
- 기존 /quiz, /tier-list 홈 SEO는 유지

주요 변경 파일
- server.js
- vercel.json
- scripts/generate-sitemap.mjs
- src/components/TierListResultPage.js
- src/seo/quizSeo.js
- src/seo/quizSeo.cjs
- 이전 v2의 QuizMaker.js / TierListMaker.js / guest_tier_multilang_rpc.sql 포함

적용 순서
1) 이전 RPC SQL을 아직 실행하지 않았다면 guest_tier_multilang_rpc.sql 실행
2) ZIP의 파일들을 프로젝트 동일 경로에 덮어쓰기
3) 배포
4) 배포 후 실제 상세 URL의 '페이지 소스 보기'에서 다음을 확인
   - <title>에 실제 게임 제목
   - robots = index, follow (번역이 실제 존재하는 언어)
   - canonical = 현재 상세 URL
   - hreflang = 실제 번역 언어 상세 URL
   - HTML root 안에 H1/설명/후보명이 JS 실행 전부터 존재
5) sitemap_index-v2.xml 및 sitemap-quizzes.xml 재확인

검증
- React production build compiled successfully
- server.js 문법 검사 통과
- vercel.json JSON 검사 통과

주의
- 검색엔진 색인은 즉시 보장되지 않음. 이 패치는 월드컵과 비슷하게 '크롤러가 상세 콘텐츠를 서버 HTML에서 읽을 수 있는 구조'로 맞추는 작업임.
