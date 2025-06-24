# Stock Auto Trading Backend

TQQQ-QQQ 동적 재조정 시스템 백엔드 API 서버

## 🚀 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 프로덕션 실행
npm start
```

## 📊 API 엔드포인트

### 메인 대시보드 API
- **GET** `/api/dashboard` - TQQQ-QQQ 통합 대시보드 데이터

### 개별 API
- **GET** `/api/stock/:symbol` - 개별 주식 데이터
- **POST** `/api/stocks` - 여러 주식 데이터
- **GET** `/api/vix` - VIX 변동성 지수
- **GET** `/api/trading-signal/:symbol` - 트레이딩 신호
- **GET** `/api/health` - 헬스 체크

## 🔧 환경 설정

`.env` 파일을 생성하고 다음 변수들을 설정하세요:

```env
PORT=3001
CORS_ORIGIN=http://localhost:5173
ALPHA_VANTAGE_API_KEY=선택사항
```

## 📡 데이터 소스

- **Yahoo Finance API**: 주식 가격, 차트 데이터
- **기술적 지표**: RSI, SMA 자체 계산
- **VIX**: Yahoo Finance ^VIX 심볼

## 🏗️ 아키텍처

```
backend/
├── src/
│   ├── index.js           # 메인 서버
│   ├── routes/            # API 라우트
│   ├── controllers/       # 컨트롤러
│   ├── services/          # 비즈니스 로직
│   └── utils/             # 유틸리티
├── package.json
└── .env
```

## ✅ 특징

- ✨ CORS 해결 (Yahoo Finance API 백엔드 호출)
- 📈 실시간 기술적 지표 계산
- 🔄 안정적인 에러 핸들링
- 📊 통합 대시보드 API
- 🚀 Express.js 기반 REST API
