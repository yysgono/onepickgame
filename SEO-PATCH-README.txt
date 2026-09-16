OnePickGame SEO patch — based on onepickgame (5).zip

적용 방법
1. 현재 프로젝트를 백업하세요.
2. 이 ZIP의 파일을 프로젝트 루트(package.json이 있는 폴더)에 같은 경로로 덮어쓰세요.
3. quiz-seo.cjs는 새 파일입니다. server.js와 같은 폴더에 반드시 함께 넣으세요.
4. 기존 방식으로 npm run build 및 Vercel 재배포를 실행하세요.
5. Google 실시간 URL 검사에서 /ko/quiz와 공개 퀴즈 상세 URL의 noindex 해제,
   canonical 및 제목을 확인한 후 색인 생성 요청을 하세요.
6. /api/sitemap-quizzes가 XML을 반환하고 기존 sitemap_index-v2.xml에
   해당 주소가 포함됐는지 확인하세요. 새 퀴즈는 약 5~15분 캐시 후 반영됩니다.

변경 사항
- 퀴즈 목록/상세: 클라이언트 title, description, canonical, 언어별 링크 추가.
- 퀴즈 서버 SEO: 공개 레코드만 조회하고 원시 HTML에도 제목, 설명, 링크 출력.
  미존재/잘못된 UUID는 404, DB 장애는 500. 정답이나 참가자 정보는 출력하지 않음.
- Vercel: 퀴즈 목록과 UUID 상세 경로만 서버 SEO에 연결. 생성 페이지는 제외.
- 공개 퀴즈 자동 사이트맵: 지원 언어만 상세 URL에 포함, 기존 인덱스에 연결.
- 빌드 사이트맵: 정책/약관/건의 canonical 주소 사용, 티어표 생성 폼 제외.
- AdGuard: 광고 숨김과 무관한 robots index 태그 제거.
- Seo: 영어 대체 페이지가 없는 경우 x-default 영어 링크를 만들지 않음.

유지한 사항
- 월드컵 홈의 LanguageWrapper → 언어별 페이지 → Home 연결과 서버 HOME_SEO.
- 기존 홈 제목/디자인/게임 기능/DB/번역 데이터.
- 최신 ZIP에 이미 적용된 SEOManager 퀴즈 허용 수정(따라서 이 파일은 ZIP에 없음).
- 티어표 생성 페이지의 기존 색인 정책은 유지하며 사이트맵에서만 제외.
- 카테고리 색인 정책은 임의로 변경하지 않음.

검증 및 한계
- 서버 JS 문법 검사 및 모의 DB로 목록/상세/사이트맵/404/500 테스트.
- 라이브 DB 쓰기 및 배포는 수행하지 않음.
- 전체 React production build와 실제 Vercel/Google 렌더링은 배포 환경에서 확인 필요.
- 파일은 UTF-8. 검색 순위나 노출은 보장하지 않음.
- 동적 퀴즈 사이트맵이 50,000 URL을 넘으면 분할 필요(오류로 알려줌).

원복: 백업한 동일 경로 파일로 복구하고 새 quiz-seo.cjs를 제외한 뒤 재배포.
