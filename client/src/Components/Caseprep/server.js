require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:3000';
const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(bodyParser.json());

app.post('/api/teammate', async (req, res) => {
  const { userInput, topic = 'General debate', role, stance = 'Neutral' } = req.body;

  if (!userInput || !role) {
    return res.status(400).json({ error: 'Missing userInput or role in /api/teammate' });
  }

  const prompt = `You are a helpful AI debate teammate.
Debate Topic: ${topic}
Side: ${stance}
Role: ${role}
Teammate said: "${userInput}"
Suggest strategic ideas, questions to consider, or relevant points.`;

  try {
    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'sarvam-m',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices?.[0]?.message?.content || 'No response from Sarvam AI';
    res.json({ result });
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error('Sarvam API Error (/api/teammate):', errorMessage);
    res.status(500).json({ error: `Failed to get response from Sarvam AI: ${errorMessage}` });
  }
});

app.post('/api/search', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Missing query in /api/search' });
  }

  const prompt = `You are a research assistant for a debate preparation tool. Provide concise, relevant evidence, statistics, or case studies for the following query: "${query}"`;

  try {
    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'sarvam-m',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    const result = response.data.choices?.[0]?.message?.content || 'No results found.';
    res.json({ result });
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error('Sarvam API Error (/api/search):', errorMessage);
    res.status(500).json({ error: `Failed to get search results from Sarvam AI: ${errorMessage}` });
  }
});

app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in /api/summarize' });
  }

  const prompt = `Summarize this text in 1-2 short sentences, max 50 characters: "${text}"`;

  try {
    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: 'You are an AI that summarizes text concisely.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 50,
        temperature: 0.2,
        reasoning_effort: 'medium',
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Sarvam API Response (/api/summarize):', response.data);
    const summary = response.data.choices?.[0]?.message?.content || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error('Sarvam API Error (/api/summarize):', errorMessage, err);
    res.status(500).json({ error: `Failed to summarize text: ${errorMessage}` });
  }
});

app.post('/api/factcheck', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in /api/factcheck' });
  }

  const prompt = `You are a fact-checking AI. Verify the accuracy of the following text and provide a concise assessment of its factual correctness, including any corrections or clarifications if needed: "${text}"`;

  try {
    const response = await axios.post(
      SARVAM_API_URL,
      {
        model: 'sarvam-m',
        messages: [
          { role: 'system', content: 'You are an AI that verifies facts accurately.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 150,
        temperature: 0.5,
        reasoning_effort: 'high',
      },
      {
        headers: {
          'api-subscription-key': SARVAM_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Sarvam API Response (/api/factcheck):', response.data);
    const result = response.data.choices?.[0]?.message?.content || 'No fact-check results available.';
    res.json({ result });
  } catch (err) {
    const errorMessage = err.response?.data?.error?.message || err.message;
    console.error('Sarvam API Error (/api/factcheck):', errorMessage, err);
    res.status(500).json({ error: `Failed to fact-check text: ${errorMessage}` });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});