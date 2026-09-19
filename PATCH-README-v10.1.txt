OnePickGame v10.1 - 홈 이미지 렌더링 핫픽스

v10 문제:
- 월드컵 홈 카드의 이미지에 custom IntersectionObserver defer를 중복 적용하면서,
  화면에 보이는 카드에서도 이미지가 늦게/아예 렌더되지 않는 현상이 발생할 수 있었습니다.

v10.1 수정:
- 월드컵 홈 카드에서는 custom deferUntilVisible을 제거했습니다.
- 현재 실제로 렌더링된 카드 이미지는 브라우저 native loading=lazy로 정상 표시됩니다.
- 성능 최적화 핵심은 그대로 유지합니다:
  * 처음엔 K-Celeb / People / Anime-Manga만 렌더링
  * 나머지 카테고리는 '더 많은 카테고리 보기' 클릭 후 렌더링
  * 각 행의 다음 카드 묶음은 > 클릭 전에는 React 렌더 자체를 하지 않음
  * 따라서 > 뒤의 카드 이미지도 시작 시 요청되지 않음
- Match.js 집계/승률/진행 로직은 수정하지 않았습니다.

검증:
- React production build: Compiled successfully
- DB SQL 추가 실행 필요 없음
