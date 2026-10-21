
import express from 'express'
import cors from 'cors'
import healthRoutes from './routes/health.routes.js'

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
}))

app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    message: 'TTSA API is running',
    status: 'success',
  })
})

app.use('/api/health', healthRoutes)

export default app
