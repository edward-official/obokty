# AWS 배포 가이드 (저비용 최적화)

본 문서는 프리티어가 만료된 상황에서 AWS 환경에 최소한의 비용(월 $5 ~ $12 수준)으로 프로젝트를 배포하기 위한 전략 및 준비 사항을 정리한 가이드입니다.

현재 프로젝트는 **Next.js (Frontend) + FastAPI 2개 (Auth, Game/WebSocket) + PostgreSQL (DB)**로 구성된 풀스택 프로젝트이며, `docker-compose`로 구성되어 있습니다. 이를 AWS의 관리형 서비스(RDS, ECS, ALB 등) 없이 **단일 EC2 인스턴스**에 올려 가성비를 극대화하는 방안입니다.

## 1. 추천하는 AWS 인프라 구성

- **컴퓨팅 (EC2): `t4g.small` (ARM 아키텍처) + Spot Instance 활용**
  - 2 vCPU, 2GB RAM 사양으로 현재 4개의 컨테이너(DB 포함)를 구동하기 위한 최소 권장 사양입니다.
  - x86 기반인 `t3.small`보다 약 20% 저렴하면서 성능이 뛰어납니다.
  - **Spot Instance**로 구동 시 일반 온디맨드(약 $11/월)보다 훨씬 저렴한 **월 $3~4** 수준으로 운영이 가능합니다.
- **스토리지 (EBS): gp3 15GB ~ 20GB**
  - 월 약 $1~2 수준의 스토리지 비용이 발생합니다.
- **네트워크: 탄력적 IP (Elastic IP)**
  - EC2 인스턴스에 연결하여 사용하는 동안은 무료입니다.

## 2. 배포를 위한 프로젝트 코드 준비 사항

### ① 리버스 프록시 (Nginx) 추가

현재 개발 환경에서는 로컬의 각기 다른 포트(3000, 8001, 8002)를 직접 호출하고 있습니다. 실제 도메인에 배포할 때는 80(HTTP) 및 443(HTTPS) 포트 하나로 트래픽을 받은 뒤, 경로(Path)에 따라 알맞은 컨테이너로 라우팅해 주어야 합니다.

- **진행 사항:**
  - `docker-compose.yml`에 `nginx` 컨테이너 추가 및 80/443 포트 개방
  - `nginx.conf` 설정 파일 작성:
    - `/` 👉 Next.js (3000)
    - `/auth` 👉 Auth Service (8001)
    - `/game` 👉 Game Service (8002)
    - `/ws` 👉 Game Service 웹소켓 (8002)

### ② 환경변수(.env) 분리 및 수정

`NEXT_PUBLIC_` 환경변수가 실제 운영될 도메인 주소를 바라보도록 수정해야 합니다.

- **진행 사항:** 운영 서버용 `.env.production` (또는 배포 시의 `.env`) 설정
  - 예: `NEXT_PUBLIC_AUTH_API_URL=https://도메인.com/auth`
  - 예: `NEXT_PUBLIC_GAME_WS_URL=wss://도메인.com/ws`

### ③ 도메인 및 HTTPS(SSL 인증서) 준비

웹소켓 통신 및 최신 브라우저 보안 정책상 HTTPS 적용이 필수입니다.

- **진행 사항:**
  - 저렴한 도메인(예: `.shop`, `.site` 등) 구입
  - Nginx에 무료 인증서인 **Let's Encrypt (Certbot)**를 적용하도록 구성

## 3. 실제 배포 진행 프로세스

1.  **EC2 인스턴스 생성:**
    - AWS 콘솔에서 `t4g.small` Ubuntu 이미지 선택 (Spot Instance 옵션 권장).
    - 스토리지(gp3) 할당 및 보안 그룹에서 22(SSH), 80(HTTP), 443(HTTPS) 포트 개방.
2.  **메모리 스왑(Swap) 설정 (매우 중요):**
    - 2GB RAM 환경에서 Next.js 빌드(`npm run build`) 또는 DB 부하 시 메모리 부족(OOM)으로 서버가 중단될 수 있습니다.
    - EC2 접속 후 가상 메모리(Swap 파일 2GB 정도)를 반드시 설정합니다.
3.  **서버 세팅:**
    - EC2 내부에 Docker 및 Docker Compose 설치.
4.  **코드 클론 및 실행:**
    - 프로젝트 코드를 EC2로 클론하고 운영용 `.env`를 셋업합니다.
    - `docker compose up --build -d` 명령어로 전체 서비스를 백그라운드에서 실행합니다.

## 💡 주의 사항: 데이터베이스 백업

현재 비용 절감을 위해 AWS RDS를 사용하지 않고 PostgreSQL을 Docker 컨테이너(EC2의 EBS 볼륨) 내부에서 구동합니다. 따라서 장애 발생 시 데이터 유실을 막기 위해 추후 **DB 데이터를 주기적으로 AWS S3 등에 백업하는 스크립트(cron job)**를 구성하는 것을 권장합니다.
