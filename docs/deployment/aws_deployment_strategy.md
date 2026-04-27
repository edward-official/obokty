# AWS 배포 가이드 (프리티어 100% 활용)

본 문서는 AWS 프리티어 혜택을 최대한 활용하여 **월 0원**에 가깝게 프로젝트를 배포하기 위한 전략 및 준비 사항을 정리한 가이드입니다.

현재 프로젝트는 **Next.js (Frontend) + FastAPI 2개 (Auth, Game/WebSocket) + PostgreSQL (DB)**로 구성된 풀스택 프로젝트입니다. 안정적인 운영을 위해 애플리케이션(EC2)과 데이터베이스(RDS)를 분리하여 배포합니다.

## 1. 추천하는 AWS 인프라 구성

- **컴퓨팅 (EC2): `t2.micro` (1 vCPU, 1GB RAM)**
  - Nginx, Next.js, FastAPI(Auth, Game) 컨테이너 구동용 서버입니다.
  - 프리티어 혜택으로 월 750시간 무료입니다.
  - **주의:** RAM이 1GB로 매우 적으므로, 메모리 부족(OOM)으로 인한 서버 다운을 막기 위해 **가상 메모리(Swap 2GB) 설정이 필수**입니다.
- **데이터베이스 (RDS): `db.t3.micro` 또는 `db.t4g.micro` (PostgreSQL)**
  - 프리티어 혜택으로 단일 AZ, 20GB 스토리지, 월 750시간 무료입니다.
  - DB를 분리함으로써 EC2의 메모리 부담을 크게 줄이고 데이터 안정성을 확보합니다.
- **스토리지 (EBS): gp3 30GB**
  - EC2 인스턴스에 연결되는 스토리지입니다.
  - 프리티어로 최대 30GB까지 무료이므로 넉넉하게 할당합니다.
- **네트워크: 탄력적 IP (Elastic IP)**
  - EC2 인스턴스에 고정 IP를 부여합니다. 실행 중인 EC2에 연결해 두는 동안은 무료입니다.

## 2. 배포를 위한 프로젝트 코드 준비 사항

### ① 리버스 프록시 (Nginx) 추가 및 DB 분리

현재 `docker-compose.yml`에는 DB 컨테이너가 포함되어 있습니다. 배포 시에는 AWS RDS를 사용하므로 DB 컨테이너를 제외하고, 도메인 라우팅을 위한 Nginx를 추가해야 합니다.

- **진행 사항:**
  - `docker-compose.yml`에서 `db` 서비스 제거
  - `docker-compose.yml`에 `nginx` 컨테이너 추가 및 80/443 포트 개방
  - `nginx.conf` 설정 파일 작성:
    - `/` 👉 Next.js (3000)
    - `/auth` 👉 Auth Service (8001)
    - `/game` 👉 Game Service (8002)
    - `/ws` 👉 Game Service 웹소켓 (8002)

### ② 환경변수(.env) 분리 및 수정

프론트엔드는 실제 운영 도메인을, 백엔드는 AWS RDS 주소를 바라보도록 환경변수를 수정해야 합니다.

- **진행 사항:**
  - **DB 환경변수:** 백엔드의 DB 연결 주소를 로컬 컨테이너 대신 AWS RDS 엔드포인트로 변경
  - **프론트엔드 환경변수:** `NEXT_PUBLIC_` 변수들이 실제 도메인 주소를 바라보도록 `.env.production` 설정
    - 예: `NEXT_PUBLIC_AUTH_API_URL=https://도메인.com/auth`
    - 예: `NEXT_PUBLIC_GAME_WS_URL=wss://도메인.com/ws`

### ③ 도메인 및 HTTPS(SSL 인증서) 준비

웹소켓 통신 및 최신 브라우저 보안 정책상 HTTPS 적용이 필수입니다.

- **진행 사항:**
  - 저렴한 도메인(예: `.shop`, `.site` 등) 구입
  - Nginx에 무료 인증서인 **Let's Encrypt (Certbot)**를 적용하도록 구성

## 3. 실제 배포 진행 프로세스

1. **AWS RDS (PostgreSQL) 생성:**
   - 프리티어 전용 사양으로 생성 후 엔드포인트(주소), 포트, 유저명, 비밀번호 확인.
   - 퍼블릭 액세스 허용(보안 그룹 설정) 또는 EC2와 동일한 VPC 내에서 통신하도록 설정.
2. **AWS EC2 생성:**
   - `t2.micro` Ubuntu 이미지 선택 및 30GB 스토리지(gp3) 할당.
   - 보안 그룹에서 22(SSH), 80(HTTP), 443(HTTPS) 포트 개방.
   - 탄력적 IP 발급 및 연결.
3. **메모리 스왑(Swap) 설정 (매우 중요):**
   - EC2 접속 후 가상 메모리(Swap 파일 2GB 정도)를 반드시 설정합니다.
4. **서버 세팅 및 실행:**
   - EC2 내부에 Docker 및 Docker Compose 설치.
   - 프로젝트 코드를 클론하고 운영용 `.env` 세팅.
   - `docker compose up --build -d` 명령어로 서비스 실행.
