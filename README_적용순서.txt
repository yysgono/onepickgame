OnePickGame 상대전적 + 이름 잘림 + 뒤로가기 UI 패치 (재검수본)

1) Supabase SQL Editor에서 먼저 아래 파일을 1회 실행
   supabase/20260919_worldcup_head_to_head.sql

2) ZIP 안의 src 폴더를 프로젝트 src 위에 덮어쓰기
   - src/components/Match.js
   - src/utils.js
   - src/locales/*/translation.json (16개 언어)

적용 내용
- 후보 이름 영역 높이 확장 / 최대 3줄 표시
- 후보 카드 높이도 함께 늘려 긴 이름이 아래 통계를 밀거나 잘리지 않도록 조정
- 기존 뒤로가기 로직은 유지하고 버튼만 카드 아래 중앙으로 이동
- 뒤로가기 버튼을 "← 뒤로가기" 형태로 변경
- 뒤로가기 문구도 16개 언어 전용 match_back 키로 번역
- 현재 두 후보의 상대전적 표시
- 경기 선택 때마다 DB 저장하지 않고, 월드컵이 정상 종료될 때 finalMatchHistory를 한 번에 상대전적에 누적
- 기존 historyStack / matchHistory 복원 로직은 변경하지 않아 기존 뒤로가기 동작 유지
- 상대전적 저장 실패가 기존 월드컵 결과 저장/이동을 막지 않도록 별도 처리
- 상대전적 UI 문구 16개 언어 추가

재검수 내용
- 기존 ZIP에서 후보 이름 컨테이너 maxHeight/2줄 제한이 그대로 남아 있던 문제 수정
- 대부분 언어에서 기존 root back 번역 키가 없어 영어 Back으로 보일 수 있던 문제 수정
- 16개 translation.json JSON 파싱 확인
- React production build: Compiled successfully


[추가 수정 - 매치 중 언어 변경]
- 헤더 언어 선택으로 /ko/match/... → /ja/match/... 처럼 언어만 바뀌어도 현재 대진을 유지합니다.
- Match 초기화는 cup.id 또는 selectedCount가 실제로 바뀔 때만 실행되도록 수정했습니다.
- 제목/버튼/상대전적 UI 번역은 즉시 바뀌지만 bracket, idx, matchHistory, historyStack은 초기화되지 않습니다.
