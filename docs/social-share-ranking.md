# 구절판 정렬 및 플랫폼 공유 수정

## 확인 결과 (2026-11-15)

구절판 최신순은 created_at 내림차순, 인기순은 view_count 내림차순 다음 created_at 내림차순이었다. 공개 REST 조회로 확인한 인기순/최신순 상위 12개가 동일하고 조회수가 모두 0이었다. 따라서 버튼이 같은 조회를 하는 문제가 아니라 조회수 동점으로 같은 목록이 나오는 상태였다. NULL을 뒤로 정렬해도 결과는 같았다.

기존 record_top_nine_view RPC는 존재한다. 읽기 방식의 잘못된 UUID 인자 요청에서 22P02 타입 검증 오류가 돌아오는 것으로 확인했으며, 실제 조회수를 늘리는 호출은 하지 않았다. 서버 함수 본문과 DB 로그에 접근하지 않았으므로 기존 집계가 0인 근본 원인을 단정하지 않는다. 기존 클라이언트가 Supabase의 resolved `{error}`를 무시하는 문제는 확인했다.

## 적용 순서 — SQL 적용 필요

1. Supabase 프로젝트 SQL Editor에서 `supabase/20261115_top_nine_view_tracking.sql`을 실행한다.
2. 이 패치의 소스 파일을 반영하고 빌드·배포한다. 이 작업에서는 실제 DB 변경/커밋/푸시/배포를 하지 않았다.
3. 공개 구절판 상세를 연 뒤 목록을 새로고침한다. 해당 조회수가 1 증가하고 인기순에 반영되는지 확인한다. 같은 탭의 반복 조회는 중복 집계하지 않는다. 조회수가 같으면 최신순과 같을 수 있다.

새 RPC record_top_nine_view_v2와 전용 세션 집계 테이블을 추가했다. 기존 RPC와 기존 조회수는 유지한다. 한 브라우저 탭 세션/구절판당 한 번 집계하며 원자적 INSERT/UPDATE와 PK로 동시 중복을 막는다. 익명 사용자에게 테이블 쓰기 권한을 주지 않고 RPC 실행만 허용한다. 삭제 시 세션 기록도 지워진다. 집계 방식 변경으로 과거 조회수를 자동 복원하지는 않는다. 이는 브라우저 세션 기반 인기 지표이며 정확한 고유 사용자 분석이나 부정 클릭 방지 체계는 아니다.

클라이언트는 기록 성공 후에만 완료 처리하고 오류를 console.warn으로 남긴다. 저장소 차단/crypto.randomUUID 미지원 환경에서도 crypto.getRandomValues로 세션 ID를 만들며, 공개 상세가 정상 로드된 뒤에만 집계한다. 비공개/미등록 단축 링크는 집계하지 않는다. 목록에는 조회수와 동점 정렬 기준을 표시한다.

## 플랫폼 공유

- 구절판 상세/공유 링크 생성 후 미리보기, 티어표 결과, 퀴즈 시작 화면, 월드컵 시작/결과/순위표에 공통 버튼을 연결했다.
- X와 Threads는 현지화된 제목과 해당 페이지 링크를 채운 작성 창을 연다. 게시 확정은 사용자가 플랫폼에서 한다.
- 링크 복사는 클립보드 실패 시 선택 영역 복사를 시도하고 성공/실패를 표시한다.
- 월드컵 결과/순위표는 실제 공개 canonical 경로 `/언어/result/ID`를 공유한다. `/stats/ID`는 앱에서 이 경로로 리다이렉트되는 기존 별칭이다. 개인 경기의 임시 상태나 되돌리기 기록을 URL에 넣지 않는다.
- 구절판의 로컬 사진은 기존 회원 업로드/등록 절차를 유지한다. 공개 링크를 만들기 전에 로컬 사진이나 초안을 외부 공유 URL에 넣지 않는다. 편집 후에는 이전 공유 링크를 숨기고 다시 생성하도록 한다.
- 공유 문구는 기존 지원 언어 20개에 적용했다.

### Instagram 버튼 — 카카오톡 제거

카카오톡 버튼·SDK·키 설정 의존성을 제거했다. 이제 X, Threads, Instagram, 링크 복사 버튼을 제공한다.

Instagram은 X처럼 웹 링크로 게시 내용을 미리 채우는 공유 창을 지정해 열 수 없다. Instagram 버튼은 Web Share API를 지원하는 기기에서 제목과 공개 URL을 넣은 시스템 공유 메뉴를 연다. Instagram이 공유 대상에 나타나는지는 기기·설치 앱·공유 데이터 형식에 따라 달라지고, 이 웹사이트에서 Instagram을 강제로 선택하거나 공유 완료 여부를 확인하지 않는다.

공유 기능이 없거나 실행할 수 없으면 공개 링크를 복사하고 이미지 다운로드/직접 업로드/스토리 링크 스티커 사용 방법을 안내한다. 사용자가 공유 메뉴를 취소한 경우에는 링크를 몰래 복사하거나 성공 문구를 표시하지 않는다. 게시 결과 이미지 파일을 Instagram 앱으로 직접 전송하는 기능을 구현한 것은 아니다. 기존 이미지 다운로드 버튼은 그대로 사용한다. 안내 문구는 지원하는 20개 언어에 적용했다.

기존 `src/config/socialShare.json` 파일이 남아 있어도 더 이상 참조하지 않으며 삭제해도 된다. 이 변경 자체에는 새 SQL이나 외부 플랫폼 API 키가 필요하지 않다. 앞서 구절판 조회수 집계를 고치기 위한 SQL 적용 요구는 별개로 유지된다.

공식 Web Share API 참고: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share

## 검증

- `node tests/social-share-ranking.cjs`: 20개 언어 공유 URL 인코딩, 복사 성공/실패 및 대체 방식, Instagram 공유 메뉴/취소/미지원·실패 대체 처리, 로컬 URL 차단, 조회 기록 동시 중복/DB 오류/재시도/저장소 차단, 실제 갤러리 컴포넌트의 정렬·페이지 초기화.
- `node tests/social-share-production.cjs ../social-share-ranking-build`: 실제 CRA 번들로 한국어/영어 6개 화면씩(홈 정렬, 구절판 상세, 퀴즈, 티어표, 월드컵 시작/결과) 확인. 외부 DB 및 게시 플랫폼은 모의 응답을 사용했다.
- `node tests/top-nine-view-sql.cjs`: PGlite PostgreSQL에서 SQL 실행, 익명 권한/중복 방지/기존 값 유지/NULL/삭제/재실행 검증. 검증용 의존성은 앱 package.json/lockfile을 변경하지 않고 별도 설치했다. 다른 경로에서 실행하려면 PGLITE_MODULE 환경 변수에 설치 모듈 절대 경로를 지정한다.
- 기존 등록 후 상세 이동 및 월드컵 진행/되돌리기 회귀 테스트, CI=true 최적화 CRA 빌드 통과.

## random.gg 공개 SEO 구조 확인

확인 주소: https://www.random.gg/ , https://www.random.gg/tiermaker?u=DE7FadpZNt , https://www.random.gg/robots.txt , https://www.random.gg/sitemap.xml

| 확인한 구조 | 의미 및 한계 |
| --- | --- |
| 홈의 첫 HTML에 설명적인 title/description/h1, 실제 콘텐츠 제목과 내부 링크 155개 | JavaScript를 기다리지 않아도 주제와 상세 페이지를 발견할 수 있음. 링크 수 자체가 점수라는 뜻은 아님 |
| 상세에 후보명, 순위, 사용자 설명, 태그, 참여 결과/댓글 | 이미지 외에도 검색 질의와 연결되는 고유 본문과 주제별 연결이 있음 |
| 홈 self canonical, WebSite/Organization JSON-LD | 대표 URL과 사이트 정보를 명시함. 구조화 데이터만으로 순위를 보장하지 않음 |
| robots의 일반 User-agent 허용 및 /api/ 차단, 사이트맵 인덱스에 유형별 사이트맵 | 공개 콘텐츠 발견 경로가 정리되어 있음. 사이트맵 lastmod의 정확성과 모든 하위 페이지 색인을 검증한 것은 아님 |

구글 실제 유입량·Search Console·백링크·검색어별 순위는 확인하지 않았다. 위 구조가 검색 친화적이라는 관찰이지, 잘 노출되는 유일한 원인이라는 결론은 아니다. 공유 버튼은 공유 유입에 도움을 주는 기능이며 자동 색인/상위 노출 버튼이 아니다.

OnePickGame에도 기존 SSR/SEO 구현이 있다. 이번 비교만으로 OnePickGame의 특정 색인 제외 원인이나 모든 페이지 상태를 판정하지 않았다. 후보 이름·공개 순위 등 고유 본문과 주제별 내부 연결을 충실히 제공하는 방향은 참고할 수 있다.

공식 참고: https://developers.google.com/search/docs/essentials , https://developers.google.com/search/docs/crawling-indexing/links-crawlable 
