// 백엔드 API 호출하는 새로운 stockApi.ts
interface IChartData {
    date: string
    price: number
    timestamp: number
}

interface IStockData {
    symbol: string
    price: number
    rsi: number
    sma20: number
    sma50: number
    vix?: number
    timestamp?: string
    chartData?: IChartData[]
}

interface ITradingSignal {
    signal: 'BUY' | 'SELL' | 'HOLD'
    reason: string
    tqqqRatio: number
    qqqRatio: number
}

interface IDashboardData {
    qqqData: IStockData
    tqqqData: IStockData
    vix: number
    signal: ITradingSignal
    lastUpdated: string
}

// 백엔드 API URL
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

/**
 * 백엔드에서 단일 주식 데이터 가져오기
 */
export const getStockData = async (symbol: string): Promise<IStockData> => {
    try {
        const response = await fetch(`${API_BASE_URL}/stock/${symbol}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch stock data')
        }

        return result.data
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error)
        throw error
    }
}

/**
 * 여러 주식 데이터 동시 가져오기
 */
export const getMultipleStockData = async (
    symbols: string[],
): Promise<Record<string, IStockData>> => {
    try {
        const response = await fetch(`${API_BASE_URL}/stocks`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ symbols }),
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(
                result.message || 'Failed to fetch multiple stock data',
            )
        }

        return result.data
    } catch (error) {
        console.error('Error fetching multiple stocks:', error)
        throw error
    }
}

/**
 * VIX 지수 가져오기
 */
export const getVIX = async (): Promise<number> => {
    try {
        const response = await fetch(`${API_BASE_URL}/vix`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch VIX data')
        }

        return result.data.value
    } catch (error) {
        console.error('Error fetching VIX:', error)
        return 20 // 기본값
    }
}

/**
 * 트레이딩 신호 생성
 */
export const generateTradingSignal = async (
    symbol: string,
): Promise<ITradingSignal> => {
    try {
        const response = await fetch(`${API_BASE_URL}/trading-signal/${symbol}`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(
                result.message || 'Failed to generate trading signal',
            )
        }

        return result.data.signal
    } catch (error) {
        console.error('Error generating trading signal:', error)
        throw error
    }
}

/**
 * 대시보드 통합 데이터 가져오기 (메인 API)
 */
export const getDashboardData = async (): Promise<IDashboardData> => {
    try {
        console.log('🔄 Fetching dashboard data from backend...')

        const response = await fetch(`${API_BASE_URL}/dashboard`)

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }

        const result = await response.json()

        if (!result.success) {
            throw new Error(result.message || 'Failed to fetch dashboard data')
        }

        console.log('✅ Dashboard data received:', {
            qqq: `$${result.data.qqqData.price?.toFixed(2)}`,
            tqqq: `$${result.data.tqqqData.price?.toFixed(2)}`,
            vix: result.data.vix?.toFixed(2),
            signal: result.data.signal.signal,
        })

        return result.data
    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error)
        throw error
    }
}

/**
 * 백엔드 헬스 체크
 */
export const checkApiHealth = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${API_BASE_URL}/health`)
        const result = await response.json()
        return result.success && result.status === 'healthy'
    } catch (error) {
        console.error('Backend health check failed:', error)
        return false
    }
}
