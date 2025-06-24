# 📈 TQQQ-QQQ 동적 재조정 자동화 시스템

나스닥의 방향성과 모멘텀에 따라 **TQQQ(3배 레버리지)**와 **QQQ(나스닥 ETF)** 비중을 실시간으로 조정하는 스마트 트레이딩 시스템입니다.

## 🎯 핵심 개념

**동적 재조정 전략**: RSI, SMA 등 기술적 지표를 기반으로 시장 과열/과매도 구간을 자동 감지하여 포트폴리오 비중을 실시간 조정

- **과열 구간** (RSI > 70): TQQQ → QQQ 전환 (리스크 축소)
- **과매도 구간** (RSI < 35): QQQ → TQQQ 전환 (공격적 매수)
- **중립 구간**: 균형잡힌 포트폴리오 유지

## ✨ 주요 기능

### 📊 **실시간 대시보드**
- 🔄 **30초마다 자동 업데이트**
- 📈 **QQQ vs TQQQ 실시간 차트** (Recharts 기반)
- 🎯 **스마트 트레이딩 신호** (매수/매도/보유)
- 📉 **기술적 지표**: RSI(14), SMA(20), SMA(50)
- 📊 **VIX 변동성 모니터링**
- 💼 **포트폴리오 비중 제안**

### 🔧 **기술적 분석**
- **RSI (Relative Strength Index)**: 과매수/과매도 판단
- **SMA (Simple Moving Average)**: 20일/50일 이동평균
- **VIX 지수**: 시장 변동성 측정
- **자체 계산 엔진**: API 제한 없이 정확한 지표 계산

### 📱 **사용자 경험**
- 🎨 **현대적 UI/UX**: 직관적이고 아름다운 인터페이스
- 📱 **반응형 디자인**: 모바일/태블릿/데스크톱 최적화
- ⚡ **실시간 차트**: 인터랙티브 가격 추이 시각화
- 🟢 **헬스 체크**: 백엔드 연결 상태 실시간 표시

## 🏗️ 시스템 아키텍처

```
stock-auto/
├── frontend/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   │   └── dashboard/
│   │   │       ├── TradingDashboard.tsx    # 메인 대시보드
│   │   │       ├── StockChart.tsx          # 실시간 차트
│   │   │       └── *.module.css            # 스타일링
│   │   ├── queries/
│   │   │   └── stockApi.ts                 # API 호출 로직
│   │   └── routes/                         # 라우팅
│   ├── package.json                        # 프론트엔드 의존성
│   └── .env                               # 환경변수
├── backend/                  # Express.js + Node.js
│   ├── src/
│   │   ├── controllers/      # API 컨트롤러
│   │   ├── services/         # 비즈니스 로직
│   │   ├── routes/           # API 라우트
│   │   ├── utils/            # 유틸리티 (기술적 지표 계산)
│   │   └── index.js          # 서버 진입점
│   ├── package.json          # 백엔드 의존성
│   └── .env                  # 환경변수
└── README.md                 # 프로젝트 문서
```

## 🚀 빠른 시작

### 📋 **사전 요구사항**
- Node.js 16+ 
- npm 또는 yarn
- 모던 웹 브라우저

### ⚡ **1단계: 프로젝트 클론**
```bash
git clone <repository-url>
cd stock-auto
```

### 🔧 **2단계: 백엔드 설정 및 실행**
```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경변수 설정 (선택사항)
cp .env.example .env

# 개발 서버 실행
npm run dev
```

백엔드가 **http://localhost:3001**에서 실행됩니다.

### 🎨 **3단계: 프론트엔드 설정 및 실행**
```bash
# 새 터미널에서 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치 (Recharts 포함)
npm install

# 개발 서버 실행
npm run dev
```

프론트엔드가 **http://localhost:5173**에서 실행됩니다.

### 🎯 **4단계: 대시보드 접속**
브라우저에서 http://localhost:5173 접속하여 실시간 TQQQ-QQQ 대시보드를 확인하세요!

## 📊 API 엔드포인트

### 🔗 **메인 API**
| 엔드포인트 | 메소드 | 설명 |
|------------|--------|------|
| `/api/dashboard` | GET | 통합 대시보드 데이터 (추천) |
| `/api/stock/:symbol` | GET | 개별 주식 데이터 |
| `/api/stocks` | POST | 여러 주식 데이터 |
| `/api/vix` | GET | VIX 변동성 지수 |
| `/api/trading-signal/:symbol` | GET | 트레이딩 신호 생성 |
| `/api/health` | GET | 서버 상태 확인 |

### 📝 **API 사용 예시**
```bash
# 통합 대시보드 데이터
curl http://localhost:3001/api/dashboard

# QQQ 개별 데이터
curl http://localhost:3001/api/stock/QQQ

# 여러 주식 데이터
curl -X POST http://localhost:3001/api/stocks \
  -H "Content-Type: application/json" \
  -d '{"symbols": ["QQQ", "TQQQ"]}'
```

## 🎯 트레이딩 로직

### 📈 **신호 생성 알고리즘**

#### 🔴 **매도 신호 (TQQQ → QQQ)**
- **강한 과열**: RSI > 70 + 가격 > SMA20 → TQQQ 35%, QQQ 45%
- **약한 과열**: RSI > 60 + 가격 상승 3% 이내 → TQQQ 38%, QQQ 42%

#### 🟢 **매수 신호 (QQQ → TQQQ)**
- **강한 과매도**: RSI < 35 + 가격 < SMA50 → TQQQ 50%, QQQ 30%
- **약한 과매도**: RSI < 45 + SMA20 아래 → TQQQ 45%, QQQ 35%

#### ⚪ **보유 신호**
- **중립 상태**: 위 조건 해당 없음 → TQQQ 40%, QQQ 40%

### 📊 **기술적 지표 계산**
- **RSI(14)**: 14일 기준 상대강도지수
- **SMA(20)**: 20일 단순이동평균 (단기 추세)
- **SMA(50)**: 50일 단순이동평균 (중기 추세)
- **VIX**: 변동성 지수 (시장 공포도)

## 🛠️ 기술 스택

### 🎨 **Frontend**
- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Charts**: Recharts
- **Styling**: CSS Modules
- **State Management**: useState + useEffect
- **HTTP Client**: Fetch API

### ⚙️ **Backend**
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: JavaScript (ES Modules)
- **HTTP Client**: Axios
- **CORS**: CORS middleware

### 📡 **Data Sources**
- **Primary**: Yahoo Finance API (무료, 무제한)
- **Backup**: Alpha Vantage API (선택사항)
- **Real-time**: 30초 간격 업데이트

## 🎨 화면 구성

### 📊 **메인 대시보드**
1. **헤더**: 제목 + 마지막 업데이트 시간 + 연결 상태
2. **트레이딩 신호**: 현재 추천 액션 + 포트폴리오 비중
3. **주식 데이터 카드**: QQQ, TQQQ, VIX 실시간 정보
4. **실시간 차트**: QQQ vs TQQQ 가격 추이 (30일)
5. **컨트롤**: 수동 새로고침 버튼

### 📈 **차트 기능**
- **듀얼 라인 차트**: QQQ(파란선) + TQQQ(빨간선)
- **기술적 지표**: SMA20(녹색 점선) + SMA50(황색 점선)
- **인터랙티브 툴팁**: 호버시 상세 정보
- **반응형 디자인**: 모든 디바이스 지원

## 🔧 환경 설정

### 🖥️ **백엔드 환경변수** (`backend/.env`)
```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
ALPHA_VANTAGE_API_KEY=your_key_here  # 선택사항
LOG_LEVEL=info
```

### 🎨 **프론트엔드 환경변수** (`frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:3001/api
```

## 🚦 트러블슈팅

### ❌ **자주 발생하는 문제들**

#### 🔌 **"백엔드 서버 연결 실패"**
```bash
# 해결방법
cd backend
npm install
npm run dev
# 확인: http://localhost:3001/api/health
```

#### 📊 **"차트 데이터 로딩 중..."**
- 백엔드 서버가 실행 중인지 확인
- Yahoo Finance API 응답 대기 (최대 10초)
- 네트워크 연결 상태 확인

#### 🔄 **"API 호출 제한"**
- Yahoo Finance: 무제한 (현재 사용 중)
- Alpha Vantage: 분당 25회 (백업용)

### 🐛 **디버깅**
```bash
# 백엔드 로그 확인
cd backend && npm run dev

# 브라우저 개발자 도구 → Network 탭
# API 호출 상태 확인

# 백엔드 헬스 체크
curl http://localhost:3001/api/health
```

## 📈 성능 최적화

### ⚡ **실시간 업데이트**
- **자동 갱신**: 30초 간격 (배터리 효율 고려)
- **백그라운드 업데이트**: 탭 비활성화시에도 동작
- **에러 핸들링**: API 실패시 자동 재시도

### 🎯 **사용자 경험**
- **로딩 상태**: 스피너 + 진행률 표시
- **에러 처리**: 상세한 에러 메시지 + 해결 방법
- **반응형 UI**: 모바일 최적화

## 🔮 향후 개발 계획

### 🌟 **추가 예정 기능**
- [ ] **알림 시스템**: 중요 신호 발생시 브라우저 알림
- [ ] **백테스팅**: 과거 데이터 기반 전략 성과 분석
- [ ] **포트폴리오 추적**: 실제 투자 성과 모니터링
- [ ] **다중 전략**: SQQQ, UPRO 등 추가 ETF 지원
- [ ] **모바일 앱**: React Native 기반 네이티브 앱
- [ ] **실시간 알림**: 텔레그램/슬랙 봇 연동

### 🛡️ **보안 강화**
- [ ] **API 키 관리**: 환경변수 암호화
- [ ] **레이트 리미팅**: API 호출 제한
- [ ] **HTTPS**: SSL 인증서 적용

## 🤝 기여하기

1. **Fork** 프로젝트
2. **Feature Branch** 생성 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** 브랜치 (`git push origin feature/AmazingFeature`)
5. **Pull Request** 생성

## 📄 라이센스

이 프로젝트는 MIT 라이센스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## ⚠️ 면책 조항

이 시스템은 **교육 및 연구 목적**으로 제작되었습니다. 실제 투자 결정은 충분한 리서치와 전문가 상담을 통해 이루어져야 합니다. 투자에는 원금 손실 위험이 따르며, 모든 투자 결정에 대한 책임은 사용자에게 있습니다.

---

## 🎉 완성된 기능

✅ **실시간 데이터 수집** (Yahoo Finance API)  
✅ **기술적 지표 계산** (RSI, SMA)  
✅ **스마트 트레이딩 신호**  
✅ **실시간 차트** (Recharts)  
✅ **반응형 대시보드**  
✅ **자동 업데이트** (30초)  
✅ **에러 핸들링**  
✅ **헬스 체크**  

**🚀 완전한 TQQQ-QQQ 동적 재조정 시스템이 준비되었습니다!**

---

*Made with ❤️ for Smart Trading*
