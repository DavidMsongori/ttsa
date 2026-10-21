
import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`TTSA API running at http://localhost:${PORT}`)
})
