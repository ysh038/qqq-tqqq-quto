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
 * 트레이딩 신호 생성
 * @param {Object} stockData - 주식 데이터
 * @returns {Object} 트레이딩 신호
 */
export const generateTradingSignal = (stockData) => {
    const { rsi, sma20, sma50, price } = stockData

    // 강한 상승 신호 (TQQQ → QQQ 전환)
    if (rsi > 70 && price > sma20) {
        return {
            signal: 'SELL',
            reason: `RSI 과열 (${rsi.toFixed(1)}) - TQQQ → QQQ 전환`,
            tqqqRatio: 35,
            qqqRatio: 45,
        }
    }

    // 급락 신호 (QQQ → TQQQ 전환)
    if (rsi < 35 && price < sma50) {
        return {
            signal: 'BUY',
            reason: `RSI 과매도 (${rsi.toFixed(1)}) - QQQ → TQQQ 전환`,
            tqqqRatio: 50,
            qqqRatio: 30,
        }
    }

    // 약한 상승 (소폭 조정)
    if (rsi > 60 && price > sma20 && price < sma20 * 1.03) {
        return {
            signal: 'SELL',
            reason: `약한 상승 모멘텀 - TQQQ 2% 축소`,
            tqqqRatio: 38,
            qqqRatio: 42,
        }
    }

    // 약한 하락 (분할 매수)
    if (rsi < 45 && price < sma20 && price > sma50) {
        return {
            signal: 'BUY',
            reason: `약한 하락 - 분할매수 시점`,
            tqqqRatio: 45,
            qqqRatio: 35,
        }
    }

    // 기본 유지
    return {
        signal: 'HOLD',
        reason: `현재 상태 유지 (RSI: ${rsi.toFixed(1)}, 가격: $${price.toFixed(2)})`,
        tqqqRatio: 40,
        qqqRatio: 40,
    }
} 