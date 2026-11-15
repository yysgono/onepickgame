# 최근 목록 제목 번역 및 수정 화면 설명 입력 안내 수정

최근 생성/최근 플레이 목록의 축약 데이터에는 original_language가 없지만 title_translations는 들어 있다. 기존 공통 getLocalizedField가 빈 원본 언어를 normalizeLang('')에 넘기면서 기본값 en을 얻어 영어 화면에서는 번역보다 원본 title을 먼저 선택했다. title이 한글이면 저장된 영어 번역이 있어도 한글로 보이는 원인이 된다.

원본 언어가 누락된 경우에는 이를 미상으로 유지하고 요청 언어의 저장된 번역을 먼저 선택하도록 수정했다. 원본 언어가 명시된 경우의 원문 우선 동작, 번역이 없는 경우 원문으로 돌아가는 동작은 유지한다. JSON 문자열로 저장된 번역 맵도 지원한다. 공통 함수 수정으로 해당 함수를 사용하는 다른 축약 목록에도 적용된다.

수정 페이지 스크린샷에서 보이는 '번역 설명을 입력하세요 (선택)'는 빈 textarea의 placeholder다. 모든 언어에서 해당 키가 누락돼 코드의 한국어 기본 문구를 사용하고 있었다. 20개 언어에 translated_description_placeholder를 추가했고 코드의 비상 기본 문구는 영어로 바꿨다. 실제 제목/설명/번역 데이터를 저장하거나 덮어쓰는 로직은 변경하지 않았다.

검증:
- localization.test.js 8개 테스트: 기존 원문/번역/설명 동작, 원본 언어 누락 시 영어 번역, JSON 번역 맵, 명시적 영어 원문, 20개 언어.
- 실제 한국어·영어 프로덕션 번들에서 최근 생성/최근 플레이 패널의 축약 데이터를 모의 응답으로 넣어 표시 확인.
- 최적화 프런트엔드 빌드 및 git diff --check 통과.

반영: src/utils/localization.js, src/components/EditWorldcupPage.js, src/locales/*/translation.json. 추가 SQL은 필요 없다. 운영 DB 변경·커밋·푸시·배포는 하지 않았다.
