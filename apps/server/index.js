const express = require('express');
const cors = require('cors');
const { processAgentRequest } = require('./agents');
require('dotenv').config();

const app = express();
app.use(cors({
  origin: '*', // 모든 도메인에서의 접속을 임시로 허용하여 연결 안정성 확보
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', agent: 'concierge' });
});

app.post('/api/chat', async (req, res) => {
  const { message, context } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }
  
  const response = await processAgentRequest(message, context);
  res.json({ reply: response });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`SVI Backend running on port ${PORT}`);
});
