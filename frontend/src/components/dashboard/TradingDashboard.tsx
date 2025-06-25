// src/components/TradingDashboard.tsx
import React, { useState, useEffect } from 'react'

import IndividualStockChart from './IndividualStockChart'
import styles from './TradingDashboard.module.css'
import { getDashboardData, checkApiHealth } from '../../queries/stockApi'

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

function TradingDashboard() {
    const [dashboardData, setDashboardData] = useState<IDashboardData | null>(
        null,
    )
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isHealthy, setIsHealthy] = useState<boolean>(true)

    const fetchData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            // 백엔드 헬스 체크
            const isHealthyResponse = await checkApiHealth()
            setIsHealthy(isHealthyResponse)

            if (!isHealthyResponse) {
                throw new Error(
                    '백엔드 서버가 실행되지 않았습니다. npm run dev로 백엔드를 시작하세요.',
                )
            }

            // 대시보드 데이터 가져오기
            const data = await getDashboardData()
            setDashboardData(data)
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError(
                err instanceof Error
                    ? err.message
                    : '데이터를 가져오는데 실패했습니다.',
            )
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()

        // 30초마다 자동 업데이트
        const interval = setInterval(fetchData, 30000)
        return () => clearInterval(interval)
    }, [])

    const getSignalColor = (signal: string) => {
        switch (signal) {
            case 'BUY':
                return '#10b981'
            case 'SELL':
                return '#ef4444'
            case 'HOLD':
                return '#6b7280'
            default:
                return '#6b7280'
        }
    }

    const getRSIColor = (rsi: number) => {
        if (rsi > 70) return '#ef4444' // 과열 (빨강)
        if (rsi < 30) return '#10b981' // 과매도 (녹색)
        return '#6b7280' // 중립 (회색)
    }

    if (isLoading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>📊 TQQQ-QQQ 데이터 로딩 중...</p>
                </div>
            </div>
        )
    }

    if (error || !isHealthy) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <h2>⚠️ 연결 오류</h2>
                    <p>{error || '백엔드 서버 연결 실패'}</p>
                    <div className={styles.troubleshooting}>
                        <h3>해결 방법:</h3>
                        <ol>
                            <li>
                                터미널에서 <code>cd backend</code>
                            </li>
                            <li>
                                <code>npm install</code> (처음만)
                            </li>
                            <li>
                                <code>npm run dev</code> 실행
                            </li>
                            <li>
                                백엔드가 http://localhost:3001에서 실행되는지
                                확인
                            </li>
                        </ol>
                    </div>
                    <button onClick={fetchData} className={styles.retryButton}>
                        🔄 다시 시도
                    </button>
                </div>
            </div>
        )
    }

    if (!dashboardData) {
        return (
            <div className={styles.container}>
                <div className={styles.error}>
                    <p>데이터를 사용할 수 없습니다.</p>
                    <button onClick={fetchData} className={styles.retryButton}>
                        🔄 다시 시도
                    </button>
                </div>
            </div>
        )
    }

    const { qqqData, tqqqData, vix, signal } = dashboardData

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>📈 TQQQ-QQQ 동적 재조정 시스템</h1>
                <div className={styles.lastUpdate}>
                    마지막 업데이트:{' '}
                    {new Date(dashboardData.lastUpdated).toLocaleString(
                        'ko-KR',
                    )}
                    {isHealthy && (
                        <span className={styles.healthIndicator}>
                            🟢 연결됨
                        </span>
                    )}
                </div>
            </header>

            {/* 메인 트레이딩 신호 */}
            <section className={styles.signalSection}>
                <div
                    className={styles.signalCard}
                    style={{ borderColor: getSignalColor(signal.signal) }}
                >
                    <h2>
                        <span style={{ color: getSignalColor(signal.signal) }}>
                            {signal.signal === 'BUY'
                                ? '🟢 매수'
                                : signal.signal === 'SELL'
                                  ? '🔴 매도'
                                  : '⚪ 보유'}
                        </span>
                    </h2>
                    <p className={styles.signalReason}>{signal.reason}</p>
                    <div className={styles.ratioInfo}>
                        <span>TQQQ: {signal.tqqqRatio}%</span>
                        <span>QQQ: {signal.qqqRatio}%</span>
                        <span>
                            현금: {100 - signal.tqqqRatio - signal.qqqRatio}%
                        </span>
                    </div>
                </div>
            </section>

            {/* 주식 데이터 그리드 */}
            <section className={styles.stockGrid}>
                {/* QQQ 카드 */}
                <div className={styles.stockCard}>
                    <h3>QQQ (나스닥 ETF)</h3>
                    <div className={styles.price}>
                        ${qqqData.price.toFixed(2)}
                    </div>
                    <div className={styles.indicators}>
                        <div className={styles.indicator}>
                            <span>RSI (14일)</span>
                            <span style={{ color: getRSIColor(qqqData.rsi) }}>
                                {qqqData.rsi.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.indicator}>
                            <span>SMA (20일)</span>
                            <span>${qqqData.sma20.toFixed(2)}</span>
                        </div>
                        <div className={styles.indicator}>
                            <span>SMA (50일)</span>
                            <span>${qqqData.sma50.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* TQQQ 카드 */}
                <div className={styles.stockCard}>
                    <h3>TQQQ (3배 레버리지)</h3>
                    <div className={styles.price}>
                        ${tqqqData.price.toFixed(2)}
                    </div>
                    <div className={styles.indicators}>
                        <div className={styles.indicator}>
                            <span>RSI (14일)</span>
                            <span style={{ color: getRSIColor(tqqqData.rsi) }}>
                                {tqqqData.rsi.toFixed(1)}
                            </span>
                        </div>
                        <div className={styles.indicator}>
                            <span>SMA (20일)</span>
                            <span>${tqqqData.sma20.toFixed(2)}</span>
                        </div>
                        <div className={styles.indicator}>
                            <span>SMA (50일)</span>
                            <span>${tqqqData.sma50.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* VIX 카드 */}
                <div className={styles.stockCard}>
                    <h3>VIX (변동성 지수)</h3>
                    <div className={styles.price}>{vix.toFixed(2)}</div>
                    <div className={styles.vixInfo}>
                        <p>
                            {vix < 20
                                ? '😌 낮은 변동성'
                                : vix < 30
                                  ? '😐 보통 변동성'
                                  : '😨 높은 변동성'}
                        </p>
                    </div>
                </div>
            </section>

            {/* 차트 섹션 */}
            <section className={styles.chartSection}>
                <h2>📊 주가 차트</h2>
                <div className={styles.chartsContainer}>
                    <IndividualStockChart stockData={qqqData} color="#2563eb" />
                    <IndividualStockChart
                        stockData={tqqqData}
                        color="#dc2626"
                    />
                </div>
            </section>

            {/* 새로고침 버튼 */}
            <div className={styles.controls}>
                <button
                    onClick={fetchData}
                    className={styles.refreshButton}
                    disabled={isLoading}
                >
                    {isLoading ? '⏳ 업데이트 중...' : '🔄 수동 새로고침'}
                </button>
            </div>
        </div>
    )
}

export default TradingDashboard
