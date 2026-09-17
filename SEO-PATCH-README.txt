OnePickGame SEO 최종 패치 v3 — onepickgame(10).zip 기준 / 2026-09-17

적용 방법
1. 현재 프로젝트를 백업합니다.
2. 이 ZIP의 파일/폴더를 package.json과 server.js가 있는 프로젝트 루트에 그대로 덮어씁니다.
3. 먼저 npm start 로 로컬 확인합니다.
4. 로컬에서 /ko/quiz, /ko/quiz/<공개 퀴즈 UUID>, /quiz 를 확인한 뒤에만 git push 합니다.
5. 배포 후에는 /quiz -> /ko/quiz 영구 리디렉트, 소스의 title/description/canonical, sitemap을 확인합니다.

핵심 SEO 수정
- 언어 없는 /quiz 및 하위 주소를 /ko/quiz 쪽으로 영구 연결
- 퀴즈 목록/상세의 서버 HTML과 React SEO 데이터 통일
- 16개 언어별 퀴즈 제목/설명/canonical/hreflang/OG/Twitter 메타 적용
- 공개 퀴즈 상세만 index, 작성 화면 noindex, 미존재/비공개 퀴즈 404
- 기본 공유 이미지의 잘못된 /onepick-social.png 참조를 실제 /ogimg.png로 교체
- YouTube URL을 공유 이미지 썸네일 URL로 변환
- 퀴즈 카드/추천 카드를 실제 href가 있는 Link로 변경
- 공개 퀴즈 전용 /sitemap-quizzes.xml 추가 및 기존 sitemap index와 통합
- 구형 src/scripts sitemap 실행 파일을 현재 생성기로 연결
- 서버 SPA 템플릿 로딩 캐시/중복 요청 합치기
- original_language를 SEO 언어 목록에 반드시 포함
- 퀴즈 저장 시 원본 언어가 content_languages에서 빠지지 않도록 보강
- 월드컵/티어표 sitemap은 실제 updated_at이 있을 때만 lastmod 사용

중요: v2 런타임 오류 수정
- 이 프로젝트의 CRA/Webpack은 src 안의 .cjs 파일을 JavaScript 모듈이 아니라 static/media 파일 URL로 번들링합니다.
- 따라서 React 코드에서 src/seo/quizSeo.cjs를 import하면 getQuizSeo가 함수가 아니라 undefined가 되어 런타임 오류가 납니다.
- v3에서는 브라우저 전용 ESM 모듈 src/seo/quizSeo.js를 추가했습니다.
- React 파일은 이제 .cjs를 전혀 import하지 않습니다.
- server.js와 서버 SEO는 기존 src/seo/quizSeo.cjs를 그대로 사용합니다.

검증
- SEO 회귀 테스트: 15/15 통과
- 새 테스트가 React 클라이언트에서 quizSeo.cjs를 import하지 않는지 확인
- react-scripts 개발 서버: Compiled successfully
- 개발 번들 확인: src/seo/quizSeo.js가 실제 JS 모듈로 번들링되고 getQuizSeo named export가 생성됨
- react-scripts production build: Compiled successfully

주의
- npm start가 정상이어도 배포 전 /ko/quiz와 상세 페이지를 브라우저에서 직접 열어 최종 확인하세요.
- public/sitemaps/sitemap-*-v2.xml 같은 DB 기반 생성 산출물은 이 ZIP에 포함하지 않았습니다. build 시 최신 DB 기준으로 생성됩니다.
