import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import stockRoutes from './routes/stockRoutes.js'

// 환경변수 로드
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 미들웨어 설정
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}))

app.use(express.json())

// 요청 로깅 미들웨어
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
})

// 라우트 설정
app.use('/api', stockRoutes)

// 헬스 체크
app.get('/', (req, res) => {
    res.json({ 
        message: 'Stock Auto Trading Backend API',
        status: 'running',
        timestamp: new Date().toISOString()
    })
})

// 에러 핸들링 미들웨어
app.use((err, req, res, next) => {
    console.error('Error:', err.message)
    res.status(500).json({ 
        error: 'Internal Server Error',
        message: err.message 
    })
})

// 404 핸들러
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' })
})

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`)
    console.log(`📊 Stock API endpoints available at http://localhost:${PORT}/api`)
}) 