/**
 * RSI (Relative Strength Index) 계산
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 계산 기간 (기본 14일)
 * @returns {number} RSI 값 (0-100)
 */
export const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50 // 기본값

    let gains = 0
    let losses = 0

    // 첫 번째 기간의 평균 계산
    for (let i = 1; i <= period; i++) {
        const change = prices[i] - prices[i - 1]
        if (change > 0) gains += change
        else losses -= change
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // 나머지 기간의 RSI 계산
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i] - prices[i - 1]
        const gain = change > 0 ? change : 0
        const loss = change < 0 ? -change : 0

        avgGain = (avgGain * (period - 1) + gain) / period
        avgLoss = (avgLoss * (period - 1) + loss) / period
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
}

/**
 * SMA (Simple Moving Average) 계산
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 계산 기간
 * @returns {number} SMA 값
 */
export const calculateSMA = (prices, period) => {
    if (prices.length < period) return prices[prices.length - 1] || 0
    
    const recentPrices = prices.slice(-period)
    const sum = recentPrices.reduce((a, b) => a + b, 0)
    return sum / period
}

/**
 * EMA (Exponential Moving Average) 계산
 * @param {number[]} prices - 가격 배열
 * @param {number} period - 계산 기간
 * @returns {number} EMA 값
 */
export const calculateEMA = (prices, period) => {
    if (prices.length < period) return prices[prices.length - 1] || 0
    
    const multiplier = 2 / (period + 1)
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period
    
    for (let i = period; i < prices.length; i++) {
        ema = (prices[i] * multiplier) + (ema * (1 - multiplier))
    }
    
    return ema
}

/**
 * 트레이딩 신호 생성 (보수적 전략)
 * @param {Object} stockData - 주식 데이터
 * @returns {Object} 트레이딩 신호
 */
export const generateTradingSignal = (stockData) => {
    const { rsi, sma20, sma50, price } = stockData

    // 🔴 극도 과열 - 완전 방어 모드 (RSI > 75)
    if (rsi > 75 && price > sma20 * 1.05) {
        return {
            signal: 'SELL',
            reason: `극도 과열 (RSI: ${rsi.toFixed(1)}) - 완전 방어 모드`,
            tqqqRatio: 5,
            qqqRatio: 70,
        }
    }

    // 🟠 강한 상승 - 보수적 접근 (RSI > 65)
    if (rsi > 65 && price > sma20) {
        return {
            signal: 'SELL',
            reason: `상승 과열 (RSI: ${rsi.toFixed(1)}) - 보수적 접근`,
            tqqqRatio: 10,
            qqqRatio: 65,
        }
    }

    // 🟡 약한 상승 - 현상 유지 (RSI > 55)
    if (rsi > 55 && price > sma20) {
        return {
            signal: 'HOLD',
            reason: `약한 상승세 - 현상 유지 (RSI: ${rsi.toFixed(1)})`,
            tqqqRatio: 15,
            qqqRatio: 60,
        }
    }

    // 🔵 중립 구간 - 균형 유지 (RSI 45-55)
    if (rsi >= 45 && rsi <= 55) {
        return {
            signal: 'HOLD',
            reason: `중립 구간 - 균형 유지 (RSI: ${rsi.toFixed(1)})`,
            tqqqRatio: 20,
            qqqRatio: 55,
        }
    }

    // 🟢 약한 하락 - 조심스런 진입 (RSI 35-45)
    if (rsi >= 35 && rsi < 45 && price > sma50) {
        return {
            signal: 'BUY',
            reason: `약한 하락 - 조심스런 진입 (RSI: ${rsi.toFixed(1)})`,
            tqqqRatio: 25,
            qqqRatio: 50,
        }
    }

    // 🟢 중간 하락 - 분할 매수 (RSI 25-35)
    if (rsi >= 25 && rsi < 35) {
        return {
            signal: 'BUY',
            reason: `중간 하락 - 분할 매수 시점 (RSI: ${rsi.toFixed(1)})`,
            tqqqRatio: 30,
            qqqRatio: 45,
        }
    }

    // 🟢 극도 과매도 - 적극 매수 (RSI < 25)
    if (rsi < 25 && price < sma50) {
        return {
            signal: 'BUY',
            reason: `극도 과매도 (RSI: ${rsi.toFixed(1)}) - 적극 매수 기회`,
            tqqqRatio: 35,
            qqqRatio: 40,
        }
    }

    // 기본값 (예외 상황)
    return {
        signal: 'HOLD',
        reason: `현재 상태 유지 (RSI: ${rsi.toFixed(1)}, 가격: $${price.toFixed(2)})`,
        tqqqRatio: 20,
        qqqRatio: 55,
    }
} 