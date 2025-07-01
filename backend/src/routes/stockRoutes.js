import express from 'express'
import {
    getStockData,
    getMultipleStocks,
    getVIX,
    getTradingSignal,
    getDashboardData,
    healthCheck
} from '../controllers/stockController.js'

import { getLongTermAnalysis } from '../controllers/longTermController.js'

const router = express.Router()

// 헬스 체크
router.get('/health', healthCheck)

// 단일 주식 데이터
router.get('/stock/:symbol', getStockData)

// 여러 주식 데이터
router.post('/stocks', getMultipleStocks)

// VIX 지수
router.get('/vix', getVIX)

// 트레이딩 신호
router.get('/trading-signal/:symbol', getTradingSignal)

// 대시보드 통합 데이터 (프론트엔드 메인 API)
router.get('/dashboard', getDashboardData)

// 장기 투자 분석
router.get('/long-term/:symbol', getLongTermAnalysis)

// API 정보
router.get('/', (req, res) => {
    res.json({
        message: 'Stock Auto Trading API',
        version: '1.0.0',
        endpoints: {
            health: 'GET /api/health',
            stock: 'GET /api/stock/:symbol',
            stocks: 'POST /api/stocks',
            vix: 'GET /api/vix',
            tradingSignal: 'GET /api/trading-signal/:symbol',
            dashboard: 'GET /api/dashboard',
            longTermAnalysis: 'GET /api/long-term/:symbol'
        },
        documentation: {
            dashboard: {
                description: 'TQQQ-QQQ 대시보드용 통합 데이터',
                returns: 'QQQ/TQQQ 데이터, VIX, 트레이딩 신호'
            },
            stock: {
                description: '개별 주식 데이터 (가격, RSI, SMA)',
                example: '/api/stock/QQQ'
            },
            stocks: {
                description: '여러 주식 데이터 동시 조회',
                body: '{ "symbols": ["QQQ", "TQQQ"] }'
            },
            longTermAnalysis: {
                description: '장기 투자 분석',
                example: '/api/long-term/QQQ'
            }
        }
    })
})

export default router 