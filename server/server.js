// 🔧 Dependencies
const express = require('express');
const { SarvamAIClient } = require("sarvamai");
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const bodyParser = require('body-parser');
const rolesByType = {
  "1v1": { prop: ["pm"], opp: ["lo"] },
  "3v3": { prop: ["pm", "dpm", "gw"], opp: ["lo", "dlo", "ow"] },
  "5v5": { prop: ["pm", "dpm", "gw", "member", "whip"], opp: ["lo", "dlo", "ow", "member", "whip"] }
};



const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// 🔌 MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas"))
  .catch(err => console.error("❌ MongoDB Error:", err));
// 📝 AI Judge Feedback Subschema (Per Role)
const RoleFeedbackSchema = new mongoose.Schema({
  feedbackText: { type: String, default: "" },
  logic: { type: Number, default: 0 },
  clarity: { type: Number, default: 0 },
  relevance: { type: Number, default: 0 },
  persuasiveness: { type: Number, default: 0 },
  depth: { type: Number, default: 0 },
  evidenceUsage: { type: Number, default: 0 },
  emotionalAppeal: { type: Number, default: 0 },
  rebuttalStrength: { type: Number, default: 0 },
  structure: { type: Number, default: 0 },
  overall: { type: Number, default: 0 }
}, { _id: false });


// 📝 AI Judge Feedback per team (Map of roles)
const TeamFeedbackSchema = new mongoose.Schema({
  pm: RoleFeedbackSchema,
  dpm: RoleFeedbackSchema,
  gw: RoleFeedbackSchema,
  member: RoleFeedbackSchema,
  whip: RoleFeedbackSchema,
  lo: RoleFeedbackSchema,
  dlo: RoleFeedbackSchema,
  ow: RoleFeedbackSchema
}, { _id: false });

// 🧠 Full AI Judgement Subschema
const AIFeedbackSchema = new mongoose.Schema({
  proposition: TeamFeedbackSchema,
  opposition: TeamFeedbackSchema,
  winner: String,
  reason: String
}, { _id: false });

// 🎤 Debate Role Schema
const RoleSchema = new mongoose.Schema({
  prep: String,
  notes:{ type: String, default: "" },
  transcript: [String],
  summary: [String],
  aifeedback: { type: RoleFeedbackSchema, default: () => ({}) },
  
}, { _id: false });

// 🗣️ Entry Schema for each debate
const EntrySchema = new mongoose.Schema({
  type: { type: String, default: "Beginner" },
  debateType: { type: String, default: "1v1" }, // "1v1", "3v3", "5v5"
  topic: String,
  stance: String,
  userrole: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  proposition: {
    pm: RoleSchema,
    dpm: RoleSchema,
    gw: RoleSchema,
    member: RoleSchema,
    whip: RoleSchema
  },

  opposition: {
    lo: RoleSchema,
    dlo: RoleSchema,
    ow: RoleSchema,
    member: RoleSchema,
    whip: RoleSchema
  },

  winner: { type: String, default: "" },
  reason: { type: String, default: "" }
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

app.get('/api/ping', (req, res) => {
  res.json({ message: 'pong 🏓 from Debattlex backend' });
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
});const normalizeDebateType = (raw) => raw.replace(/\s+/g, '').toLowerCase();

app.get('/', (req, res) => {
  res.send('<h1>✅ Debattlex Backend is Live!</h1>');
});

app.post('/api/userdata', async (req, res) => {
  const { email, entry } = req.body;

  if (!email || !entry || !entry.topic || !entry.debateType || !entry.stance || !entry.userrole) {
    return res.status(400).json({ error: 'Missing required fields: email, topic, debateType, stance, userrole' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    let key = entry.topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    let uniqueKey = key;
    let counter = 1;
    while (user.entries.has(uniqueKey)) {
      uniqueKey = `${key}_${counter++}`;
    }

    const initializeRoleData = () => ({
      prep: "",
      transcript: [],
      summary: []
    });

    const normalizedType = normalizeDebateType(entry.debateType);
    const roles = rolesByType[normalizedType];

    if (!roles) {
      return res.status(400).json({ error: 'Invalid debate type format' });
    }

    const initializedEntry = {
      type: entry.type,
      topic: entry.topic,
      debateType: normalizedType,
      stance: entry.stance,
      userrole: entry.userrole,
      proposition: {},
      opposition: {}
    };

    roles.prop.forEach(role => {
      initializedEntry.proposition[role] = initializeRoleData();
    });
    roles.opp.forEach(role => {
      initializedEntry.opposition[role] = initializeRoleData();
    });

    user.entries.set(uniqueKey, initializedEntry);
    await user.save();

    res.status(200).json({
      message: 'Entry saved under topic key',
      key: uniqueKey,
      entries: Object.fromEntries(user.entries),
    });
  } catch (err) {
    console.error('❌ Error saving user entry:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.patch('/api/userdata', async (req, res) => {
  const { email, entry } = req.body;

  if (!email || !entry || !entry.topic || !entry.debateType || !entry.stance || !entry.userrole) {
    return res.status(400).json({ error: 'Missing required entry fields' });
  }

  const topicKey = entry.topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
  const normalizedType = entry.debateType;
  const userTeam = entry.stance; // "proposition" or "opposition"
  const userRole = entry.userrole;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Initialize topic entry if it doesn't exist
    if (!user.entries.has(topicKey)) {
      user.entries.set(topicKey, {
        topic: entry.topic,
        type: normalizedType,
        stance: userTeam,
        userrole: userRole,
        proposition: {},
        opposition: {}
      });
    }

    const targetEntry = user.entries.get(topicKey);

    // Ensure role object exists for user
    if (!targetEntry[userTeam][userRole]) {
      targetEntry[userTeam][userRole] = { prep: "", transcript: [], summary: [] };
    }

    // Append user transcript and summary
    if (Array.isArray(entry.userTranscript)) {
      targetEntry[userTeam][userRole].transcript.push(...entry.userTranscript.filter(Boolean));
    }
    if (Array.isArray(entry.userSummary)) {
      targetEntry[userTeam][userRole].summary.push(...entry.userSummary.filter(Boolean));
    }

    // ---------- AI SIDE ----------
    const aiTeam = userTeam === "proposition" ? "opposition" : "proposition";

    const defaultRoles = {
      beginner: { proposition: "pm", opposition: "lo" },
      intermediate: { proposition: "pm", opposition: "lo" },
      extraordinary: { proposition: "pm", opposition: "lo" },
      "1v1": { proposition: "pm", opposition: "lo" },
      "3v3": { proposition: "pm", opposition: "lo" },
      "5v5": { proposition: "pm", opposition: "lo" }
    };

    const aiRole = defaultRoles[normalizedType]?.[aiTeam] || "lo";

    if (!targetEntry[aiTeam][aiRole]) {
      targetEntry[aiTeam][aiRole] = { prep: "", transcript: [], summary: [] };
    }

    // Save AI transcript and summary
    if (Array.isArray(entry.aiTranscript)) {
      targetEntry[aiTeam][aiRole].transcript.push(...entry.aiTranscript.filter(Boolean));
    }
    if (Array.isArray(entry.aiSummary)) {
      targetEntry[aiTeam][aiRole].summary.push(...entry.aiSummary.filter(Boolean));
    }

    // Update in user's entries
    user.entries.set(topicKey, targetEntry);
    await user.save();

    res.status(200).json({ message: "✅ User data updated successfully." });
  } catch (err) {
    console.error("❌ PATCH /api/userdata error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});


app.patch('/api/saveSummaries', async (req, res) => {
  const { email, summaries } = req.body;

  if (
    !email ||
    !summaries ||
    !summaries.topic ||
    !summaries.debateType ||
    !summaries.stance ||
    !summaries.userrole ||
    !Array.isArray(summaries.points)
  ) {
    return res.status(400).json({
      error: 'Missing required fields: email, topic, debateType, stance, userrole, points[]'
    });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const key = summaries.topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');

    if (!user.entries.has(key)) {
      return res.status(404).json({ error: 'Entry not found for this topic' });
    }

    const entry = user.entries.get(key);
    const teamKey = summaries.stance === "proposition" ? "proposition" : "opposition";
    const roleKey = summaries.userrole;

    if (!entry[teamKey] || !entry[teamKey][roleKey]) {
      return res.status(400).json({ error: `Role ${roleKey} not found in ${teamKey}` });
    }

    // Push summary points to respective role
    entry[teamKey][roleKey].summary.push(...summaries.points);
    entry.updatedAt = new Date();

    user.entries.set(key, entry);
    await user.save();

    res.status(200).json({ message: 'Summaries saved successfully' });
  } catch (err) {
    console.error("❌ Error saving summaries:", err);
    res.status(500).json({ error: 'Failed to save summaries' });
  }
});


// ✅ FETCH ENTRIES (with support for role-based schema)
// app.post('/api/fetchEntries', async (req, res) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });

//     if (!user) return res.status(404).json({ error: 'User not found' });

//     // Convert entries Map (if used) to plain object
//     const entries = user.entries instanceof Map
//       ? Object.fromEntries(user.entries)
//       : user.entries;

//     res.json({
//       entries,
//       displayName: user.displayName
//     });
//   } catch (err) {
//     console.error("Error fetching entries:", err);
//     res.status(500).json({ error: 'Error fetching user entries' });
//   }
// });

// ✅ FETCH ENTRIES (with support for role-based schema)
app.post('/api/fetchEntries', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email }).lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const rawEntries = user.entries instanceof Map
      ? Object.fromEntries(user.entries)
      : user.entries || {};

    const formattedEntries = Object.entries(rawEntries).reduce((acc, [topicKey, entry]) => {
      const stance = entry.stance?.toLowerCase() || 'proposition';
      const userrole = entry.userrole?.toLowerCase();
      const team = entry[stance] || {};
      const roleData = team?.[userrole] || {};

      // Use top-level winner and reason, with fallbacks
      const winner = entry.winner || "Not determined";
      const reason = entry.reason || "No reason provided";

      // aiJudgeFeedback remains optional
      const aiJudgeFeedback = entry.winner && entry.reason
        ? { winner: entry.winner, reason: entry.reason }
        : null;

      acc[topicKey] = {
        type: entry.type || 'beginner',
        debateType: entry.debateType || '1v1',
        topic: entry.topic || topicKey.replace(/_/g, ' '),
        stance: stance,
        userrole: userrole,
        createdAt: entry.createdAt || new Date(),
        updatedAt: entry.updatedAt || new Date(),
        winner: winner, // Always include winner
        reason: reason, // Always include reason
        aiJudgeFeedback: aiJudgeFeedback, // Optional structured feedback
        proposition: entry.proposition || {},
        opposition: entry.opposition || {},
        transcript: roleData.transcript || '',
        summary: roleData.summary || '',
        aifeedback: {
          feedbackText: roleData.aifeedback?.feedbackText || '',
          logic: roleData.aifeedback?.logic || 0,
          clarity: roleData.aifeedback?.clarity || 0,
          relevance: roleData.aifeedback?.relevance || 0,
          persuasiveness: roleData.aifeedback?.persuasiveness || 0,
          depth: roleData.aifeedback?.depth || 0,
          evidenceUsage: roleData.aifeedback?.evidenceUsage || 0,
          emotionalAppeal: roleData.aifeedback?.emotionalAppeal || 0,
          rebuttalStrength: roleData.aifeedback?.rebuttalStrength || 0,
          structure: roleData.aifeedback?.structure || 0,
          overall: roleData.aifeedback?.overall || 0
        }
      };

      return acc;
    }, {});

    res.json({
      entries: formattedEntries,
      displayName: user.displayName || 'User',
      email: user.email,
      id: user._id.toString()
    });

  } catch (err) {
    console.error('❌ Error fetching entries:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.post("/api/getStats", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const entries = Object.values(user.entries || {});
    const totalDebates = entries.length;

    let wins = 0;
    let losses = 0;
    const winLossHistory = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const stance = entry.stance?.toLowerCase();
      const winner = entry.winner?.toLowerCase();

      if (stance && winner) {
        if (stance === winner) {
          wins++;
          winLossHistory.push({ index: i + 1, result: 'win' });
        } else {
          losses++;
          winLossHistory.push({ index: i + 1, result: 'loss' });
        }
      }
    }

    const winRate = totalDebates > 0 ? Math.round((wins / totalDebates) * 100) : 0;

    return res.json({
      totalDebates,
      winRate,
      wins,
      losses,
      winLossHistory,
    });
  } catch (err) {
    console.error("Error in getStats:", err);
    res.status(500).json({ message: "Server error" });
  }
});




// 🧠 Sarvam AI Integration
const client = new SarvamAIClient({
  apiSubscriptionKey: process.env.SARVAM_API_KEY
});

app.post('/ask', async (req, res) => {
  const { question, topic, stance, type, transcripts } = req.body;

  // 🔐 Explicit validation (avoid 400s from bad inputs)
  if (!question || !topic || !stance || !type || !Array.isArray(transcripts)) {
    return res.status(400).json({ error: 'Missing or invalid fields in /ask request' });
  }

  try {
    const context = `Debate Topic: ${topic}
Stance: ${stance}
Type: ${type}
Previous Transcripts:\n${transcripts.map(t => `${t.speaker}: ${t.text}`).join('\n')}

Now continue the debate based on the following user input:\n"${question}"`;

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


// 🧠 Transcript Summarization
app.post('/api/summarize-transcripts', async (req, res) => {
  const { userTranscripts, aiTranscripts } = req.body;

  if (!Array.isArray(userTranscripts) || !Array.isArray(aiTranscripts)) {
    return res.status(400).json({ error: 'userTranscripts and aiTranscripts must be arrays' });
  }

  try {
    const userText = userTranscripts.map(t => t.text).reverse().join(' ');
    const aiText = aiTranscripts.map(t => t.text).reverse().join(' ');

    const userPrompt = `Summarize user's arguments as  very short bullet points: dont add extra points, its a debate it should be as it is\n${userText}`;
    const aiPrompt = `Summarize AI's arguments as very short bullet points:dont add extra points, its a debate it should be as it is\n${aiText}`;

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

// 🎯 Topic Generator
app.post('/api/generate-debate-topic', async (req, res) => {
  const { interest } = req.body;

  if (!interest) return res.status(400).json({ error: 'Interest is required' });

  try {
    const prompt = `Generate only one thought-provoking debate topic with out ' " ' based on : "${interest}".`;
    const response = await client.chat.completions({ messages: [{ role: 'user', content: prompt }] });
    const generatedTopic = response.choices[0].message.content.trim();
    res.json({ generatedTopic });
  } catch (err) {
    console.error('Sarvam API Error:', err.message || err);
    res.status(500).json({ error: 'Failed to generate topic' });
  }
});

app.post("/api/judge", async (req, res) => {
  const { email, topic } = req.body;
  if (!email || !topic) return res.status(400).json({ error: 'Email and topic are required' });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const key = topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');
    const entry = user.entries.get(key);
    if (!entry) return res.status(404).json({ error: 'Entry not found for this topic' });

    const systemPrompt = `
You are an AI debate judge. Evaluate the two arguments below on the topic "${topic}" using the following 10 criteria, scoring each from 0 to 10:

1. Logic
2. Clarity
3. Relevance
4. Persuasiveness
5. Depth
6. Evidence Usage
7. Emotional Appeal
8. Rebuttal Strength
9. Structure
10. Overall (average of the above 9)

Return only the following JSON (no extra explanation):

{
  "user": {
    "feedbackText": "...",
    "logic": number,
    "clarity": number,
    "relevance": number,
    "persuasiveness": number,
    "depth": number,
    "evidenceUsage": number,
    "emotionalAppeal": number,
    "rebuttalStrength": number,
    "structure": number,
    "overall": number
  },
  "ai": {
    "feedbackText": "...",
    "logic": number,
    "clarity": number,
    "relevance": number,
    "persuasiveness": number,
    "depth": number,
    "evidenceUsage": number,
    "emotionalAppeal": number,
    "rebuttalStrength": number,
    "structure": number,
    "overall": number
  }
}`;

    const propositionRoles = ['pm', 'dpm', 'gw'];
    const oppositionRoles = ['lo', 'dlo', 'ow'];
    let propScore = 0, oppScore = 0;

    entry.aifeedback = { proposition: {}, opposition: {}, winner: "", reason: "" };

    const fullResult = {};

    for (let i = 0; i < 3; i++) {
      const proRole = propositionRoles[i];
      const oppRole = oppositionRoles[i];

      const proTranscript = (entry.proposition?.[proRole]?.transcript || []).join(" ");
      const oppTranscript = (entry.opposition?.[oppRole]?.transcript || []).join(" ");

      const input = `Debate Topic: ${topic}\n\nUser: ${proTranscript}\n\nAI: ${oppTranscript}`;

      const response = await client.chat.completions({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: input }
        ]
      });

      const reply = response.choices[0].message.content;
      let parsed;
      try {
        parsed = JSON.parse(reply);
      } catch (e) {
        console.error("❌ AI response invalid:", reply);
        return res.status(500).json({ error: "Invalid AI JSON", raw: reply });
      }

      const makeFb = (obj) => ({
        feedbackText: obj.feedbackText || "",
        logic: obj.logic ?? 0,
        clarity: obj.clarity ?? 0,
        relevance: obj.relevance ?? 0,
        persuasiveness: obj.persuasiveness ?? 0,
        depth: obj.depth ?? 0,
        evidenceUsage: obj.evidenceUsage ?? 0,
        emotionalAppeal: obj.emotionalAppeal ?? 0,
        rebuttalStrength: obj.rebuttalStrength ?? 0,
        structure: obj.structure ?? 0,
        overall: obj.overall ?? 0,
      });

      const proFb = makeFb(parsed.user);
      const oppFb = makeFb(parsed.ai);

      // Store in entry for MongoDB
      entry.aifeedback.proposition[proRole] = proFb;
      entry.aifeedback.opposition[oppRole] = oppFb;

      // Store in fullResult for frontend
      fullResult[proRole] = proFb;
      fullResult[oppRole] = oppFb;

      propScore += proFb.overall;
      oppScore += oppFb.overall;
    }

    const winner = propScore > oppScore ? "Proposition" : "Opposition";

    const reasonPrompt = `
The proposition team scored ${propScore.toFixed(2)}.
The opposition team scored ${oppScore.toFixed(2)}.

Explain in 4 lines why "${winner}" won based on argument quality, rebuttals, and structure.
Return plain text only.`;

    const reasonRes = await client.chat.completions({
      messages: [{ role: "user", content: reasonPrompt }]
    });

    const reasonText = reasonRes.choices[0].message.content.trim();

    // Save to DB
    entry.aifeedback.winner = winner;
    entry.aifeedback.reason = reasonText;

    user.entries.set(key, entry);
    user.markModified(`entries.${key}`);
    await user.save();

    console.log("✅ Full team judgement completed and saved.");

    res.json({
      message: "All roles judged and result saved.",
      result: {
        ...fullResult, // include pm, dpm, gw, lo, dlo, ow
        propositionScore: propScore,
        oppositionScore: oppScore,
        winner,
        reason: reasonText
      }
    });

  } catch (err) {
    console.error("❌ Judging failed:", err.message);
    res.status(500).json({ error: "Judging error" });
  }
});

// app.get('/api/fetchJudgement', async (req, res) => {
//   try {
//     const { email } = req.query;

//     if (!email) return res.status(400).json({ error: 'Email is required' });

//     const entry = await Entry.findOne({ useremail: email }).sort({ createdAt: -1 });

//     if (!entry) return res.status(404).json({ error: 'No entry found' });

//     const result = {
//       winner: entry.winner,
//       reason: entry.reason,
//       topic: entry.topic,
//       proposition: entry.aifeedback?.proposition || {},
//       opposition: entry.aifeedback?.opposition || {},
//     };

//     const userRole = entry.userrole?.toLowerCase();
//     const teamSide = entry.userteam?.toLowerCase();

//     if (teamSide && userRole && entry.aifeedback?.[teamSide]?.[userRole]) {
//       const userFeedback = entry.aifeedback[teamSide][userRole];

//       result.user = {
//         ...userFeedback,
//         role: userRole,
//         team: teamSide,
//       };
//     }

//     // 🔍 Log the final result object
//     console.log("📦 Judgement Result Sent to Client:", JSON.stringify(result, null, 2));

//     return res.json({ result });
//   } catch (err) {
//     console.error('Error fetching judgement:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
//   }
// });



// In your server file (e.g., server.js or routes.js)
// 🧠 Save Judgement Route
// ✅ Route: Save AI Judgement
app.post('/api/save-judgement', async (req, res) => {
  const { email, topicKey, judgeResult } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.entries.has(topicKey)) return res.status(404).json({ error: "Topic entry not found" });

const entry = user.entries.get(topicKey);
if (!entry) {
  console.log("❌ Entry not found for topicKey:", topicKey);
  return res.status(404).json({ error: 'Entry not found' });
}

const rolesMap = {
  pm: 'proposition',
  dpm: 'proposition',
  gw: 'proposition',
  lo: 'opposition',
  dlo: 'opposition',
  ow: 'opposition',
};

console.log("📌 Starting to process AI feedback per role");

for (const [role, team] of Object.entries(rolesMap)) {
  const roleFeedback = judgeResult[role];

  if (!roleFeedback) {
    console.log(`⚠️ No feedback for role: ${role}`);
    continue;
  }

  // Build feedback object
  const feedback = {
    feedbackText: roleFeedback.feedbackText || 'yes',
    logic: roleFeedback.logic ?? 0,
    clarity: roleFeedback.clarity ?? 0,
    relevance: roleFeedback.relevance ?? 0,
    persuasiveness: roleFeedback.persuasiveness ?? 0,
    depth: roleFeedback.depth ?? 0,
    evidenceUsage: roleFeedback.evidenceUsage ?? 0,
    emotionalAppeal: roleFeedback.emotionalAppeal ?? 0,
    rebuttalStrength: roleFeedback.rebuttalStrength ?? 0,
    structure: roleFeedback.structure ?? 0,
    overall: roleFeedback.overall ?? 0,
  };

  if (!entry[team] || !entry[team][role]) {
    console.log(`❌ Path not found: entry.${team}.${role}`);
    continue;
  }

  entry[team][role].aifeedback = feedback;
  console.log(`✅ Saved feedback for ${team} ${role}:`, feedback);
}


    // Save top-level winner and reason
    entry.winner = judgeResult.winner || '';
    entry.reason = judgeResult.reason || '';

    // Save back the modified entry
    user.entries.set(topicKey, entry);
    await user.save();

    res.status(200).json({ message: "Judgement saved successfully" });
  } catch (err) {
    console.error("❌ Error saving judgement:", err);
    res.status(500).json({ error: "Internal error" });
  }
});




// In-memory storage
const debateStorage = {
  topic: '',
  transcripts: {},     // { PM: "...", LO: "...", ... }
  summaries: {
    prop: [],
    opp: []
  }
};

// ✅ Route: Generate AI Speech
app.post('/api/generateAISpeech', async (req, res) => {
  const { role, team, topic, prep } = req.body; // 🟢 Add prep here

  if (!role || !team || !topic) {
    return res.status(400).json({ error: 'Missing role, team, or topic' });
  }

  try {
    const prompt = `As ${role} of the ${team === 'prop' ? 'Proposition' : 'Opposition'} team in an Asian Parliamentary debate, deliver a strong 1-minute speech on the topic: "${topic}". Use the following preparation as context: "${prep}". Speak in first person. Use a logical and persuasive tone.`;

    const response = await client.chat.completions({
      messages: [{ role: 'user', content: prompt }],
      model: "sarvam-llama-2",
      temperature: 0.7
    });

    const transcript = response.choices?.[0]?.message?.content?.trim();

    if (!transcript || transcript.length < 10) {
      return res.status(500).json({ error: 'Empty or invalid transcript from Sarvam' });
    }

    debateStorage.transcripts[role] = transcript;
    res.status(200).json({ transcript });
  } catch (err) {
    console.error("❌ Sarvam AI Speech Error:", err.message || err);
    res.status(500).json({ error: 'Failed to generate AI speech' });
  }
});


// ✅ Route: Generate Summary
app.post('/api/generateSummary', async (req, res) => {
  const { transcript, role, team, topic } = req.body;

  if (!transcript || !role || !team || !topic) {
    return res.status(400).json({ error: 'Missing required fields: transcript, role, team, topic' });
  }

  try {
    const prompt = `You are ${role}, representing the ${team === "prop" ? "Proposition" : "Opposition"} team in an Asian Parliamentary debate on the topic: \"${topic}\". Summarize the following speech in two concise bullet points.\n\nSpeech:\n\"\"\"${transcript}\"\"\"`;

    const response = await client.chat.completions({
      messages: [{ role: "user", content: prompt }],
      model: "sarvam-llama-2",
      temperature: 0.5
    });

    const result = response.choices?.[0]?.message?.content || "";
    let summary = result
      .split('\n')
      .map(line => line.trim())
      .filter(line =>
        line.startsWith("-") ||
        line.startsWith("•") ||
        /^\d\./.test(line)
      );

    if (summary.length === 0 && result.trim().length > 0) {
      summary = [result.trim()];
    }

    if (team === 'prop') {
      debateStorage.summaries.prop.push(...summary);
    } else {
      debateStorage.summaries.opp.push(...summary);
    }

    res.status(200).json({ summary });
  } catch (error) {
    console.error("❌ Sarvam summary error:", error);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// ✅ Optional: Get full memory state
app.get('/api/debateData', (req, res) => {
  res.json(debateStorage);
});

app.post("/api/userdata3v3", async (req, res) => {
  const { email, topicSlug, team, role, transcript, summary } = req.body;

  if (!email || !topicSlug || !team || !role || !transcript || !summary) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Ensure the entry exists
    if (!user.entries.has(topicSlug)) {
      user.entries.set(topicSlug, {
        topic: topicSlug.replace(/_/g, ' '),
        type: "Beginner",
        debateType: "3v3",
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    const entry = user.entries.get(topicSlug);
    const targetTeam = team.toLowerCase();
    const targetRole = role.toLowerCase();

    // Initialize team & role if missing
    if (!entry[targetTeam]) entry[targetTeam] = {};
    if (!entry[targetTeam][targetRole]) {
      entry[targetTeam][targetRole] = { transcript: [], summary: [] };
    }

    // Push transcript & summary
    entry[targetTeam][targetRole].transcript.push(transcript);
    entry[targetTeam][targetRole].summary.push(...summary);

    // Update timestamps
    entry.updatedAt = new Date();

    user.entries.set(topicSlug, entry);
    await user.save();

    res.status(200).json({ message: "3v3 entry updated", topicSlug });
  } catch (err) {
    console.error("❌ Error updating 3v3 entry:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ✅ Save Role Transcript and Summary
app.post('/api/saveRoleTranscript', async (req, res) => {
  const { email, topicSlug, team, role, transcript, summary } = req.body;

  if (!email || !topicSlug || !team || !role || !transcript || !summary) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.entries?.get(topicSlug); // ✅ access Map key correctly
    if (!entry) return res.status(404).json({ message: 'Topic not found' });

    const teamBlock = entry[team];
    if (!teamBlock) return res.status(400).json({ message: 'Invalid team' });

    const roleBlock = teamBlock[role];
    if (!roleBlock) return res.status(400).json({ message: 'Invalid role' });

    // ✅ Add transcript
    if (!Array.isArray(roleBlock.transcript)) {
      roleBlock.transcript = [];
    }
    roleBlock.transcript.push(transcript);

    // ✅ Overwrite summary
    roleBlock.summary = Array.isArray(summary) ? summary : [summary];

    // ✅ Update entry inside Map
    entry.updatedAt = new Date();
    user.entries.set(topicSlug, entry);

    await user.save();

    res.status(200).json({ message: 'Transcript and summary saved successfully' });
  } catch (err) {
    console.error('❌ Error saving transcript:', err);
    res.status(500).json({ message: 'Server error' });
  }
});





// Minimal schema setup for user
app.patch('/api/savePrep', async (req, res) => {
  const { email, topic, stance, debateType, userrole, userPrep, teammates } = req.body;
  const topicKey = topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Init entry if not present
    if (!user.entries.has(topicKey)) {
      user.entries.set(topicKey, {
        topic,
        type: debateType,
        stance,
        userrole,
        proposition: {},
        opposition: {}
      });
    }

    const entry = user.entries.get(topicKey);
    const teamKey = stance === 'proposition' ? 'proposition' : 'opposition';

    // User prep
    if (!entry[teamKey][userrole]) {
      entry[teamKey][userrole] = { prep: "", transcript: [], summary: [] };
    }
    entry[teamKey][userrole].prep = userPrep;

    // Teammates prep
    teammates.forEach(({ role, prep }) => {
      if (!entry[teamKey][role]) {
        entry[teamKey][role] = { prep: "", transcript: [], summary: [] };
      }
      entry[teamKey][role].prep = prep;
    });

    // Save and return
    user.entries.set(topicKey, entry);
    await user.save();

    res.status(200).json({ message: "Prep saved successfully." });

  } catch (err) {
    console.error("❌ savePrep error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
app.post('/api/userentry', async (req, res) => {
  const { email, topic } = req.body;

  if (!email || !topic) {
    return res.status(400).json({ error: "Missing email or topic" });
  }

  const topicKey = topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');

  try {
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ error: "User not found" });

    const entry = user.entries.get(topicKey);
    if (!entry) return res.status(404).json({ error: "Topic entry not found" });

    return res.status(200).json({ entry });
  } catch (err) {
    console.error("❌ POST /api/userentry error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

app.patch('/api/savePrep', async (req, res) => {
  const { email, topic, stance, debateType, userrole, userPrep, teammates } = req.body;
  const topicKey = topic.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, '_');

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.entries.has(topicKey)) {
      user.entries.set(topicKey, {
        topic,
        type: debateType,
        stance,
        userrole,
        proposition: {},
        opposition: {}
      });
    }

    const entry = user.entries.get(topicKey);
    const teamKey = stance === 'proposition' ? 'proposition' : 'opposition';

    if (!entry[teamKey][userrole]) {
      entry[teamKey][userrole] = { prep: "", transcript: [], summary: [] };
    }
    entry[teamKey][userrole].prep = userPrep;

    teammates.forEach(({ role, prep }) => {
      if (!entry[teamKey][role]) {
        entry[teamKey][role] = { prep: "", transcript: [], summary: [] };
      }
      entry[teamKey][role].prep = prep;
    });

    user.entries.set(topicKey, entry);
    await user.save();

    res.status(200).json({ message: "Prep saved." });
  } catch (err) {
    console.error("❌ /api/savePrep error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Dummy teammate responses for role-based simulation
const teammateResponses = {
  teammate1: [
    "Let's begin with a solid foundation for our arguments.",
    "I'll ensure to handle logical fallacies and contradictions from the opposition.",
    "Don't forget to define key terms clearly in your opening."
  ],
  teammate2: [
    "I'll summarize our stance by tying back to the motion.",
    "I'll emphasize the long-term impacts of our argument.",
    "I'll highlight contradictions in the opposition's case during summary."
  ]
};

// Main endpoint for AI teammate simulation


// Route: Fetch user and debate entry
app.get('/api/getUserDebateData', async (req, res) => {
  const { email } = req.query;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_API_URL = 'https://api.sarvam.ai/v1/chat/completions';
app.post('/api/teama', async (req, res) => {
  const { userInput, topic = 'General debate', role, stance = 'Neutral' } = req.body;

  if (!userInput || !role) {
    return res.status(400).json({ error: 'Missing userInput or role in /api/teammate' });
  }

  const prompt = `You are a AI debate teammate.
Debate Topic: ${topic}
Side: ${stance}
Role: ${role}
Teammate said: "${userInput}"
Suggest  ideas, present your point of view, answer in first person in short 40words, in informal`;

  try {
    const fetchResponse = await fetch(process.env.SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }),
    });

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text();
      throw new Error(`Sarvam API error: ${fetchResponse.status} ${fetchResponse.statusText} — ${errText}`);
    }

    const data = await fetchResponse.json();
    const result = data.choices?.[0]?.message?.content || 'No response from Sarvam AI';
    res.json({ result });
  } catch (err) {
    console.error('Sarvam API Error (/api/teammate):', err.message || err);
    res.status(500).json({ error: `Failed to get response from Sarvam AI: ${err.message}` });
  }
});




//caseprep


// /api/teamma — Strategic teammate suggestions

app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!process.env.SARVAM_API_URL) {
  console.error('❌ SARVAM_API_URL is not set in .env');
}

  if (!query) {
    return res.status(400).json({ error: 'Missing query in /api/search' });
  }

  const prompt = `You are a research assistant for a debate preparation tool. Provide concise, relevant evidence, statistics, or case studies for the following query: "${query}"`;

  try {
    const fetchResponse = await fetch(process.env.SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'api-subscription-key': process.env.SARVAM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!fetchResponse.ok) {
      const errorText = await fetchResponse.text();
      throw new Error(`Sarvam API error: ${fetchResponse.status} ${fetchResponse.statusText} — ${errorText}`);
    }

    const data = await fetchResponse.json();
    const result = data.choices?.[0]?.message?.content || 'No results found.';
    res.json({ result });
  } catch (err) {
    console.error('Sarvam API Error (/api/search):', err.message || err);
    res.status(500).json({
      error: `Failed to get search results from Sarvam AI: ${err.message}`,
    });
  }
});

app.post('/api/teamma', async (req, res) => {
  const { userInput, topic = 'General debate', role, stance = 'Neutral' } = req.body;

  if (!userInput || !role) {
    return res.status(400).json({ error: 'Missing userInput or role in /api/teammate' });
  }

  const prompt = `You are a  AI debate teammate.
Debate Topic: ${topic}
Side: ${stance}
Role: ${role}
Teammate said: "${userInput}"
Suggest strategic ideas, questions to consider, or relevant points. start by hara krishna`;

  try {
    const response = await client.chat.completions({
      messages: [{ role: 'user', content: prompt }]
    });

    const result = response.choices?.[0]?.message?.content || 'No response from Sarvam AI';
    res.json({ result });
  } catch (err) {
    console.error('Sarvam API Error (/api/teammate):', err.message || err);
    res.status(500).json({ error: `Failed to get response from Sarvam AI` });
  }
});




// /api/summarize — Concise summarizer
app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in /api/summarize' });
  }

  const prompt = `Summarize this text in 1-2 short sentences, max 50 characters: "${text}"`;

  try {
    const response = await client.chat.completions({
      messages: [
        { role: 'system', content: 'You are an AI that summarizes text concisely.' },
        { role: 'user', content: prompt }
      ]
    });

    const summary = response.choices?.[0]?.message?.content || 'No summary generated.';
    res.json({ summary });
  } catch (err) {
    console.error('Sarvam API Error (/api/summarize):', err.message || err);
    res.status(500).json({ error: `Failed to summarize text` });
  }
});

app.post('/api/factcheck', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing text in /api/factcheck' });
  }

  const prompt = `You are a fact-checking AI. Verify the accuracy of the following text and provide a concise assessment of its factual correctness, including any corrections or clarifications if needed: "${text}"`;

  try {
    const response = await client.chat.completions({
      messages: [
        { role: 'system', content: 'You are an AI that verifies facts accurately.' },
        { role: 'user', content: prompt }
      ]
    });

    const result = response.choices?.[0]?.message?.content || 'No fact-check results available.';
    res.json({ result });
  } catch (err) {
    console.error('Sarvam API Error (/api/factcheck):', err.message || err);
    res.status(500).json({ error: `Failed to fact-check text` });
  }
});


app.post('/api/caseprepfetchdata', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      console.error('❌ Request missing email');
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email }).lean();

    if (!user) {
      console.error(`❌ User not found for email: ${email}`);
      return res.status(404).json({ error: 'User not found' });
    }

    const entries = user.entries instanceof Map
      ? Object.fromEntries(user.entries)
      : user.entries || {};

    const latestKey = Object.keys(entries).pop();

    if (!latestKey || !entries[latestKey]) {
      console.error(`❌ No entries found for user: ${email}`);
      return res.status(404).json({ error: 'No debate entries found for this user' });
    }

    const latestEntry = entries[latestKey];
    const topicSlug = latestKey ||  'Untitled Debate Topic';
    const topic = latestEntry.topic || latestKey.replace(/_/g, ' ') || 'Untitled Debate Topic';
    const userRole = latestEntry.userrole || 'PM';
    const stance = latestEntry.stance || "dont know"
    const proposition = latestEntry.proposition || [];
    const opposition = latestEntry.opposition || [];

    // // ✅ Debug logging
    // console.log(`\n📄 Case Prep Data for ${email}`);
    // console.log('🧠 Topic:', topic);
    // console.log('🧑‍⚖️ Role:', userRole);
    console.log('🟢 Proposition Summaries:', proposition);
    console.log('🔴 Opposition Summaries:', opposition);
//

    return res.json({
      topic,
      userRole,
      stance,
      proposition,
      opposition,
      topicSlug
    });

  } catch (err) {
    console.error(`❌ Internal error while fetching case prep data for ${req.body?.email}:`, err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


// /api/caseprepsummariser endpoint (no authMiddleware)
app.post('/api/caseprepsummariser', async (req, res) => {
  const { transcript, role, topic = 'General debate' } = req.body;

  if (!transcript || !role) {
    return res.status(400).json({ error: 'Missing transcript or role in /api/caseprepsummariser' });
  }

  const prompt = `You are an AI debate assistant summarizing a team member's transcript.
Debate Topic: ${topic}
Role: ${role}
Transcript: "${transcript}"
Summarize the transcript into exactly three key points to highlight in the main debate, each point being a concise sentence. Return the points as a JSON array, e.g., ["Point 1", "Point 2", "Point 3"].`;

  try {
    const fetchResponse = await fetch(process.env.SARVAM_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SARVAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sarvam-m',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7
      }),
    });

    if (!fetchResponse.ok) {
      const errText = await fetchResponse.text();
      throw new Error(`Sarvam API error: ${fetchResponse.status} ${fetchResponse.statusText} — ${errText}`);
    }

    const data = await fetchResponse.json();
    let highlights = data.choices?.[0]?.message?.content || '[]';

    try {
      highlights = JSON.parse(highlights);
      if (!Array.isArray(highlights) || highlights.length !== 3 || !highlights.every(h => typeof h === 'string')) {
        throw new Error('Highlights must be an array of exactly three strings');
      }
    } catch (err) {
      console.warn('Invalid JSON format, attempting to parse as text:', highlights);
      // Fallback: Split text into sentences and take first three
      const sentences = highlights.match(/[^.!?]+[.!?]+/g) || [highlights];
      highlights = sentences.slice(0, 3).map(s => s.trim());
      if (highlights.length < 3) {
        // Pad with placeholders if fewer than three sentences
        while (highlights.length < 3) {
          highlights.push('Summary point not available');
        }
      }
    }

    res.json({ highlights });
  } catch (err) {
    console.error('Sarvam API Error (/api/caseprepsummariser):', err.message || err);
    res.status(500).json({ error: `Failed to summarize transcript: ${err.message}` });
  }
});



// /api/saveSummary endpoint
// /api/saveSummary endpoint

// /api/saveSummary endpoint
// /api/saveSummary endpoint
app.post('/api/saveSummary', async (req, res) => {
  const { email, topic, topicSlug, team, role, highlights } = req.body;

  console.log('📝 /api/saveSummary: Received request:', { email, topic, topicSlug, team, role, highlights });

  // Validate input
  if (!email || !topic || !topicSlug || !team || !role || !highlights) {
    console.error('❌ /api/saveSummary: Missing required fields:', { email, topic, topicSlug, team, role, highlights });
    return res.status(400).json({ message: 'Missing email, topic, topicSlug, team, role, or highlights' });
  }

  // Validate team and role
  const validTeams = ['proposition', 'opposition'];
  const validRoles = team === 'proposition' ? ['pm', 'dpm', 'gw'] : ['lo', 'dlo', 'ow'];
  if (!validTeams.includes(team)) {
    console.error('❌ /api/saveSummary: Invalid team:', team, 'Valid teams:', validTeams);
    return res.status(400).json({ message: `Invalid team: ${team}` });
  }
  if (!validRoles.includes(role)) {
    console.error('❌ /api/saveSummary: Invalid role:', role, 'Valid roles for', team, ':', validRoles);
    return res.status(400).json({ message: `Invalid role: ${role}` });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error('❌ /api/saveSummary: User not found for email:', email);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('📝 /api/saveSummary: User found:', { email, entries: Array.from(user.entries.keys()) });

    let entry = user.entries?.get(topicSlug);
    if (!entry) {
      console.error('❌ /api/saveSummary: Topic not found:', topicSlug);
      return res.status(404).json({ message: 'Topic not found' });
    }

    console.log('📝 /api/saveSummary: Entry found for topicSlug:', topicSlug, { team, role });

    // Ensure team block exists
    if (!entry[team]) {
      console.error('❌ /api/saveSummary: Invalid team:', team, 'Available teams:', Object.keys(entry));
      return res.status(400).json({ message: `Invalid team: ${team}` });
    }

    console.log('📝 /api/saveSummary: Team block found:', team, { 'teamBlock keys': Object.keys(entry[team]) });

    // Ensure role block exists
    if (!entry[team][role]) {
      console.error('❌ /api/saveSummary: Invalid role:', role, 'Available roles:', Object.keys(entry[team]));
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    console.log('📝 /api/saveSummary: Role block found:', role);

    // Prepare new prep content
    const newPrep = Array.isArray(highlights) ? highlights.join(' ') : String(highlights || '');

    // Log current prep state
    console.log('📝 /api/saveSummary: Current prep for', role, ':', entry[team][role].prep);

    // Update prep
    entry[team][role].prep = newPrep;
    console.log('📝 /api/saveSummary: Updated prep for', role, ':', entry[team][role].prep);

    // Update timestamp and set entry
    entry.updatedAt = new Date();
    user.entries.set(topicSlug, entry);

    // Mark entries as modified to ensure MongoDB saves nested changes
    user.markModified('entries');

    // Save and verify the update
    await user.save();

    // Fetch the updated document to confirm the save
    const updatedUser = await User.findOne({ email });
    const updatedEntry = updatedUser.entries.get(topicSlug);
    const savedPrep = updatedEntry[team][role].prep;
    console.log('📝 /api/saveSummary: Verified saved prep for', role, ':', savedPrep);

    if (savedPrep !== newPrep) {
      console.error('❌ /api/saveSummary: Prep not saved correctly for', role, 'Expected:', newPrep, 'Got:', savedPrep);
      return res.status(500).json({ message: `Failed to save prep for ${role}: Database verification failed` });
    }

    console.log('✅ /api/saveSummary: Summary saved and verified for', team, role);

    res.json({ message: 'Summary saved successfully' });
  } catch (err) {
    console.error('❌ /api/saveSummary: Error saving summary for', role, ':', err.message, err.stack);
    res.status(500).json({ message: `Failed to save summary for ${role}: ${err.message}` });
  }
});

// /api/saveNotes endpoint
app.post('/api/saveNotes', async (req, res) => {
  const { email, topic, topicSlug, team, role, notes } = req.body;

  if (!email || !topic || !topicSlug || !team || !role || notes === undefined) {
    return res.status(400).json({ message: 'Missing email, topic, topicSlug, team, role, or notes' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const entry = user.entries?.get(topicSlug);
    if (!entry) return res.status(404).json({ message: 'Topic not found' });

    const teamBlock = entry[team];
    if (!teamBlock) return res.status(400).json({ message: 'Invalid team' });

    const roleBlock = teamBlock[role];
    if (!roleBlock) return res.status(400).json({ message: 'Invalid role' });

    roleBlock.notes = notes;
    entry.updatedAt = new Date();
    user.entries.set(topicSlug, entry);
    await user.save();

    res.json({ message: 'Notes saved successfully' });
  } catch (err) {
    console.error('Error saving notes:', err);
    res.status(500).json({ message: 'Failed to save notes' });
  }
});

app.get('/api/fetchNotes', async (req, res) => {
  try {
    const { email, topic, topicSlug, team, role } = req.query;

    // Validate only the role parameter
    if (!['pm', 'dpm', 'gw', 'lo', 'dlo', 'ow'].includes(role)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid role value' });
    }

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    // Find debate entry
    const entry = user.entries?.get(topicSlug);
    if (!entry) {
      return res.status(404).json({ status: 'fail', message: 'Topic not found' });
    }

    // Find team block
    const teamBlock = entry[team];
    if (!teamBlock) {
      return res.status(400).json({ status: 'fail', message: 'Invalid team' });
    }

    // Find role block
    const roleBlock = teamBlock[role];
    if (!roleBlock) {
      return res.status(400).json({ status: 'fail', message: 'Role not found in team' });
    }

    // Return notes (default to empty string if notes field is undefined)
    const notes = roleBlock.notes || '';
    res.status(200).json({ status: 'success', notes });
  } catch (err) {
    console.error('Error fetching notes:', err);
    res.status(500).json({ status: 'fail', message: 'Failed to fetch notes' });
  }
});

// 🚀 Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
