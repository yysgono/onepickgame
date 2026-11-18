# 월드컵 선택 HTML·통계 대표 주소 정리

업로드한 onepickgame(20261118-085723).zip의 관련 소스와 대조한 변경입니다.

## 변경

1. 기존 /:lang/stats/:id 요청은 존재하는 공개 월드컵인지 확인한 뒤 /:lang/result/:id로 HTTP 301 이동합니다. 기존 통계 링크는 계속 작동합니다. 내부 rewrite 파라미터는 제거하고 일반 쿼리 값은 유지합니다. 결과 페이지의 대표 주소와 서버 내부 통계 링크도 result를 사용합니다.
2. 월드컵 선택 페이지의 최초 HTML에 실제 후보 수와 결과/카테고리 링크를 추가했습니다. 20개 언어의 기존 문구를 재사용하며, 후보 수는 이미 읽은 데이터에서 계산하므로 추가 DB 조회가 없습니다. 기존 주요 후보 12명 목록을 유지합니다.
3. 선택 페이지의 초기 본문 글씨를 #ffffff에서 #202534로 바꿨습니다. 로딩 마크업이 달라져도 서버 본문이 빠지지 않도록 기존 insertRoot 함수를 재사용했습니다.
4. 사이트맵 생성기에 공개 누적 결과 /result/:id를 추가했습니다. /stats는 새로 넣지 않습니다. 결과 페이지의 실제 갱신 시각을 알 수 없어 임의의 lastmod는 붙이지 않았습니다.

제목·설명 저장값과 게임 진행, 후보 이미지, 통계 집계/RPC는 변경하지 않았습니다. 통계 표 생성 로직도 그대로 유지합니다. DB 쓰기·SQL 실행·프로덕션 배포·저장소 커밋/푸시는 수행하지 않았습니다.

## 적용

ZIP의 소스 파일을 같은 경로에 덮어쓰세요.
- server.js
- worldcup-view-routes.cjs
- scripts/generate-sitemap.mjs
- src/seo/worldcupEntryInfo.cjs (새 파일)

서버 코드 변경이므로 프런트엔드 파일만 교체해서는 적용되지 않습니다. 기존 배포 절차로 빌드·배포하고 서버를 재시작하세요. 기존 npm run build는 사이트맵을 다시 생성하므로 새 생성기까지 포함해 빌드하면 됩니다. 사이트맵만 별도로 운영한다면 npm run sitemap으로 재생성한 public/sitemaps 및 인덱스 XML을 정상 배포 경로에 반영하세요. 새 SQL·환경 변수는 없습니다.

## 검증

- Node 문법 검사 및 git diff --check 통과.
- tests/worldcup-entry-seo.cjs: 실제 서버 middleware에서 20개 언어의 후보 수·결과/카테고리 링크·읽을 수 있는 글씨·H1·기존 canonical/robots/스크립트 보존, 바뀐 로딩 마크업 처리, HTML 이스케이프 및 사이트맵 결과 URL 검증 통과.
- tests/worldcup-public-stats-route.cjs: 20개 언어 stats 301, result 대표 주소, 일반 쿼리 유지, rewrite 경로, 기존 통계 표·캐시·앱 스크립트 유지, 통계 오류/빈 결과/없는 ID 처리 검증 통과.
- tests/worldcup-public-stats.cjs: 실제 후보별 집계·정렬·비율·번역과 공개 표 검증 통과.

검증에는 테스트 데이터만 사용했습니다. 운영 사이트맵 생성이나 실제 배포 후 Google/네이버 색인 확인은 수행하지 않았습니다. 이 변경은 수집 구조를 정리하며 검색 노출·순위를 보장하지 않습니다.

## 배포 후 확인

/ko/stats/91b47d8c-72ec-4f4d-94bf-b88537d7da02 응답이 301이고 Location이 같은 ID의 /ko/result/ 주소인지 확인하세요. 선택 페이지 소스에서 worldcup-entry-count, worldcup-entry-links와 어두운 본문 글씨를 확인하세요. 결과 페이지의 공개 누적 통계 및 이미지를 확인하고 새 사이트맵에 result URL이 포함됐는지 확인하세요.
