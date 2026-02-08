const express = require('express');
const cors = require('cors');
const { processAgentRequest } = require('./agents');
require('dotenv').config();

const app = express();
app.use(cors());
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
