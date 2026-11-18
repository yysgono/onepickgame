# Vercel 함수 시작 실패 수정

운영 로그에서 `Cannot find module ./src/components/PlatformHome.css`, require stack `/var/task/server.js`를 확인했습니다. 서버가 시작하면서 CSS를 읽다가 예외로 종료되어 모든 서버 경로가 500으로 응답했습니다.

Vercel의 server.js 빌드 설정에 홈·티어 미리보기·퀴즈 카드 CSS 세 파일을 명시적으로 포함합니다. 또한 CSS 파일 누락만으로 서버 전체가 중단되지 않도록 해당 오류를 처리합니다. 실제 파일이 포함되면 초기 HTML에도 기존 스타일을 제공합니다. 누락 시에는 기존 브라우저 CSS를 사용하고 서버는 응답을 계속합니다.

이 수정본은 이전 변경을 포함합니다. 파일을 같은 경로로 덮어쓰고 Vercel에 새 배포해야 합니다. vercel.json·server.js·CSS 파일을 모두 반영하세요. 새 환경변수나 SQL은 없습니다.

검증: 세 CSS 파일이 모두 누락된 상황을 재현하여 서버 시작, 20개 언어 홈·월드컵 목록 HTML, API, 기존 URL·사이트맵 검사를 수행합니다. 정상 CSS 포함 환경도 검사합니다. 로컬 검사는 Vercel 운영 복구를 직접 확인한 것은 아닙니다.
