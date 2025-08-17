import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, PhoneOff } from 'lucide-react';
import './Arina.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { SarvamAIClient } from 'sarvamai';

const url = 'https://debattlex.onrender.com';
const SARVAM_API_KEY = 'sk_qti82pt3_7Ho0xwKr7RPgF7UCm4z7xVMf'; // Your Sarvam API key

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
  return text.split(' ').map(word => {
    const strippedWord = word.replace(/[\*#]/g, '');
    const clean = strippedWord.replace(/[^a-zA-Z]/g, '');
    return clean.toLowerCase() === 'important' ? toBoldItalic(strippedWord) : strippedWord;
  }).join(' ');
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentUserTranscript, setCurrentUserTranscript] = useState('');
  const [userCaption, setUserCaption] = useState('');

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const currentSourceRef = useRef(null);
  const videoRef = useRef(null);
  const navigate = useNavigate();
  const sarvamClient = useRef(new SarvamAIClient({ apiSubscriptionKey: SARVAM_API_KEY }));

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    if (!storedEmail) {
      alert('User email not found. Please log in again.');
      navigate('/login');
      return;
    }
    setEmail(storedEmail);
  }, [navigate]);

  useEffect(() => {
    if (!email) return;
    console.log('📩 Fetching entries for:', email);
    axios
      .post(url + '/api/fetchEntries', { email })
      .then(res => {
        const entries = res.data.entries;
        const keys = Object.keys(entries);
        if (keys.length > 0) {
          const latestKey = keys[keys.length - 1];
          const latestEntry = entries[latestKey];
          console.log('📌 Latest Entry:', latestEntry);
          setDebateTopic(latestEntry.topic);
          setUserStance(latestEntry.stance);
          setDebateType(latestEntry.type);
          setUserRole(latestEntry.userrole);
        } else {
          console.warn('⚠️ No entries found for user.');
        }
      })
      .catch(err => console.error('❌ Failed to fetch entry:', err));
  }, [email]);

  const toggleMute = async () => {
    // Initialize or resume AudioContext on user gesture
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    if (isSpeaking) {
      if (currentSourceRef.current) {
        currentSourceRef.current.onended = null; // Prevent chaining to next line
        currentSourceRef.current.stop();
        currentSourceRef.current = null;
      }
      setIsSpeaking(false);
    }

    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (newMuted) {
      // User is done speaking, send transcript to AI
      const text = currentUserTranscript.trim();
      setCurrentUserTranscript('');
      setUserCaption('');
      if (text === '') return;

      const userEntry = { speaker: 'You', text };
      const updatedUser = [userEntry, ...userTranscripts];
      setUserTranscripts(updatedUser);

      try {
        const ai_stance = userStance === 'proposition' ? 'opposition' : 'proposition';

        // Limit the transcripts sent to prevent prompt too long error
        const limitedTranscripts = updatedUser.slice(0, 5); // Send only the last 5 user transcripts

        const aiRes = await axios.post(url + '/ask', {
          question: text,
          topic: debateTopic,
          stance: ai_stance,
          type: debateType,
          transcripts: limitedTranscripts,
        });

        const aiText = aiRes.data.answer.replace(/[\*#]/g, '');
        const aiEntry = { speaker: 'AI', text: aiText };
        const updatedAI = [aiEntry, ...aiTranscripts];
        setAITranscripts(updatedAI);
        updateSummaries(updatedUser, updatedAI);

        await axios.patch(url + '/api/userdata', {
          email,
          entry: {
            topic: debateTopic,
            debateType: debateType,
            stance: userStance,
            userrole: userRole,
            userTranscript: [text],
            aiTranscript: [aiText],
            userSummary: userSummaryPoints,
            aiSummary: aiSummaryPoints,
          },
        });

        const lines = aiText.split(/[.?!]\s+/).filter(line => line.trim() !== '');
        setCaptionLines(lines);
        setCaptionLineIndex(0);
        setHighlightedWordIndex(0);
        speakCaptionLines(lines, 0);
      } catch (err) {
        console.error('AI response error:', err);
      }
    } else {
      // User is starting to speak
      setCurrentUserTranscript('');
      setUserCaption('');
    }
  };

  const toggleTranscript = () => setShowTranscript(!showTranscript);
  const toggleCaptions = () => setShowCaptions(!showCaptions);

  const handleHangUp = () => {
    if (window.confirm('Are you sure you want to hang up?')) {
      navigate('/Aijudge');
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    recognition.onresult = event => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript + ' ';
        }
      }
      if (finalTranscript) {
        setCurrentUserTranscript(prev => prev + finalTranscript);
      }
      setUserCaption((currentUserTranscript + finalTranscript + interimTranscript).trim());
    };

    if (!isMuted) recognition.start();
    else recognition.stop();

    return () => recognition.stop();
  }, [isMuted, currentUserTranscript]);

  useEffect(() => {
    if (!videoRef.current) return;
    if (isSpeaking) {
      videoRef.current.play().catch(() => { /* Ignore interruption errors */ });
    } else {
      videoRef.current.pause();
    }
  }, [isSpeaking]);

  const speakCaptionLines = async (lines, index) => {
    if (index >= lines.length) {
      setIsMuted(false);
      setIsSpeaking(false);
      return;
    }

    const line = lines[index].replace(/[\*#]/g, '');
    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);

    try {
      setIsSpeaking(true);
      const response = await sarvamClient.current.textToSpeech.convert({
        text: line,
        target_language_code: 'en-IN',
        speaker: 'manisha',
        pitch: 0.3,
        pace: 0.85,
        loudness: 1.2,
        speech_sample_rate: 24000,
        enable_preprocessing: true,
        model: 'bulbul:v2',
      });

      const base64Audio = response.audios?.[0];
      if (!base64Audio) {
        console.error('No audio data in response');
        setIsSpeaking(false);
        speakCaptionLines(lines, index + 1);
        return;
      }

      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const arrayBuffer = byteArray.buffer;

      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      currentSourceRef.current = source;

      const words = line.split(' ');
      const durationPerWord = (audioBuffer.duration || 1) * 1000 / words.length;
      let wordIndex = 0;
      const interval = setInterval(() => {
        setHighlightedWordIndex(wordIndex);
        wordIndex++;
        if (wordIndex >= words.length) clearInterval(interval);
      }, durationPerWord);

      source.onended = () => {
        clearInterval(interval);
        currentSourceRef.current = null;
        speakCaptionLines(lines, index + 1);
      };

      source.start();
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
      speakCaptionLines(lines, index + 1);
    }
  };

  const updateSummaries = async (userData, aiData) => {
    try {
      // Also limit for summaries to prevent potential similar errors
      const limitedUserData = userData.slice(0, 5);
      const limitedAiData = aiData.slice(0, 5);

      const res = await axios.post(url + '/api/summarize-transcripts', {
        userTranscripts: limitedUserData,
        aiTranscripts: limitedAiData,
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

      const aiStance = userStance === 'proposition' ? 'opposition' : 'proposition';
      const aiRoleMap = {
        beginner: 'lo',
        intermediate: 'lo',
        extraordinary: 'lo',
      };
      const aiRole = aiRoleMap[debateType] || 'lo';

      await axios.patch(url + '/api/userdata', {
        email,
        entry: {
          topic: debateTopic,
          debateType: debateType,
          stance: userStance,
          userrole: userRole,
          userTranscript: userData.map(t => t.text),
          userSummary: userSummaryArr,
          aiStance,
          aiRole,
          aiTranscript: aiData.map(t => t.text),
          aiSummary: aiSummaryArr,
        },
      });
    } catch (err) {
      console.error('Summary error:', err);
    }
  };

  return (
    <div className="arina-container">
      <h3 className="debate-topic-heading">
        Topic: <span className="debate-topic-title">{debateTopic}</span>
      </h3>

      <div className="arina-center">
        <div className="avatar-container">
          <video
            ref={videoRef}
            className="speaking-video"
            src="/girl1.mp4"
            loop
            muted
            playsInline
          />
        </div>
        
        <div className="line-divider"></div>
        <br></br>
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
          <br></br>
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

      {showCaptions && (
        <div className="caption-line global-caption">
          {!isMuted && userCaption && `You: ${userCaption}`}
          {isSpeaking && captionLines.length > 0 && (
            <>
              AI:{' '}
              {captionLines[captionLineIndex].split(' ').map((word, idx) => {
                let displayWord = word.replace(/[\*#]/g, '');
                const clean = displayWord.replace(/[^a-zA-Z]/g, '');
                if (clean.toLowerCase() === 'important') {
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
            </>
          )}
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
