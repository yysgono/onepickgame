OnePickGame v10 - 홈 성능 최적화 안전판

핵심 원칙
- Match.js의 집계/승률/진행 로직은 이번 작업에서 수정하지 않았습니다.
- 포함된 Match.js는 v8 안전판과 동일한 파일입니다.

월드컵 홈
1) 기본 화면에서는 K-Celeb / People / Anime-Manga 세 카테고리만 먼저 렌더링합니다.
2) Games / Sports / Music / Movies-TV / Food / Other는
   '더 많은 카테고리 보기'를 눌렀을 때 처음 렌더링합니다.
3) 각 가로 카테고리 행은 처음 화면에 들어가는 카드 수만 렌더링합니다.
4) 오른쪽 > 버튼을 누르면 그때 다음 카드 묶음을 렌더링하고 스크롤합니다.
5) 카드 이미지도 IntersectionObserver + loading=lazy로 화면 근처에서만 요청합니다.
6) 카드 통계 조회도 실제 렌더링된 카드만 대상으로 합니다.
7) 검색 중 / 내 콘텐츠 화면에서는 결과 누락 방지를 위해 카테고리 접기를 강제하지 않습니다.

퀴즈 홈
- 카드 이미지를 화면 근처에서만 요청합니다.
- 동일한 퀴즈 목록/추천 목록 요청이 짧은 시간에 중복될 경우 5초 캐시 + in-flight dedupe로 한 번만 요청합니다.
- 생성/삭제 후 캐시는 자동 초기화합니다.

티어표 홈
- 기존 v9 이미지 지연 로딩/미리보기 축소 유지
- 같은 목록 조회가 짧은 시간에 반복될 경우 5초 캐시 + in-flight dedupe 적용

검증
- React production build: Compiled successfully
- Match.js: v8 안전판과 byte-for-byte 동일 확인
- 이번 v10 때문에 Supabase SQL 추가 실행은 필요 없습니다.

배포 후 확인 권장
- /en 홈 Network: 초기 request 수 / transferred / DOMContentLoaded / Load
- K-Celeb, People, Anime-Manga 아래에 '더 많은 카테고리 보기' 노출
- 오른쪽 > 클릭 전 다음 카드 이미지가 요청되지 않는지 확인
- > 클릭 후 다음 카드 이미지가 그때 요청되는지 확인
