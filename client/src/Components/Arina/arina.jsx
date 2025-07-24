import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, PhoneOff } from 'lucide-react';
import './Arina.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
const url = 'https://debattlex.onrender.com'
const toBoldItalic = (word) => {
  const map = {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠',
    h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮',
    v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐲', z: '𝐳',
    A: '𝐀', B: '𝐁', C: '𝐂', D: '𝐃', E: '𝐄', F: '𝐅', G: '𝐆',
    H: '𝐇', I: '𝐈', J: '𝐉', K: '𝐊', L: '𝐋', M: '𝐌', N: '𝐍',
    O: '𝐎', P: '𝐏', Q: '𝐐', R: '𝐑', S: '𝐒', T: '𝐓', U: '𝐔',
    V: '𝐕', W: '𝐖', X: '𝐗', Y: '𝐘', Z: '𝐙'
  };
  return word.split('').map(c => map[c] || c).join('');
};

const highlightImportant = (text) => {
  return text.split(" ").map(word => {
    const strippedWord = word.replace(/[\*#]/g, '');
    const clean = strippedWord.replace(/[^a-zA-Z]/g, '');
    return clean.toLowerCase() === "important" ? toBoldItalic(strippedWord) : strippedWord;
  }).join(" ");
};

const Arina = () => {
  const [email, setEmail] = useState('');
  const [isMuted, setIsMuted] = useState(true);
  const [showTranscript, setShowTranscript] = useState(true);
  const [showCaptions, setShowCaptions] = useState(true);
  const [debateTopic, setDebateTopic] = useState('');
  const [userStance, setUserStance] = useState('');
  const [debateType, setDebateType] = useState('');
  const [userTranscripts, setUserTranscripts] = useState([]);
  const [aiTranscripts, setAITranscripts] = useState([]);
  const [userSummaryPoints, setUserSummaryPoints] = useState([]);
  const [aiSummaryPoints, setAISummaryPoints] = useState([]);
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [userRole, setUserRole] = useState('');


  const synthRef = useRef(window.speechSynthesis);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {

    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) {
      alert("User email not found. Please log in again.");
      navigate('/login');
      return;
    }
    setEmail(storedEmail);
  }, []);
useEffect(() => {
  if (!email) return;
  console.log("📩 Fetching entries for:", email);
  axios.post(url+'/api/fetchEntries', { email })
    .then(res => {
      const entries = res.data.entries;
      const keys = Object.keys(entries);
      if (keys.length > 0) {
        const latestKey = keys[keys.length - 1];
        const latestEntry = entries[latestKey];
        console.log("📌 Latest Entry:", latestEntry);
        setDebateTopic(latestEntry.topic);
        setUserStance(latestEntry.stance);
        setDebateType(latestEntry.type);
        setUserRole(latestEntry.userrole);  // ✅ add this line
      } else {
        console.warn("⚠️ No entries found for user.");
      }
    })
    .catch(err => console.error("❌ Failed to fetch entry:", err));
}, [email]);


  const toggleMute = () => {
    if (synthRef.current.speaking) synthRef.current.cancel();
    setIsMuted(!isMuted);
  };

  const toggleTranscript = () => setShowTranscript(!showTranscript);
  const toggleCaptions = () => setShowCaptions(!showCaptions);

  const handleHangUp = () => {
    if (window.confirm("Are you sure you want to hang up?")) {
      navigate('/Aijudge');
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = async (event) => {
      const text = Array.from(event.results).map(r => r[0].transcript).join('');
      const userEntry = { speaker: "You", text };
      const updatedUser = [userEntry, ...userTranscripts];
      setUserTranscripts(updatedUser);

      try {
        setIsMuted(true);
        const ai_stance = userStance === "proposition" ? "opposition" : "proposition";

        const aiRes = await axios.post(url+'/ask', {
          question: text,
          topic: debateTopic,
          stance: ai_stance,
          type: debateType,
          transcripts: updatedUser
        });

        const aiText = aiRes.data.answer.replace(/[\*#]/g, '');
        const aiEntry = { speaker: "AI", text: aiText };
        const updatedAI = [aiEntry, ...aiTranscripts];
        setAITranscripts(updatedAI);
        updateSummaries(updatedUser, updatedAI);
console.log("🧠 AI Text to save:", aiText);
console.log("📤 PATCH Payload: userdata", {
  email,
  topic: debateTopic,
  debateType: debateType,
  stance: userStance,
  userrole: userRole,
  userTranscript: [text],
  userSummary: userSummaryPoints,
  aiTranscript: [aiText],
  aiSummary: aiSummaryPoints
});

       await axios.patch(url+'/api/userdata', {
  email,
  entry: {
    topic: debateTopic,
    debateType: debateType,
    stance: userStance,
    userrole: userRole,
    userTranscript: [text],
    aiTranscript: [aiText],
    userSummary: userSummaryPoints,
    aiSummary: aiSummaryPoints
  }
});




        const lines = aiText.split(/[.?!]\s+/).filter(line => line.trim() !== '');
        setCaptionLines(lines);
        setCaptionLineIndex(0);
        setHighlightedWordIndex(0);
        speakCaptionLines(lines, 0);
      } catch (err) {
        console.error("AI response error:", err);
      }
    };

    if (!isMuted) recognition.start();
    else recognition.stop();

    return () => recognition.stop();
  }, [isMuted, email, debateTopic, userStance, debateType, userTranscripts, aiTranscripts]);

  const speakCaptionLines = (lines, index) => {
    if (index >= lines.length) {
      setIsMuted(false);
      return;
    }

    const line = lines[index].replace(/[\*#]/g, '');
    const utterance = new SpeechSynthesisUtterance(line);
    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);

    utterance.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightedWordIndex(prev => prev + 1);
      }
    };

    utterance.onend = () => speakCaptionLines(lines, index + 1);
    synthRef.current.speak(utterance);
  };

  const updateSummaries = async (userData, aiData, text, aiText) => {
  try {
    const res = await axios.post(url+'/api/summarize-transcripts', {
      userTranscripts: userData,
      aiTranscripts: aiData
    });

    const userSummaryArr = res.data.userSummary
      .split('\n')
      .map(p => p.trim())
      .filter(p => p);

    const aiSummaryArr = res.data.aiSummary
      .split('\n')
      .map(p => p.trim())
      .filter(p => p);

    setUserSummaryPoints(userSummaryArr);
    setAISummaryPoints(aiSummaryArr);

    // Save both user and AI transcript + summary
const aiStance = userStance === "proposition" ? "opposition" : "proposition";
const aiRoleMap = {
  "beginner": "lo",
  "intermediate": "lo",
  "extraordinary": "lo"
};
const aiRole = aiRoleMap[debateType] || "lo";
// console.log("🧠 AI Text to save:", aiText);
// console.log("📤 PATCH Payload:", {
//   email,
//   topic: debateTopic,
//   debateType: debateType,
//   stance: userStance,
//   userrole: userRole,
//   userTranscript: [text],
//   userSummary: userSummaryPoints,
//   aiStance,
//   aiRole,
//   aiTranscript: [aiText],
//   aiSummary: aiSummaryPoints
// });

// await axios.patch('/api/userdata', {
//   email,
//   entry: {
//     topic: debateTopic,
//     debateType: debateType,
//     stance: userStance,       // user's side
//     userrole: userRole,       // user's role
//     userTranscript: [text],
//     userSummary: userSummaryArr,

//     aiStance,                 // ✅ new
//     aiRole,                   // ✅ new
//     aiTranscript: [aiText],
//     aiSummary: aiSummaryArr
//   }
// });


  } catch (err) {
    console.error("Summary error:", err);
  }
};


  return (
    <div className="arina-container">
      <h3 className="debate-topic-heading">
        Topic: <span className="debate-topic-title">{debateTopic}</span>
      </h3>

      <div className="arina-center">
        <div className="avatar-container">
          <div className="ai-avatar">
            <svg className="tick-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
        </div>
        <h1 className="ai-heading">Live AI Debate</h1>
        <div className="line-divider"></div>
      </div>

      <div className={`transcript-panel left-panel ${showTranscript ? 'open' : ''}`}>
        <div className="panel-header">
          <span className="panel-title">Your Points</span>
          <button onClick={toggleTranscript} className="close-btn">×</button>
        </div>
        <div className="panel-body">
          <ul>
            {userSummaryPoints.map((point, idx) => (
              <li key={idx}>{highlightImportant(point.replace(/^[-•]\s*/, ''))}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className={`transcript-panel right-panel ${showTranscript ? 'open' : ''}`}>
        <div className="panel-header">
          <span className="panel-title">AI's Responses</span>
          <button onClick={toggleTranscript} className="close-btn">×</button>
        </div>
        <div className="panel-body">
          <ul>
            {aiSummaryPoints.map((point, idx) => (
              <li key={idx}>{highlightImportant(point.replace(/^[-•]\s*/, ''))}</li>
            ))}
          </ul>
        </div>
      </div>

      {showCaptions && captionLines.length > 0 && (
        <div className="caption-line global-caption">
          {captionLines[captionLineIndex].split(" ").map((word, idx) => {
            let displayWord = word.replace(/[\*#]/g, '');
            const clean = displayWord.replace(/[^a-zA-Z]/g, '');
            if (clean.toLowerCase() === "important") {
              displayWord = toBoldItalic(displayWord);
            }
            return (
              <span
                key={idx}
                style={{
                  color: idx === highlightedWordIndex ? 'yellow' : 'white',
                  fontWeight: idx === highlightedWordIndex ? 'bold' : 'normal',
                  marginRight: '4px',
                }}
              >
                {displayWord}
              </span>
            );
          })}
        </div>
      )}

      <div className="control-bar-wrapper">
        <div className="control-bar">
          <button onClick={toggleMute} className={`circle-button ${!isMuted ? 'speaking' : 'ready'}`}>
            {isMuted ? <MicOff size={20} color="#fff" /> : <Mic size={20} color="#fff" />}
          </button>
          <button onClick={toggleTranscript} className={`circle-button ${showTranscript ? 'active' : ''}`}>
            <FileText size={20} color="#fff" />
          </button>
          <button onClick={toggleCaptions} className="circle-button">CC</button>
          <button onClick={handleHangUp} className="circle-button hangup-button">
            <PhoneOff size={20} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Arina;
