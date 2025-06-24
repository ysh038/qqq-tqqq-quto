import axios from 'axios'
import { calculateRSI, calculateSMA } from '../utils/technicalIndicators.js'

const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v8/finance/chart/'

/**
 * Yahoo Finance에서 주식 데이터 가져오기
 * @param {string} symbol - 주식 심볼
 * @returns {Promise<Object>} 주식 데이터
 */
export const fetchStockData = async (symbol) => {
    try {
        console.log(`[Yahoo API] Fetching data for ${symbol}`)
        
        const response = await axios.get(`${YAHOO_BASE_URL}${symbol}`, {
            params: {
                range: '3mo',
                interval: '1d'
            },
            timeout: 10000
        })
        
        const data = response.data
        
        if (!data.chart.result || data.chart.result.length === 0) {
            throw new Error(`No data found for symbol: ${symbol}`)
        }
        
        const result = data.chart.result[0]
        const quote = result.indicators.quote[0]
        
        // null 값 제거하고 유효한 가격만 추출
        const allPrices = quote.close.filter(price => price !== null && !isNaN(price))
        
        if (allPrices.length === 0) {
            throw new Error(`No valid price data for ${symbol}`)
        }
        
        const currentPrice = allPrices[allPrices.length - 1]
        
        // 기술적 지표 계산
        const rsi = calculateRSI(allPrices)
        const sma20 = calculateSMA(allPrices, 20)
        const sma50 = calculateSMA(allPrices, 50)
        
        console.log(`[Yahoo API] Success for ${symbol}:`, {
            price: currentPrice,
            rsi: rsi.toFixed(1),
            sma20: sma20.toFixed(2),
            sma50: sma50.toFixed(2)
        })
        
        // 차트용 데이터 - 날짜와 함께 제공
        const timestamps = result.timestamp || []
        const chartData = allPrices.slice(-60).map((price, index) => {
            const date = timestamps[timestamps.length - 60 + index] 
                ? new Date(timestamps[timestamps.length - 60 + index] * 1000)
                : new Date(Date.now() - (60 - index) * 24 * 60 * 60 * 1000)
            
            return {
                date: date.toISOString().split('T')[0], // YYYY-MM-DD 형식
                price: price,
                timestamp: date.getTime()
            }
        })

        return {
            symbol,
            price: currentPrice,
            rsi,
            sma20,
            sma50,
            timestamp: new Date().toISOString(),
            priceHistory: allPrices.slice(-30), // 최근 30일 가격 이력 (호환성)
            chartData: chartData // 차트용 상세 데이터
        }
    } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message)
        throw new Error(`Failed to fetch data for ${symbol}: ${error.message}`)
    }
}

/**
 * VIX 지수 가져오기
 * @returns {Promise<number>} VIX 값
 */
export const fetchVIXData = async () => {
    try {
        console.log(`[Yahoo API] Fetching VIX data`)
        
        const response = await axios.get(`${YAHOO_BASE_URL}^VIX`, {
            params: {
                range: '1d',
                interval: '1d'
            },
            timeout: 10000
        })
        
        const data = response.data
        const result = data.chart.result[0]
        const quote = result.indicators.quote[0]
        
        const vixPrices = quote.close.filter(price => price !== null && !isNaN(price))
        const currentVIX = vixPrices[vixPrices.length - 1]
        
        console.log(`[Yahoo API] VIX:`, currentVIX)
        
        return currentVIX || 20 // 기본값 20
    } catch (error) {
        console.error('Error fetching VIX:', error.message)
        return 20 // 기본값
    }
}

/**
 * 여러 심볼의 데이터를 동시에 가져오기
 * @param {string[]} symbols - 주식 심볼 배열
 * @returns {Promise<Object>} 심볼별 주식 데이터
 */
export const fetchMultipleStockData = async (symbols) => {
    try {
        console.log(`[Yahoo API] Fetching multiple symbols:`, symbols)
        
        const promises = symbols.map(symbol => fetchStockData(symbol))
        const results = await Promise.allSettled(promises)
        
        const stockData = {}
        
        results.forEach((result, index) => {
            const symbol = symbols[index]
            if (result.status === 'fulfilled') {
                stockData[symbol] = result.value
            } else {
                console.error(`Failed to fetch ${symbol}:`, result.reason.message)
                // 실패한 경우 기본값 제공
                stockData[symbol] = {
                    symbol,
                    price: 0,
                    rsi: 50,
                    sma20: 0,
                    sma50: 0,
                    timestamp: new Date().toISOString(),
                    error: result.reason.message
                }
            }
        })
        
        return stockData
    } catch (error) {
        console.error('Error fetching multiple stock data:', error.message)
        throw error
    }
}

/**
 * Alpha Vantage API로 백업 데이터 가져오기 (필요시)
 * @param {string} symbol - 주식 심볼
 * @returns {Promise<Object>} 주식 데이터
 */
export const fetchStockDataFromAlphaVantage = async (symbol) => {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY
    
    if (!API_KEY) {
        throw new Error('Alpha Vantage API key not configured')
    }
    
    try {
        console.log(`[Alpha Vantage] Fetching data for ${symbol}`)
        
        // 현재 가격 가져오기
        const priceResponse = await axios.get('https://www.alphavantage.co/query', {
            params: {
                function: 'GLOBAL_QUOTE',
                symbol,
                apikey: API_KEY
            }
        })
        
        const priceData = priceResponse.data
        if (priceData['Error Message']) {
            throw new Error(priceData['Error Message'])
        }
        
        const currentPrice = parseFloat(priceData['Global Quote']['05. price'])
        
        // 간단한 기본값 반환 (Alpha Vantage는 기술적 지표 API 호출 제한 때문에)
        return {
            symbol,
            price: currentPrice,
            rsi: 50, // 기본값
            sma20: currentPrice,
            sma50: currentPrice,
            timestamp: new Date().toISOString(),
            source: 'alphavantage'
        }
    } catch (error) {
        console.error(`Alpha Vantage error for ${symbol}:`, error.message)
        throw error
    }
} 