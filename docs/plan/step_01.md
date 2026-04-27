### 1. 프로젝트 개요 (Project Overview)

- **프로젝트명:** ObokTy
- **핵심 슬로건:** _Zawsze Obok Ty_ (항상 네 곁에)
- **MVP 목표:** 국제 커플 간 언어 장벽 완화를 위한 **실시간 동시 대전 언어 퀴즈 게임** 및 사용자 인증 시스템 구축

### 2. 시스템 아키텍처 (MSA 기반)

서비스의 확장성을 위해 **API Gateway**를 필두로 한 서비스 분리를 지향합니다.

- **Auth Service:** 회원가입, 로그인(JWT), 커플 연결 요청/수락 처리
- **Game Service:** 언어 데이터(폴란드어-한국어) 관리, WebSocket 기반 실시간 게임 로직 처리
- **Frontend:** Next.js 기반의 SSR/CSR 하이브리드 웹 애플리케이션

### 3. 상세 기술 스택 (Technical Stack)

| Layer              | Technology            | Reason                                                                  |
| :----------------- | :-------------------- | :---------------------------------------------------------------------- |
| **Frontend**       | **Next.js (TS)**      | SEO 최적화 및 빠른 라우팅, TypeScript를 통한 타입 안정성 확보           |
| **Backend**        | **FastAPI**           | 비동기(Asynchronous) 처리 강점, 네이티브 WebSocket으로 실시간 게임 지원 |
| **Realtime**       | **FastAPI WebSocket** | 별도 브로커 없이 서버 in-memory 세션 관리로 실시간 동기화               |
| **Database**       | **PostgreSQL**        | 커플 간 관계형 데이터 및 언어 딕셔너리, 게임 전적 저장에 최적화         |
| **Infrastructure** | **Docker**            | MSA 환경의 각 서비스 컨테이너화 및 배포 일관성 유지                     |
| **Environment**    | **Virtualenv (venv)** | Python 의존성 격리를 통한 개발 환경 정규화                              |

### 4. 데이터베이스 설계 (ERD 초기 안)

핵심 테이블 간의 관계입니다.

- **User Table:** `id(PK)`, `email`, `password_hash`, `partner_id(FK)`, `native_language`
- **Couple Request Table:** `id(PK)`, `sender_id(FK)`, `receiver_id(FK)`, `status(pending/accepted/rejected)`, `created_at`
- **Word Table:** `id(PK)`, `base_word(EN)`, `translation_pl`, `translation_kr`, `category`
- **Game Session Table:** `id(PK)`, `couple_id`, `total_rounds`, `time_limit_sec`, `status`, `winner_id(FK)`, `started_at`, `finished_at`
- **Round Answer Table:** `id(PK)`, `session_id(FK)`, `round_number`, `word_id(FK)`, `user_id(FK)`, `chosen_answer`, `is_correct`, `answered_at`

### 5. MVP 핵심 기능 로직

#### A. 회원가입 및 커플 연결 (Auth)

1. 사용자가 회원가입 (bcrypt 비밀번호 해시).
2. A가 B의 이메일로 커플 연결 **요청(Request)** 전송 → `couple_requests` 테이블에 `pending` 레코드 생성.
3. B가 요청 목록을 확인 후 **수락(Accept)** → 양방향 `partner_id` 업데이트로 커플 연결 완료.

#### B. 실시간 언어 학습 게임 (Language Game)

게임은 WebSocket을 통해 커플이 **동시에** 진행합니다.

1. **게임 시작:** 로비에서 총 문제 수(n)와 문제당 제한 시간(t초)을 설정 후 세션 생성.
2. **동시 참여:** 두 참가자(A-한국인, B-폴란드인) 모두 WebSocket 연결 후 `ready` 신호 전송.
3. **문제 출제:** 서버가 같은 영어 단어(e.g. `window`)를 두 참가자에게 동시 전송.
   - A(한국인)에게는 **폴란드어** 객관식 선택지 4개 제공 (정답 `okno` + 오답 3개)
   - B(폴란드인)에게는 **한국어** 객관식 선택지 4개 제공 (정답 `창문` + 오답 3개)
4. **응답 및 채점:** 두 참가자 모두 답을 선택하거나 제한 시간(t초)이 만료되면 채점.
5. **결과 공유:** 라운드 결과를 양측에 전송 — 내 정답 여부 + **상대방의 정답 여부** 포함.
6. **최종 결과:** n개의 문제를 모두 완료하면 점수를 합산하여 승/패를 결정하고 `game_sessions`에 누적 저장.

### 6. 개발 로드맵 (Next Steps)

1. **Step 1 (Environment):** Docker Compose를 활용하여 PostgreSQL, FastAPI(Auth/Game), Next.js 컨테이너 환경 구축.
2. **Step 2 (Auth):** FastAPI에서 OAuth2(JWT) 기반 로그인 API 구현, 커플 Request/Accept 연결 로직 및 Next.js 미들웨어 인증 처리.
3. **Step 3 (Game):** 폴란드어-한국어 기초 단어 데이터셋(JSON) 구축, WebSocket 기반 실시간 게임 서버 및 게임 UI 개발.
