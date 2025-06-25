import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'

import styles from './IndividualStockChart.module.css'

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
    chartData?: IChartData[]
}

interface IIndividualStockChartProps {
    stockData: IStockData
    color: string
}

function IndividualStockChart({
    stockData,
    color,
}: IIndividualStockChartProps) {
    const { symbol, price, rsi, sma20, sma50, chartData } = stockData

    // 차트 데이터 준비
    const prepareChartData = () => {
        if (!chartData || chartData.length === 0) {
            return []
        }

        return chartData
            .slice(-30) // 최근 30일
            .map((item) => ({
                date: item.date,
                price: item.price,
                timestamp: item.timestamp,
            }))
    }

    const formattedData = prepareChartData()

    // Y축 범위 계산
    const calculateYAxisDomain = () => {
        if (formattedData.length === 0) return ['auto', 'auto']

        const prices = formattedData.map((item) => item.price)
        const minPrice = Math.min(...prices)
        const maxPrice = Math.max(...prices)
        const padding = (maxPrice - minPrice) * 0.05 // 5% 패딩

        return [minPrice - padding, maxPrice + padding]
    }

    const [yMin, yMax] = calculateYAxisDomain()

    // RSI 색상
    const getRSIColor = (rsiValue: number) => {
        if (rsiValue > 70) return '#ef4444' // 과열 (빨강)
        if (rsiValue < 30) return '#10b981' // 과매도 (녹색)
        return '#6b7280' // 중립 (회색)
    }

    if (formattedData.length === 0) {
        return (
            <div className={styles.chartContainer}>
                <div
                    className={styles.chartHeader}
                    style={{ borderColor: color }}
                >
                    <h3>{symbol} 차트</h3>
                    <div className={styles.currentPrice} style={{ color }}>
                        ${price.toFixed(2)}
                    </div>
                </div>
                <div className={styles.noData}>
                    <p>차트 데이터 로딩 중...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.chartContainer}>
            {/* 차트 헤더 */}
            <div className={styles.chartHeader} style={{ borderColor: color }}>
                <div className={styles.titleSection}>
                    <h3>{symbol}</h3>
                    <span className={styles.symbolDescription}>
                        {symbol === 'QQQ'
                            ? '나스닥 100 ETF'
                            : '3배 레버리지 ETF'}
                    </span>
                </div>
                <div className={styles.priceSection}>
                    <div className={styles.currentPrice} style={{ color }}>
                        ${price.toFixed(2)}
                    </div>
                    <div className={styles.rsiIndicator}>
                        <span>RSI: </span>
                        <span
                            style={{
                                color: getRSIColor(rsi),
                                fontWeight: 'bold',
                            }}
                        >
                            {rsi.toFixed(1)}
                        </span>
                    </div>
                </div>
            </div>

            {/* 차트 영역 */}
            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart
                        data={formattedData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            tick={{ fontSize: 11 }}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                            }}
                        />

                        <YAxis
                            stroke="#666"
                            tick={{ fontSize: 11 }}
                            domain={[yMin, yMax]}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />

                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#ffffff',
                                border: '1px solid #e2e8f0',
                                borderRadius: '8px',
                                fontSize: '12px',
                            }}
                            labelFormatter={(value) => `날짜: ${value}`}
                            formatter={(value: number) => [
                                `$${value.toFixed(2)}`,
                                symbol,
                            ]}
                        />

                        {/* 메인 가격 라인 */}
                        <Line
                            type="monotone"
                            dataKey="price"
                            stroke={color}
                            strokeWidth={2}
                            dot={{ fill: color, strokeWidth: 0, r: 2 }}
                            activeDot={{ r: 4, fill: color }}
                            name={symbol}
                        />

                        {/* SMA 20일선 */}
                        <ReferenceLine
                            y={sma20}
                            stroke="#10b981"
                            strokeDasharray="3 3"
                            strokeWidth={1}
                        />

                        {/* SMA 50일선 */}
                        <ReferenceLine
                            y={sma50}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            strokeWidth={1}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 기술적 지표 정보 */}
            <div className={styles.indicators}>
                <div className={styles.indicatorItem}>
                    <span className={styles.indicatorLabel}>SMA(20):</span>
                    <span className={styles.indicatorValue}>
                        ${sma20.toFixed(2)}
                    </span>
                </div>
                <div className={styles.indicatorItem}>
                    <span className={styles.indicatorLabel}>SMA(50):</span>
                    <span className={styles.indicatorValue}>
                        ${sma50.toFixed(2)}
                    </span>
                </div>
                <div className={styles.indicatorItem}>
                    <span className={styles.indicatorLabel}>현재가/SMA20:</span>
                    <span
                        className={styles.indicatorValue}
                        style={{
                            color: price > sma20 ? '#10b981' : '#ef4444',
                        }}
                    >
                        {((price / sma20 - 1) * 100).toFixed(1)}%
                    </span>
                </div>
            </div>

            {/* 범례 */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <span
                        className={styles.legendDot}
                        style={{ backgroundColor: color }}
                    ></span>
                    <span>{symbol} 가격</span>
                </div>
                <div className={styles.legendItem}>
                    <span
                        className={styles.legendLine}
                        style={{ backgroundColor: '#10b981' }}
                    ></span>
                    <span>SMA 20일</span>
                </div>
                <div className={styles.legendItem}>
                    <span
                        className={styles.legendLine}
                        style={{ backgroundColor: '#f59e0b' }}
                    ></span>
                    <span>SMA 50일</span>
                </div>
            </div>
        </div>
    )
}

export default IndividualStockChart
