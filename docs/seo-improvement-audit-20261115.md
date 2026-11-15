# OnePickGame 검색 본문 개선 우선순위

2026-11-15 공개 응답을 curl로 내려받아 JavaScript 실행 전 HTML과 현재 소스를 비교했다. 사이트 전체나 Search Console을 감사한 결과는 아니다. 이 문서는 개선 제안이며 SEO 기능을 변경하지 않았다.

확인 URL:
- https://www.onepickgame.com/ko
- https://www.onepickgame.com/ko/mytop9/templates/b1168231-f7da-4be1-afb9-17db9dfb2fa1
- https://www.onepickgame.com/ko/result/b1168231-f7da-4be1-afb9-17db9dfb2fa1

셋 모두 HTTP 200이었다. 확인한 템플릿과 결과 페이지는 index,follow이며 제목·설명·후보명 본문이 있었다. 단순히 후보명이 전혀 없거나 noindex로 막혀 있다는 상태는 아니다.

| 우선순위 | 확인한 내용 | 개선안 |
| --- | --- | --- |
| 1 | 월드컵 결과 첫 HTML에는 후보 이름 24개가 있지만 실제 순위·승률·승리 횟수 표가 없다. worldcup-view-routes.cjs도 후보명만 렌더링한다. | 결과 화면의 실제 공개 통계와 같은 정의로 상위 순위표를 서버 HTML에 제공한다. 집계 기준/대상/갱신 시점을 표시한다. DB 조회 실패 시 가짜 0이나 임의 순위를 만들지 않는다. |
| 2 | 구절판 템플릿 첫 HTML의 링크는 구절판 홈 링크 1개. 결과 첫 HTML의 링크는 시작과 stats 링크 2개. | 원본 월드컵·관련 템플릿·같은 주제의 다른 콘텐츠로 이어지는 설명적인 링크를 기존 카드/내비게이션에 넣는다. 사용자가 삭제 요청한 별도 '이 주제로 더 즐기기' 박스를 복구해야 한다는 의미는 아니다. |
| 3 | App.js는 /stats/ID를 /result/ID로 리다이렉트하지만 worldcup-view-routes.cjs는 stats에도 별도 self canonical을 만든다. | 공개 순위표의 대표 경로를 result로 통일하고 서버 리다이렉트/HTML canonical/내부 링크/사이트맵 경로를 일치시킨다. 개인 경기 match 페이지의 기존 noindex 정책은 별개로 유지한다. |
| 4 | 확인한 한국어 템플릿의 첫 후보명은 Coco, TinkerBell, TARZAN 등 영어다. 해당 SSR 경로는 c.name/c.title만 읽고 후보별 번역 필드를 고르지 않는다. | 저장된 한국어 번역이 있는 경우 실제 화면과 서버 본문 모두 같은 언어 선택 로직을 적용한다. 번역이 없으면 원문을 사용한다. 제목만 번역하고 본문은 전 언어 동일한 페이지가 양산되지 않는지 점검한다. |

후보 수를 무조건 늘리거나 키워드를 반복하기보다는, 사용자에게 실제 보이는 고유한 결과와 설명을 서버에서도 같은 의미로 제공하는 것이 목표다. 홈페이지는 이미 인기 월드컵 6개 링크 등을 첫 HTML에 제공한다. '검색 본문이 전혀 없다'는 진단은 맞지 않는다.

Google 공개 가이드의 검색어에 맞는 제목·본문, 크롤 가능한 링크, URL 통합 원칙과 같은 방향이다. 이 개선만으로 색인이나 순위를 보장하지 않으며, 현재 Google 색인 제외의 정확한 사유는 Search Console URL 검사와 실제 크롤 결과를 함께 봐야 한다.

참고:
https://developers.google.com/search/docs/essentials
https://developers.google.com/search/docs/crawling-indexing/links-crawlable
https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
