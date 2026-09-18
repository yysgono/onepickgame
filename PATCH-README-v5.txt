OnePickGame v5 patch

추가 변경
1) 퀴즈/티어표 원본 언어 자동감지 방어 로직 유지
   - 신규 생성 시 메인 제목/설명의 감지된 원본 언어가 최우선입니다.
   - 감지된 원본 언어와 같은 번역 행/키가 있어도 저장 시 원본 제목/설명이 덮어써서 충돌하지 않습니다.
   - 기존 게임 수정 시에는 DB의 original_language를 자동감지로 바꾸지 않습니다.

2) 월드컵 생성 페이지
   - 'Content language' 선택을 바꾸면 페이지 contentLanguage, i18n 헤더 언어, localStorage(onepickgame_lang), 현재 URL의 언어 prefix를 함께 변경합니다.
   - 작성 중인 폼은 유지하고 같은 생성 페이지에서 언어만 전환합니다.

3) 월드컵 수정 페이지
   - 'Content language' 선택을 바꾸면 헤더 언어와 URL 언어도 함께 변경합니다.
   - 동일한 월드컵 수정 URL을 유지한 채 언어 prefix만 교체합니다.

적용
- 이전 v4 대신 이 v5 ZIP 기준으로 덮어쓰면 됩니다.
- DB SQL/RPC는 v4와 동일하며 이미 실행했다면 다시 실행할 필요 없습니다.
