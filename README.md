⚡ Savage Budget (로컬 전용 가계부)
React 기반의 스마트 가계부 프로그램
복잡한 데이터베이스 대신 내 컴퓨터의 엑셀(database.csv) 파일로 데이터를 가볍고 안전하게 관리합니다.

✨ 주요 기능
📊 팩폭 대시보드: 이번 달 수입/지출 현황과 항목별 비중을 분석하여, 소비 패턴에 따른 뼈 때리는 조언을 제공합니다.(신경 안써도 됨.. 제대로 개발안됐음)
📅 스마트 캘린더: 날짜별 수입과 지출 합계를 캘린더에서 한눈에 확인하고, 날짜를 클릭해 즉시 내역을 등록하거나 조회할 수 있습니다.
📝 엑셀(CSV) 완벽 연동: 모든 데이터는 로컬 database.csv에 실시간 저장되며, 기존 가계부 엑셀 파일을 불러오거나 백업용으로 다운로드할 수 있습니다. (중복 체크 기능 탑재)
💳 신용카드 & 이체 관리: 신용카드 미결제 금액을 추적하며, 카드 대금 납부를 '이체'로 처리하여 지출이 중복 계산되는 것을 방지합니다.
🛡️ 런타임 에러 방지: 빈 데이터나 잘못된 형식의 데이터가 입력되어도 화면이 멈추지 않도록 강력한 예외 처리(안전장치)가 적용되어 있습니다.

🛠 기술 스택
Frontend: React (Vite), Tailwind CSS, Lucide-React
Backend: Node.js, Express, csv-writer & csv-parser
Database: Local CSV File System

🚀 시작하기 (설치 및 실행 방법)

프로젝트를 다운로드하고 실행하려면 컴퓨터에 Node.js가 설치되어 있어야 합니다.
1. 패키지 설치
터미널을 열고 프로젝트 폴더로 이동한 뒤, 아래 명령어를 입력하여 필요한 라이브러리를 설치합니다.
> npm install

2. 프로그램 실행 (서버 + 화면 동시 실행)
설치가 완료되면 아래 명령어를 입력하세요. 데이터 서버(server.js)와 가계부 화면(Vite)이 동시에 구동됩니다.
> npm start

<img width="1155" height="786" alt="image" src="https://github.com/user-attachments/assets/d400407e-6d3b-40d5-b036-dedaa9243783" />
<img width="1088" height="766" alt="image" src="https://github.com/user-attachments/assets/62f44263-3135-495b-a70f-ccf6eb26f3f7" />
<img width="1131" height="762" alt="image" src="https://github.com/user-attachments/assets/959c7cb0-35b0-45a9-b9a3-93cced391c30" />
