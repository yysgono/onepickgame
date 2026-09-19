OnePickGame v9 performance patch

이번 최적화
1) Tier List 홈 이미지 요청 감소
- MediaRenderer에 IntersectionObserver 기반 지연 렌더링 추가
- 화면 근처(약 180~220px)에 들어온 카드만 실제 이미지 요청
- 기존 loading=lazy와 함께 사용
- 티어 미리보기 후보를 티어당 6개 -> 4개로 줄여 카드당 불필요한 이미지 요청 감소

2) 월드컵 플레이 이미지 로딩
- 현재 대결 2명 이미지는 eager 로딩
- 다음 대결 이미지 최대 2장만 브라우저 idle 시간에 미리 로딩
- 현재 화면을 느리게 하지 않도록 requestIdleCallback / 지연 타이머 사용

3) 이전 v8/v7 기능 포함
- 모바일 이름 잘림 개선
- '중단하고 바로 통계 결과 보기'
- 월드컵 다국어 수정/생성
- 퀴즈/티어표 다국어 및 SEO 수정

DB
- v9 때문에 추가 SQL 실행 필요 없음

검증
- React production build: Compiled successfully
- 전체 npm run build는 이 실행환경에서 Supabase 외부 네트워크가 차단되어 sitemap 생성 단계만 실패
