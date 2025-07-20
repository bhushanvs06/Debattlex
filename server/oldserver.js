const express = require('express');
const { SarvamAIClient } = require("sarvamai");
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Error:", err));

// 📦 Entry Subschema (used for each entry in entries map)
const EntrySchema = new mongoose.Schema({
  type: String,
  topic: String,
  stance: String,
}, { _id: false });

// 👤 User Schema & Model
const UserSchema = new mongoose.Schema({
  displayName: String,
  email: { type: String, unique: true },
  password: String,
  entries: {
    type: Map,
    of: EntrySchema,
    default: {}
  }
});
const User = mongoose.model("User", UserSchema);

// ✅ SIGNUP
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword, displayName });

    res.status(201).json({ message: 'User created', user: { email, displayName } });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ LOGIN
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, 'secret123', { expiresIn: '1d' });

    res.json({
      message: 'Login successful',
      user: { email, displayName: user.displayName },
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ✅ SAVE ENTRY (Map-based with key)
app.post('/api/userdata', async (req, res) => {
  const { email, entry } = req.body;

  if (!email || !entry || !entry.topic) {
    return res.status(400).json({ error: 'Email and valid entry with topic are required' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Sanitize topic to create a valid key
    let key = entry.topic
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // remove special characters
      .replace(/\s+/g, '_');   // replace spaces with underscores

    // Ensure uniqueness if a topic already exists
    let uniqueKey = key;
    let counter = 1;
    while (user.entries.has(uniqueKey)) {
      uniqueKey = `${key}_${counter++}`;
    }

    user.entries.set(uniqueKey, entry);
    await user.save();

    res.status(200).json({
      message: 'Entry saved under topic key',
      key: uniqueKey,
      entries: Object.fromEntries(user.entries),
    });
  } catch (err) {
    console.error('Error saving user entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// ✅ FETCH ENTRIES
app.post('/api/fetchEntries', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      entries: user.entries,
      displayName: user.displayName  // ✅ send displayName to frontend
    });
  } catch (err) {
    res.status(500).json({ error: 'Error fetching user entries' });
  }
});

// 🧠 Sarvam AI integration
const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY,
});
app.post('/ask', async (req, res) => {
  const { question, topic, stance, type, transcripts } = req.body;

  try {
    const context = `
You are participating in a formal debate.

Debate Topic: ${topic}
User Stance: ${stance}
Debate Type: ${type}

Previous User Transcripts:
${transcripts?.map(t => `${t.speaker}: ${t.text}`).join('\n') || 'None'}

Now respond intelligently and argumentatively to the following input:
"${question}"
`.trim();

    const response = await client.chat.completions({
      messages: [{ role: 'user', content: context }]
    });

    const answer = response.choices?.[0]?.message?.content || "No response from AI.";
    res.json({ answer });

  } catch (err) {
    console.error('Sarvam API Error:', err.message || err);
    res.status(500).json({ error: 'Failed to get response from Sarvam AI' });
  }
});


app.post('/api/summarize-transcripts', async (req, res) => {
  const { userTranscripts, aiTranscripts } = req.body;

  if (!Array.isArray(userTranscripts) || !Array.isArray(aiTranscripts)) {
    return res.status(400).json({ error: 'userTranscripts and aiTranscripts must be arrays' });
  }

  try {
    // Extract texts
    const userText = userTranscripts.map(t => t.text).reverse().join(' ');
    const aiText = aiTranscripts.map(t => t.text).reverse().join(' ');

    const userPrompt = `
You are an assistant helping to summarize a debate participant's arguments.
Summarize the user's statements (even if they include factual or logical errors) in simple 1–2 line bullet points.
Do not correct or refute the arguments. Only summarize what the user said.

Statements:
${userText}

Summary:
-`;

    const aiPrompt = `
You are an assistant helping to summarize AI's debate responses.
Summarize the AI's responses clearly in bullet points for  in simple 1–2 line bullet points Do not correct or refute the arguments. Only summarize what the user said.

Responses:
${aiText}

Summary:
-`;

    // Call Sarvam AI API
    const [userRes, aiRes] = await Promise.all([
      client.chat.completions({ messages: [{ role: 'user', content: userPrompt }] }),
      client.chat.completions({ messages: [{ role: 'user', content: aiPrompt }] })
    ]);

    const userSummary = userRes.choices[0].message.content.trim();
    const aiSummary = aiRes.choices[0].message.content.trim();

    res.json({ userSummary, aiSummary });

  } catch (err) {
    console.error("❌ Sarvam summary API error:", err.message || err);
    res.status(500).json({ error: "Failed to generate summaries" });
  }
});


app.post('/api/generate-debate-topic', async (req, res) => {
  const { interest } = req.body;

  if (!interest) {
    return res.status(400).json({ error: 'Interest is required' });
  }

  try {
    const prompt = `Generate a thought-provoking debate topic based on the following interest: "${interest}".Generate a single topic and format it in single line`;

    const response = await client.chat.completions({
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedTopic = response.choices[0].message.content.trim();
    res.json({ generatedTopic });
  } catch (err) {
    console.error('Sarvam API Error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate topic' });
  }
});

// ✅ Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
