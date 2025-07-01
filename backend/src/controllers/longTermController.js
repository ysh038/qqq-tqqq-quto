import { fetchStockData } from '../services/stockService.js'
import { calculateSMA, calculateRSI } from '../utils/technicalIndicators.js'

/**
 * 장기 투자 분석 (간단 버전)
 * GET /api/long-term/:symbol
 */
export const getLongTermAnalysis = async (req, res) => {
    try {
        const { symbol } = req.params
        
        if (!symbol) {
            return res.status(400).json({
                success: false,
                message: 'Symbol is required'
            })
        }
        
        console.log(`[Long-term Analysis] Analyzing ${symbol}...`)
        
        // 기존 stockService 사용해서 기본 데이터 가져오기
        const stockData = await fetchStockData(symbol.toUpperCase())
        
        // 간단한 장기 분석 점수 계산
        const analysis = calculateSimpleLongTermScore(stockData)
        
        res.json({
            success: true,
            data: {
                symbol: stockData.symbol,
                currentPrice: stockData.price,
                analysis: analysis,
                timestamp: new Date().toISOString()
            }
        })
        
    } catch (error) {
        console.error(`Error in long-term analysis for ${req.params.symbol}:`, error.message)
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

/**
 * 간단한 장기 투자 점수 계산
 */
const calculateSimpleLongTermScore = (stockData) => {
    const { price, rsi, sma20, sma50, priceHistory } = stockData
    
    let score = 50 // 기본 점수
    let reasons = []
    
    // 1. 가격 vs 이동평균 비교
    if (price > sma50 * 1.05) {
        score += 20
        reasons.push(`강한 상승추세 (가격이 50일 평균보다 5% 이상 높음)`)
    } else if (price > sma50) {
        score += 10
        reasons.push(`상승추세 (가격이 50일 평균 위)`)
    } else if (price < sma50 * 0.95) {
        score += 5 // 저점 매수 기회
        reasons.push(`하락세 - 잠재적 매수 기회`)
    }
    
    // 2. RSI 기반 평가
    if (rsi < 35) {
        score += 15
        reasons.push(`과매도 구간 (RSI: ${rsi.toFixed(1)}) - 매수 기회`)
    } else if (rsi > 70) {
        score -= 10
        reasons.push(`과매수 구간 (RSI: ${rsi.toFixed(1)}) - 주의 필요`)
    } else if (rsi >= 45 && rsi <= 60) {
        score += 5
        reasons.push(`적정 RSI 구간 (${rsi.toFixed(1)})`)
    }
    
    // 3. 이동평균선 배열
    if (sma20 > sma50) {
        score += 10
        reasons.push(`골든크로스 상태 (단기 > 장기 평균)`)
    } else {
        score -= 5
        reasons.push(`데드크로스 상태 (단기 < 장기 평균)`)
    }
    
    // 4. 가격 변동성 체크 (간단하게)
    if (priceHistory && priceHistory.length >= 10) {
        const recent10 = priceHistory.slice(-10)
        const volatility = Math.max(...recent10) / Math.min(...recent10)
        
        if (volatility < 1.1) {
            score += 5
            reasons.push(`낮은 변동성 - 안정적`)
        } else if (volatility > 1.3) {
            score -= 5
            reasons.push(`높은 변동성 - 주의`)
        }
    }
    
    // 점수 범위 조정
    score = Math.max(0, Math.min(100, score))
    
    // 등급 산정
    let grade, recommendation
    if (score >= 75) {
        grade = 'A'
        recommendation = '매수 추천'
    } else if (score >= 60) {
        grade = 'B'
        recommendation = '관심 종목'
    } else if (score >= 45) {
        grade = 'C'
        recommendation = '중립'
    } else {
        grade = 'D'
        recommendation = '투자 주의'
    }
    
    return {
        score: Math.round(score),
        grade,
        recommendation,
        reasons,
        technicalData: {
            currentPrice: price,
            sma20: sma20.toFixed(2),
            sma50: sma50.toFixed(2),
            rsi: rsi.toFixed(1),
            priceVsSMA50: ((price / sma50 - 1) * 100).toFixed(1) + '%'
        }
    }
}