import { 
    fetchStockData, 
    fetchVIXData, 
    fetchMultipleStockData,
    fetchStockDataFromAlphaVantage 
} from '../services/stockService.js'
import { generateTradingSignal } from '../utils/technicalIndicators.js'

/**
 * 단일 주식 데이터 조회
 * GET /api/stock/:symbol
 */
export const getStockData = async (req, res) => {
    try {
        const { symbol } = req.params
        
        if (!symbol) {
            return res.status(400).json({ 
                error: 'Symbol parameter is required' 
            })
        }

        const stockData = await fetchStockData(symbol.toUpperCase())
        
        res.json({
            success: true,
            data: stockData
        })
    } catch (error) {
        console.error('Error in getStockData:', error.message)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch stock data',
            message: error.message
        })
    }
}

/**
 * 여러 주식 데이터 조회
 * POST /api/stocks
 * Body: { symbols: ["QQQ", "TQQQ"] }
 */
export const getMultipleStocks = async (req, res) => {
    try {
        const { symbols } = req.body
        
        if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
            return res.status(400).json({ 
                error: 'Symbols array is required' 
            })
        }

        const upperSymbols = symbols.map(s => s.toUpperCase())
        const stockData = await fetchMultipleStockData(upperSymbols)
        
        res.json({
            success: true,
            data: stockData
        })
    } catch (error) {
        console.error('Error in getMultipleStocks:', error.message)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch multiple stock data',
            message: error.message
        })
    }
}

/**
 * VIX 지수 조회
 * GET /api/vix
 */
export const getVIX = async (req, res) => {
    try {
        const vixData = await fetchVIXData()
        
        res.json({
            success: true,
            data: {
                symbol: 'VIX',
                value: vixData,
                timestamp: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Error in getVIX:', error.message)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch VIX data',
            message: error.message
        })
    }
}

/**
 * 트레이딩 신호 생성
 * GET /api/trading-signal/:symbol
 */
export const getTradingSignal = async (req, res) => {
    try {
        const { symbol } = req.params
        
        if (!symbol) {
            return res.status(400).json({ 
                error: 'Symbol parameter is required' 
            })
        }

        const stockData = await fetchStockData(symbol.toUpperCase())
        const tradingSignal = generateTradingSignal(stockData)
        
        res.json({
            success: true,
            data: {
                symbol: stockData.symbol,
                signal: tradingSignal,
                stockData: {
                    price: stockData.price,
                    rsi: stockData.rsi,
                    sma20: stockData.sma20,
                    sma50: stockData.sma50
                },
                timestamp: new Date().toISOString()
            }
        })
    } catch (error) {
        console.error('Error in getTradingSignal:', error.message)
        res.status(500).json({
            success: false,
            error: 'Failed to generate trading signal',
            message: error.message
        })
    }
}

/**
 * TQQQ-QQQ 대시보드 데이터 (통합 데이터)
 * GET /api/dashboard
 */
export const getDashboardData = async (req, res) => {
    try {
        console.log('[Dashboard] Fetching comprehensive data...')
        
        // QQQ, TQQQ, VIX 데이터를 동시에 가져오기
        const [stocksData, vixData] = await Promise.all([
            fetchMultipleStockData(['QQQ', 'TQQQ']),
            fetchVIXData()
        ])
        
        const qqqData = stocksData.QQQ
        const tqqqData = stocksData.TQQQ
        
        // QQQ 기반으로 트레이딩 신호 생성
        const tradingSignal = generateTradingSignal(qqqData)
        
        const dashboardData = {
            qqqData,
            tqqqData,
            vix: vixData,
            signal: tradingSignal,
            lastUpdated: new Date().toISOString()
        }
        
        console.log('[Dashboard] Success:', {
            qqq: `$${qqqData.price?.toFixed(2)} (RSI: ${qqqData.rsi?.toFixed(1)})`,
            tqqq: `$${tqqqData.price?.toFixed(2)} (RSI: ${tqqqData.rsi?.toFixed(1)})`,
            vix: vixData?.toFixed(2),
            signal: tradingSignal.signal
        })
        
        res.json({
            success: true,
            data: dashboardData
        })
    } catch (error) {
        console.error('Error in getDashboardData:', error.message)
        res.status(500).json({
            success: false,
            error: 'Failed to fetch dashboard data',
            message: error.message
        })
    }
}

/**
 * 헬스 체크 (API 상태 확인)
 * GET /api/health
 */
export const healthCheck = async (req, res) => {
    try {
        // 간단한 API 테스트
        const testData = await fetchStockData('QQQ')
        
        res.json({
            success: true,
            status: 'healthy',
            message: 'Stock API is working properly',
            timestamp: new Date().toISOString(),
            sample: {
                symbol: testData.symbol,
                price: testData.price
            }
        })
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            error: 'API health check failed',
            message: error.message,
            timestamp: new Date().toISOString()
        })
    }
} 