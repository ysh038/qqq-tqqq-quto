import React from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts'

import styles from './StockChart.module.css'

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

interface IStockChartProps {
    qqqData: IStockData
    tqqqData: IStockData
}

function StockChart({ qqqData, tqqqData }: IStockChartProps) {
    // QQQ와 TQQQ 데이터를 합치기
    const combineChartData = () => {
        if (!qqqData.chartData || !tqqqData.chartData) {
            return []
        }

        // 날짜 기준으로 데이터 매핑
        const dataMap = new Map()

        qqqData.chartData.forEach((item) => {
            dataMap.set(item.date, {
                date: item.date,
                QQQ: item.price,
                timestamp: item.timestamp,
            })
        })

        tqqqData.chartData.forEach((item) => {
            const existing = dataMap.get(item.date) || {
                date: item.date,
                timestamp: item.timestamp,
            }
            existing.TQQQ = item.price
            dataMap.set(item.date, existing)
        })

        // 날짜순 정렬
        return Array.from(dataMap.values())
            .sort((a, b) => a.timestamp - b.timestamp)
            .slice(-30) // 최근 30일만 표시
    }

    const chartData = combineChartData()

    // 커스텀 툴팁
    const customTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean
        payload?: Array<{
            color: string
            dataKey: string
            value: number
        }>
        label?: string
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className={styles.tooltip}>
                    <p className={styles.tooltipDate}>{`날짜: ${label}`}</p>
                    {payload.map((item, index: number) => (
                        <p key={index} style={{ color: item.color }}>
                            {`${item.dataKey}: $${item.value?.toFixed(2)}`}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    // Y축 범위 계산
    const calculateYAxisDomain = () => {
        const allPrices = chartData.flatMap((item) =>
            [item.QQQ, item.TQQQ].filter(Boolean),
        )
        if (allPrices.length === 0) return ['auto', 'auto']

        const minPrice = Math.min(...allPrices)
        const maxPrice = Math.max(...allPrices)
        const padding = (maxPrice - minPrice) * 0.05 // 5% 패딩

        return [minPrice - padding, maxPrice + padding]
    }

    const [yMin, yMax] = calculateYAxisDomain()

    if (chartData.length === 0) {
        return (
            <div className={styles.chartContainer}>
                <div className={styles.chartHeader}>
                    <h3>📈 QQQ vs TQQQ 가격 차트</h3>
                </div>
                <div className={styles.noData}>
                    <p>차트 데이터를 로딩 중입니다...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.chartContainer}>
            <div className={styles.chartHeader}>
                <h3>📈 QQQ vs TQQQ 가격 차트 (최근 30일)</h3>
                <div className={styles.currentPrices}>
                    <span className={styles.qqqPrice}>
                        QQQ: ${qqqData.price.toFixed(2)}
                    </span>
                    <span className={styles.tqqqPrice}>
                        TQQQ: ${tqqqData.price.toFixed(2)}
                    </span>
                </div>
            </div>

            <div className={styles.chartWrapper}>
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />

                        <XAxis
                            dataKey="date"
                            stroke="#666"
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return `${date.getMonth() + 1}/${date.getDate()}`
                            }}
                        />

                        <YAxis
                            stroke="#666"
                            tick={{ fontSize: 12 }}
                            domain={[yMin, yMax]}
                            tickFormatter={(value) => `$${value.toFixed(0)}`}
                        />

                        <Tooltip />

                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* QQQ 라인 */}
                        <Line
                            type="monotone"
                            dataKey="QQQ"
                            stroke="#2563eb"
                            strokeWidth={2}
                            dot={{ fill: '#2563eb', strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: '#2563eb' }}
                            name="QQQ (나스닥 ETF)"
                        />

                        {/* TQQQ 라인 */}
                        <Line
                            type="monotone"
                            dataKey="TQQQ"
                            stroke="#dc2626"
                            strokeWidth={2}
                            dot={{ fill: '#dc2626', strokeWidth: 0, r: 3 }}
                            activeDot={{ r: 5, fill: '#dc2626' }}
                            name="TQQQ (3배 레버리지)"
                        />

                        {/* SMA 20일선 표시 (QQQ 기준) */}
                        <ReferenceLine
                            y={qqqData.sma20}
                            stroke="#10b981"
                            strokeDasharray="5 5"
                            label={{
                                value: 'SMA20',
                                position: 'insideTopRight',
                            }}
                        />

                        {/* SMA 50일선 표시 (QQQ 기준) */}
                        <ReferenceLine
                            y={qqqData.sma50}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                            label={{
                                value: 'SMA50',
                                position: 'insideTopRight',
                            }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* 차트 설명 */}
            <div className={styles.chartLegend}>
                <div className={styles.legendItem}>
                    <span className={styles.qqqDot}></span>
                    <span>QQQ - 나스닥 100 추종 ETF</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.tqqqDot}></span>
                    <span>TQQQ - 나스닥 100 3배 레버리지 ETF</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.sma20Line}></span>
                    <span>SMA20 - 20일 단순이동평균</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.sma50Line}></span>
                    <span>SMA50 - 50일 단순이동평균</span>
                </div>
            </div>
        </div>
    )
}

export default StockChart
