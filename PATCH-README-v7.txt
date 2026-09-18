OnePickGame v7

v6 수정:
- 기존 worldcups.original_language가 NULL인 월드컵에서
  현재 페이지 언어를 원본 언어로 잘못 간주하여,
  예: 한국어 페이지 진입 시 title_translations.ko를 기본 영어 title로 덮어쓰던 문제 수정.

v7 동작:
- original_language가 있으면 그대로 사용
- NULL이면 title_translations 중 DB의 base title과 정확히 일치하는 언어를 찾아 원본 언어로 추론
- 이미 존재하는 번역값(ko, pt, zh 등)은 절대 base title로 덮어쓰지 않음
- Content language 변경 시 해당 title_translations[lang] / description_translations[lang] 표시
- 헤더 언어 및 URL prefix도 함께 변경
- 기존 데이터 수정 시 original_language는 보존

이번 v7 때문에 추가 SQL 실행은 필수가 아닙니다.
기존 RPC/컬럼 SQL을 이미 적용했다면 코드만 덮어써서 배포하면 됩니다.

검증:
- React production build: Compiled successfully.
