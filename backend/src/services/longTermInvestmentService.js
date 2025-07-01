import axios from 'axios'
import { calculateRSI, calculateSMA, calculateEMA } from '../utils/technicalIndicators.js'

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/'
const YAHOO_STATS_URL = 'https://query2.finance.yahoo.com/v10/finance/quoteSummary/'

/**
 * 장기 투자용 종합 데이터 가져오기
 * @param {string} symbol - 주식 심볼
 * @returns {Promise<Object>} 종합 투자 분석 데이터
 */
export const fetchLongTermInvestmentData = async (symbol) => {
    try {
        console.log(`[Long-term Analysis] Fetching data for ${symbol}`)
        
        // 1. 3년간 가격 데이터 가져오기
        const priceData = await fetchExtendedPriceData(symbol)
        
        // 2. 기업 기본 정보 및 재무 지표 가져오기
        const fundamentalData = await fetchFundamentalData(symbol)
        
        // 3. 장기 기술적 지표 계산
        const technicalAnalysis = calculateLongTermTechnical(priceData)
        
        // 4. 기본적 분석 점수 계산
        const fundamentalScore = calculateFundamentalScores(fundamentalData)
        
        // 5. 종합 투자 점수 계산
        const investmentScore = generateLongTermInvestmentScore({
            fundamentals: fundamentalScore,
            technicals: technicalAnalysis,
            marketData: priceData
        })
        
        return {
            symbol,
            timestamp: new Date().toISOString(),
            currentPrice: priceData.currentPrice,
            priceData,
            fundamentalData,
            technicalAnalysis,
            fundamentalScore,
            investmentScore,
            recommendation: getInvestmentRecommendation(investmentScore.totalScore)
        }
        
    } catch (error) {
        console.error(`Error in long-term analysis for ${symbol}:`, error.message)
        throw error
    }
}

/**
 * 확장된 가격 데이터 가져오기 (3년)
 */
const fetchExtendedPriceData = async (symbol) => {
    const response = await axios.get(`${YAHOO_BASE_URL}${symbol}`, {
        params: {
            range: '3y',  // 3년 데이터
            interval: '1d'
        },
        timeout: 15000
    })
    
    const result = response.data.chart.result[0]
    const quote = result.indicators.quote[0]
    
    const prices = quote.close.filter(price => price !== null && !isNaN(price))
    const volumes = quote.volume.filter(volume => volume !== null && !isNaN(volume))
    const timestamps = result.timestamp || []
    
    return {
        prices,
        volumes,
        timestamps,
        currentPrice: prices[prices.length - 1],
        yearHigh: Math.max(...prices.slice(-252)), // 1년간 최고가
        yearLow: Math.min(...prices.slice(-252))   // 1년간 최저가
    }
}

/**
 * 기업 기본 정보 및 재무 지표 가져오기
 */
const fetchFundamentalData = async (symbol) => {
    try {
        const modules = [
            'summaryDetail',
            'financialData', 
            'keyStatistics',
            'defaultKeyStatistics',
            'summaryProfile'
        ].join(',')
        
        const response = await axios.get(`${YAHOO_STATS_URL}${symbol}`, {
            params: {
                modules: modules
            },
            timeout: 15000
        })
        
        const data = response.data.quoteSummary.result[0]
        
        return {
            // 가치평가 지표
            pe_ratio: data.summaryDetail?.trailingPE?.raw || null,
            forward_pe: data.summaryDetail?.forwardPE?.raw || null,
            pb_ratio: data.keyStatistics?.priceToBook?.raw || null,
            peg_ratio: data.keyStatistics?.pegRatio?.raw || null,
            ps_ratio: data.keyStatistics?.priceToSalesTrailing12Months?.raw || null,
            
            // 수익성 지표
            roe: data.financialData?.returnOnEquity?.raw || null,
            roa: data.financialData?.returnOnAssets?.raw || null,
            profit_margins: data.financialData?.profitMargins?.raw || null,
            operating_margins: data.financialData?.operatingMargins?.raw || null,
            
            // 재무 건전성
            debt_to_equity: data.financialData?.debtToEquity?.raw || null,
            current_ratio: data.financialData?.currentRatio?.raw || null,
            quick_ratio: data.financialData?.quickRatio?.raw || null,
            
            // 배당 정보
            dividend_yield: data.summaryDetail?.dividendYield?.raw || null,
            dividend_rate: data.summaryDetail?.dividendRate?.raw || null,
            payout_ratio: data.keyStatistics?.payoutRatio?.raw || null,
            
            // 성장률 (추정치)
            revenue_growth: data.financialData?.revenueGrowth?.raw || null,
            earnings_growth: data.financialData?.earningsGrowth?.raw || null,
            
            // 기타
            market_cap: data.summaryDetail?.marketCap?.raw || null,
            enterprise_value: data.keyStatistics?.enterpriseValue?.raw || null,
            book_value: data.keyStatistics?.bookValue?.raw || null,
            
            // 기업 정보
            sector: data.summaryProfile?.sector || null,
            industry: data.summaryProfile?.industry || null,
            employees: data.summaryProfile?.fullTimeEmployees || null
        }
        
    } catch (error) {
        console.warn(`Could not fetch fundamental data for ${symbol}:`, error.message)
        return {}
    }
}

/**
 * 장기 기술적 지표 계산
 */
const calculateLongTermTechnical = (priceData) => {
    const { prices, currentPrice, yearHigh, yearLow } = priceData
    
    const sma200 = calculateSMA(prices, 200)  // 200일 이동평균
    const sma50 = calculateSMA(prices, 50)    // 50일 이동평균
    const ema200 = calculateEMA(prices, 200)  // 200일 지수이동평균
    
    // 52주 고점/저점 대비 위치
    const positionInRange = ((currentPrice - yearLow) / (yearHigh - yearLow)) * 100
    
    // 장기 추세 판단
    let trendDirection = 'neutral'
    let trendStrength = 0
    
    if (currentPrice > sma200 * 1.03) {
        trendDirection = 'strong_uptrend'
        trendStrength = Math.min(((currentPrice / sma200) - 1) * 100, 100)
    } else if (currentPrice > sma200) {
        trendDirection = 'uptrend'
        trendStrength = Math.min(((currentPrice / sma200) - 1) * 100, 100)
    } else if (currentPrice < sma200 * 0.97) {
        trendDirection = 'strong_downtrend'
        trendStrength = Math.min((1 - (currentPrice / sma200)) * 100, 100)
    } else if (currentPrice < sma200) {
        trendDirection = 'downtrend'
        trendStrength = Math.min((1 - (currentPrice / sma200)) * 100, 100)
    }
    
    // 골든크로스/데드크로스
    const crossSignal = sma50 > sma200 ? 'golden_cross' : 'death_cross'
    const crossStrength = Math.abs(sma50 - sma200) / sma200 * 100
    
    // 장기 RSI (월간)
    const longTermRSI = calculateRSI(prices, 30) // 30일 RSI
    
    return {
        sma200,
        sma50,
        ema200,
        longTermRSI,
        trendDirection,
        trendStrength,
        crossSignal,
        crossStrength,
        positionInRange,
        yearHigh,
        yearLow,
        priceVsSMA200: ((currentPrice / sma200) - 1) * 100,
        priceVsSMA50: ((currentPrice / sma50) - 1) * 100
    }
}

/**
 * 기본적 분석 점수 계산
 */
const calculateFundamentalScores = (fundamentalData) => {
    const {
        pe_ratio, pb_ratio, roe, debt_to_equity, current_ratio,
        dividend_yield, revenue_growth, earnings_growth, profit_margins
    } = fundamentalData
    
    let score = 0
    let reasons = []
    let maxScore = 0
    
    // P/E 비율 평가 (25점 만점)
    maxScore += 25
    if (pe_ratio && pe_ratio > 0) {
        if (pe_ratio < 15) {
            score += 25
            reasons.push(`저평가 주식 (P/E: ${pe_ratio.toFixed(1)})`)
        } else if (pe_ratio < 25) {
            score += 15
            reasons.push(`적정 평가 (P/E: ${pe_ratio.toFixed(1)})`)
        } else if (pe_ratio < 35) {
            score += 5
            reasons.push(`다소 고평가 (P/E: ${pe_ratio.toFixed(1)})`)
        }
    }
    
    // ROE 평가 (20점 만점)
    maxScore += 20
    if (roe && roe > 0) {
        if (roe > 0.2) {
            score += 20
            reasons.push(`우수한 수익성 (ROE: ${(roe*100).toFixed(1)}%)`)
        } else if (roe > 0.15) {
            score += 15
            reasons.push(`양호한 수익성 (ROE: ${(roe*100).toFixed(1)}%)`)
        } else if (roe > 0.1) {
            score += 10
            reasons.push(`보통 수익성 (ROE: ${(roe*100).toFixed(1)}%)`)
        }
    }
    
    // 부채비율 평가 (20점 만점)
    maxScore += 20
    if (debt_to_equity !== null && debt_to_equity >= 0) {
        if (debt_to_equity < 0.3) {
            score += 20
            reasons.push('우수한 재무 건전성 (저부채)')
        } else if (debt_to_equity < 0.5) {
            score += 15
            reasons.push('양호한 재무 건전성')
        } else if (debt_to_equity < 1.0) {
            score += 10
            reasons.push('보통 재무 건전성')
        } else {
            score += 5
            reasons.push('주의: 높은 부채비율')
        }
    }
    
    // 성장성 평가 (20점 만점)
    maxScore += 20
    if (revenue_growth && earnings_growth) {
        if (revenue_growth > 0.15 && earnings_growth > 0.15) {
            score += 20
            reasons.push('우수한 성장성 (매출+순이익 15%+)')
        } else if (revenue_growth > 0.1 && earnings_growth > 0.1) {
            score += 15
            reasons.push('양호한 성장성 (매출+순이익 10%+)')
        } else if (revenue_growth > 0.05) {
            score += 10
            reasons.push('보통 성장성')
        }
    }
    
    // 배당 평가 (15점 만점)
    maxScore += 15
    if (dividend_yield && dividend_yield > 0) {
        if (dividend_yield > 0.04) {
            score += 15
            reasons.push(`높은 배당수익률 (${(dividend_yield*100).toFixed(1)}%)`)
        } else if (dividend_yield > 0.02) {
            score += 10
            reasons.push(`적정 배당수익률 (${(dividend_yield*100).toFixed(1)}%)`)
        } else {
            score += 5
            reasons.push(`낮은 배당수익률 (${(dividend_yield*100).toFixed(1)}%)`)
        }
    }
    
    // 점수를 100점 만점으로 환산
    const normalizedScore = maxScore > 0 ? (score / maxScore) * 100 : 0
    
    return {
        score: Math.round(normalizedScore),
        rawScore: score,
        maxScore: maxScore,
        grade: getGrade(normalizedScore),
        reasons: reasons,
        details: {
            valuation: pe_ratio ? `P/E: ${pe_ratio.toFixed(1)}` : 'N/A',
            profitability: roe ? `ROE: ${(roe*100).toFixed(1)}%` : 'N/A',
            safety: debt_to_equity !== null ? `부채비율: ${debt_to_equity.toFixed(2)}` : 'N/A',
            growth: revenue_growth ? `매출성장률: ${(revenue_growth*100).toFixed(1)}%` : 'N/A',
            dividend: dividend_yield ? `배당수익률: ${(dividend_yield*100).toFixed(1)}%` : 'N/A'
        }
    }
}

/**
 * 종합 장기 투자 점수 계산
 */
const generateLongTermInvestmentScore = ({ fundamentals, technicals, marketData }) => {
    let finalScore = fundamentals.score * 0.7 // 기본적 분석 70%
    let technicalScore = 0
    
    // 기술적 분석 점수 (30%)
    if (technicals.trendDirection === 'strong_uptrend') {
        technicalScore += 25
    } else if (technicals.trendDirection === 'uptrend') {
        technicalScore += 15
    } else if (technicals.trendDirection === 'downtrend') {
        technicalScore -= 10
    } else if (technicals.trendDirection === 'strong_downtrend') {
        technicalScore -= 20
    }
    
    if (technicals.crossSignal === 'golden_cross' && technicals.crossStrength > 2) {
        technicalScore += 15
    } else if (technicals.crossSignal === 'death_cross' && technicals.crossStrength > 2) {
        technicalScore -= 10
    }
    
    // 52주 위치 평가
    if (technicals.positionInRange > 85) {
        technicalScore -= 10 // 고점 근처 주의
    } else if (technicals.positionInRange < 25) {
        technicalScore += 15 // 저점 근처 기회
    } else if (technicals.positionInRange > 40 && technicals.positionInRange < 70) {
        technicalScore += 5  // 적정 구간
    }
    
    // 장기 RSI 평가
    if (technicals.longTermRSI < 30) {
        technicalScore += 10 // 과매도
    } else if (technicals.longTermRSI > 70) {
        technicalScore -= 5  // 과매수
    }
    
    finalScore += Math.max(technicalScore * 0.3, -30) // 기술적 분석 최대 -30점까지만
    
    return {
        totalScore: Math.max(Math.round(finalScore), 0),
        fundamentalWeight: 70,
        technicalWeight: 30,
        fundamentalScore: fundamentals.score,
        technicalScore: Math.round(technicalScore),
        grade: getGrade(finalScore),
        keyFactors: [
            ...fundamentals.reasons,
            `장기 추세: ${getTrendDescription(technicals.trendDirection)}`,
            `52주 위치: ${technicals.positionInRange.toFixed(1)}%`,
            `${technicals.crossSignal === 'golden_cross' ? '골든크로스' : '데드크로스'} 상태`
        ]
    }
}

// 유틸리티 함수들
const getGrade = (score) => {
    if (score >= 85) return 'A+'
    if (score >= 80) return 'A'
    if (score >= 75) return 'A-'
    if (score >= 70) return 'B+'
    if (score >= 65) return 'B'
    if (score >= 60) return 'B-'
    if (score >= 55) return 'C+'
    if (score >= 50) return 'C'
    return 'D'
}

const getTrendDescription = (trend) => {
    const descriptions = {
        'strong_uptrend': '강한 상승추세',
        'uptrend': '상승추세', 
        'neutral': '중립',
        'downtrend': '하락추세',
        'strong_downtrend': '강한 하락추세'
    }
    return descriptions[trend] || '알 수 없음'
}

const getInvestmentRecommendation = (score) => {
    if (score >= 80) return { 
        level: 'STRONG_BUY', 
        text: '강력 매수 추천',
        description: '우수한 펀더멘털과 기술적 조건을 갖춘 투자 적격 종목'
    }
    if (score >= 70) return { 
        level: 'BUY', 
        text: '매수 추천',
        description: '양호한 투자 조건을 갖춘 관심 종목'
    }
    if (score >= 60) return { 
        level: 'HOLD', 
        text: '보유/관심',
        description: '적정한 투자 가치를 보이는 종목'
    }
    if (score >= 50) return { 
        level: 'NEUTRAL', 
        text: '중립',
        description: '투자 판단에 신중함이 필요한 종목'
    }
    return { 
        level: 'AVOID', 
        text: '투자 비추천',
        description: '현재 투자 조건이 좋지 않은 종목'
    }
}

export {
    fetchExtendedPriceData,
    fetchFundamentalData,
    calculateLongTermTechnical,
    calculateFundamentalScores,
    generateLongTermInvestmentScore
}