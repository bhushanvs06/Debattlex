
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, PhoneOff, Notebook } from 'lucide-react';
import './DebateUI.css';
import { useNavigate } from 'react-router-dom';
const url =  'https://debattlex.onrender.com'


const toBoldItalic = (word) => {
  const map = {
    a: '𝐚', b: '𝐛', c: '𝐜', d: '𝐝', e: '𝐞', f: '𝐟', g: '𝐠',
    h: '𝐡', i: '𝐢', j: '𝐣', k: '𝐤', l: '𝐥', m: '𝐦', n: '𝐧',
    o: '𝐨', p: '𝐩', q: '𝐪', r: '𝐫', s: '𝐬', t: '𝐭', u: '𝐮',
    v: '𝐯', w: '𝐰', x: '𝐱', y: '𝐯', z: '𝐳', 
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

const DebateUI = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [captionLines, setCaptionLines] = useState([]);
  const [captionLineIndex, setCaptionLineIndex] = useState(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState(0);
  const [showCaptions, setShowCaptions] = useState(true);
  const [propSummary, setPropSummary] = useState([]);
  const [oppSummary, setOppSummary] = useState([]);
  const [transcripts, setTranscripts] = useState({});
  const [userTranscript, setUserTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [triggerNextAISpeech, setTriggerNextAISpeech] = useState(false);
  const [userData, setUserData] = useState(null);
  const [allSpeakers, setAllSpeakers] = useState([]);
  const [userRole, setUserRole] = useState('');
  const [introCountdown, setIntroCountdown] = useState(10);
  const [debateStarted, setDebateStarted] = useState(false);
  const [ema, Setema] = useState('');
  const [isNoteTakerOpen, setIsNoteTakerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const navigate = useNavigate();

  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const [allPrep, setAllPrep] = useState({
    PM: "",
    DPM: "",
    GW: "",
    LO: "",
    DLO: "",
    OW: ""
  });

  const saveToMongo = async ({ transcript, summary, speaker }) => {
    try {
      const team = speaker.team.toLowerCase() === 'prop' ? 'proposition' : 'opposition';

      const allKeys = Object.keys(userData.entries);
      const latestKey = allKeys
        .filter(k => userData.entries[k].debateType === '3v3')
        .sort((a, b) => new Date(userData.entries[b].createdAt) - new Date(userData.entries[a].createdAt))[0];

      if (!latestKey) {
        console.warn("No 3v3 debate entry found.");
        return;
      }

      console.log("Saving to:", {
        email: userData.email,
        topicSlug: latestKey,
        team,
        role: speaker.role.toLowerCase(),
        transcript,
        summary
      });

      const res = await fetch(url + "/api/saveRoleTranscript", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userData.email,
          topicSlug: latestKey,
          team,
          role: speaker.role.toLowerCase(),
          transcript,
          summary
        })
      });

      const result = await res.json();
      if (!res.ok) {
        console.error("Failed to save:", result.message);
      } else {
        console.log("Saved successfully:", result.message);
      }
    } catch (error) {
      console.error("Error in saveToMongo:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const storedEmail = localStorage.getItem("userEmail");
      if (!storedEmail) {
        alert("User email not found. Please log in again.");
        navigate('/login');
        return;
      }

      try {
        const res = await fetch(url + `/api/getUserDebateData?email=${storedEmail}`);
        const user = await res.json();
        setUserData(user);

        const entries = user.entries || {};
        const latest3v3Key = Object.keys(entries)
          .filter(key => entries[key].debateType === "3v3")
          .sort((a, b) => new Date(entries[b].createdAt) - new Date(entries[a].createdAt))[0];

        const entry = entries[latest3v3Key];
        const topic = entry.topic;
        const stance = entry.stance;
        const userrole = entry.userrole?.toUpperCase();
        setUserRole(userrole);

        const proposition = entry.proposition;
        const opposition = entry.opposition;

        const allPreps = {
          PM: proposition?.pm?.prep || "",
          DPM: proposition?.dpm?.prep || "",
          GW: proposition?.gw?.prep || "",
          LO: opposition?.lo?.prep || "",
          DLO: opposition?.dlo?.prep || "",
          OW: opposition?.ow?.prep || ""
        };
        setAllPrep(allPreps);

        const propMembers = Object.keys(proposition).map(role => ({
          name: role.toUpperCase() === userrole ? user.displayName.toUpperCase() : `${role.toUpperCase()} (AI)`,
          role: role.toUpperCase(),
          team: 'prop',
          prep: proposition[role]?.prep || "",
          avatar: `https://randomuser.me/api/portraits/men/${Math.floor(Math.random() * 90)}.jpg`
        }));

        const oppMembers = Object.keys(opposition).map(role => ({
          name: role.toUpperCase() === userrole ? user.displayName.toUpperCase() : `${role.toUpperCase()} (AI)`,
          role: role.toUpperCase(),
          team: 'opp',
          prep: opposition[role]?.prep || "",
          avatar: `https://randomuser.me/api/portraits/women/${Math.floor(Math.random() * 90)}.jpg`
        }));

        const roleOrder = ["PM", "LO", "DPM", "DLO", "GW", "OW"];
        const speakers = roleOrder.map(role =>
          (stance === 'proposition')
            ? propMembers.find(m => m.role === role) || oppMembers.find(m => m.role === role)
            : oppMembers.find(m => m.role === role) || propMembers.find(m => m.role === role)
        ).filter(Boolean);

        setAllSpeakers(speakers);

        // Fetch notes from backend using GET
        try {
          const notesRes = await fetch(
            `${url}/api/fetchNotes?email=${encodeURIComponent(storedEmail)}&topic=${encodeURIComponent(topic)}&topicSlug=${encodeURIComponent(latest3v3Key)}&team=${encodeURIComponent(stance)}&role=${encodeURIComponent(userrole.toLowerCase())}`,
            {
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            }
          );
          const notesData = await notesRes.json();
          if (notesRes.ok && notesData.notes) {
            setNotes(notesData.notes);
            console.log("✅ Notes fetched successfully:", notesData.notes);
          } else {
            console.warn("No notes found or error fetching notes:", notesData.message);
            setNotes('');
          }
        } catch (err) {
          console.error("Error fetching notes:", err);
          setNotes('');
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (allSpeakers.length === 0) return;

    const countdown = setInterval(() => {
      setIntroCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdown);
          setDebateStarted(true);
          setTriggerNextAISpeech(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [allSpeakers]);

  const currentSpeaker = allSpeakers.length > 0 ? allSpeakers[currentSpeakerIndex] : null;
  const topic = Object.values(userData?.entries || {})
    .filter(e => e.debateType === '3v3')
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]?.topic || 'Loading...';
  const userName = userData?.displayName?.toUpperCase() || '';
  const isUserTurn = currentSpeaker?.name === userName;

  useEffect(() => {
    if (!currentSpeaker || !debateStarted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (utteranceRef.current) speechSynthesis.cancel();

          if (isUserTurn && userTranscript.trim()) {
            const tempTranscript = userTranscript.trim();
            const tempSpeaker = currentSpeaker;

            const latestKey = Object.keys(userData.entries)
              .filter(k => userData.entries[k].debateType === '3v3')
              .sort((a, b) => new Date(userData.entries[b].createdAt) - new Date(userData.entries[a].createdAt))[0];

            generateSummary(tempTranscript, tempSpeaker).then((tempSummary) => {
              saveToMongo({
                transcript: tempTranscript,
                summary: tempSummary,
                speaker: {
                  team: tempSpeaker.team,
                  role: userData.entries[latestKey]?.userrole
                }
              });
            });

            setUserTranscript('');
            setCaptionLines([]);
            setCaptionLineIndex(0);
            setHighlightedWordIndex(0);
          }

          if (recognitionRef.current) recognitionRef.current.stop();
          setCaptionLines([]);
          setCaptionLineIndex(0);
          setHighlightedWordIndex(0);
          setIsMuted(true);
          nextSpeaker();
          return 60;
        }

        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentSpeakerIndex, userTranscript, isUserTurn, debateStarted]);

  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const SpeechRecognition = window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognitionRef.current = recognition;

    if (isUserTurn && debateStarted) {
      setIsMuted(false);
      try {
        recognition.start();
      } catch (err) {
        console.warn("Recognition already started");
      }
      let fullTranscript = '';

      recognition.onresult = (event) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            fullTranscript += transcript + ' ';
          } else {
            interim += transcript;
          }
        }
        const combined = (fullTranscript + interim).trim();
        const lines = combined ? combined.split(/[.?!]\s+/).filter(line => line.trim() !== '') : [];
        setCaptionLines(lines);
        setCaptionLineIndex(lines.length > 0 ? lines.length - 1 : 0);
        setHighlightedWordIndex(0);
        setUserTranscript(fullTranscript.trim());
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        recognition.stop();
      };
    } else {
      recognition.stop();
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [currentSpeakerIndex, debateStarted]);

  useEffect(() => {
    if (triggerNextAISpeech && currentSpeaker && !isUserTurn && debateStarted) {
      setTimeout(() => generateAISpeech(currentSpeaker), 500);
      setTriggerNextAISpeech(false);
    }
  }, [triggerNextAISpeech, currentSpeakerIndex, debateStarted]);

  function hangupclick() {
    if (speechSynthesis.speaking) speechSynthesis.cancel();
    navigate('/aijudge');
  }

  const nextSpeaker = () => {
    const nextIndex = currentSpeakerIndex + 1;

    if (nextIndex >= allSpeakers.length) {
      setCaptionLines(["Debate completed!"]);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
      setTimeout(() => {
        const exitBtn = document.querySelector('.hangup');
        if (exitBtn) exitBtn.click();
        navigate('/aijudge');
      }, 10000);
      return;
    }

    setCurrentSpeakerIndex(nextIndex);
    setTimeLeft(60);
    setCaptionLines([]);
    setCaptionLineIndex(0);
    setHighlightedWordIndex(0);
    setIsSpeaking(false);
    setTriggerNextAISpeech(true);
  };

  const speakText = (lines, index) => {
    if (index >= lines.length || !lines[index]) {
      setIsSpeaking(false);
      return;
    }

    const line = lines[index].replace(/[\*#]/g, '');
    const utter = new SpeechSynthesisUtterance(line);
    utter.lang = 'en-US';
    setCaptionLineIndex(index);
    setHighlightedWordIndex(0);

    utter.onboundary = (event) => {
      if (event.name === 'word') {
        setHighlightedWordIndex(prev => prev + 1);
      }
    };

    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => {
      setIsSpeaking(false);
      speakText(lines, index + 1);
    };
    utter.onerror = (err) => {
      console.error("Speech synthesis error:", err);
      setIsSpeaking(false);
    };
    utteranceRef.current = utter;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  const generateAISpeech = async (speaker) => {
    try {
      const res = await fetch(url + "/api/generateAISpeech", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: speaker.role, team: speaker.team, topic })
      });
      const data = await res.json();
      if (!data.transcript) {
        console.warn("No transcript received from API");
        return;
      }
      setTranscripts(prev => ({ ...prev, [speaker.role]: data.transcript }));
      const lines = data.transcript.split(/[.?!]\s+/).filter(line => line.trim() !== '');
      setCaptionLines(lines);
      setCaptionLineIndex(0);
      setHighlightedWordIndex(0);
      speakText(lines, 0);
      generateSummary(data.transcript, speaker);
    } catch (err) {
      console.error("Error generating AI speech:", err);
    }
  };

  const generateSummary = async (text, speaker) => {
    try {
      const res = await fetch(url + "/api/generateSummary", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: text, role: speaker.role, team: speaker.team, topic })
      });

      const data = await res.json();
      if (!Array.isArray(data.summary)) return;

      const labeled = data.summary.map(point => `${speaker.role}: ${point}`);
      if (speaker.team === 'prop') setPropSummary(prev => [...labeled, ...prev]);
      else setOppSummary(prev => [...labeled, ...prev]);

      await saveToMongo({ transcript: text, summary: data.summary, speaker });
    } catch (err) {
      console.error('Summary error:', err);
    }
  };

  const toggleNoteTaker = () => {
    setIsNoteTakerOpen(!isNoteTakerOpen);
  };

  if (!userData || allSpeakers.length === 0 || !currentSpeaker) {
    return <div className="loading">⏳ Loading Debate...</div>;
  }

  if (!debateStarted) {
    return (
      <div className="countdown-screen">
        <h2>🧠 Debate on: <em>{topic}</em></h2>
        <h1>⏳ Starting in {introCountdown} second{introCountdown !== 1 ? 's' : ''}...</h1>
      </div>
    );
  }

  return (
    <div className="debate-container">
      <div className="top-bar">
        <div className="timer">⏱️ {timeLeft}s</div>
        <div className="topic">Debate Topic: <strong>{topic}</strong></div>
        <div className="user-role">👤 You are <strong>{userRole || '...'}</strong></div>
      </div>

      <div className="debate-body">
        <div className="side left summary-box">
          <h3>🟩 Proposition Summary</h3>
          <div className="summary-scroll-container">
            {propSummary.map((point, i) => (
              <div key={i} className="summary-point">{point}</div>
            ))}
          </div>
          <div className="team-avatars">
            {allSpeakers.filter(p => p.team === 'prop').map((spk, i) => (
              <div className={`avatar-box ${spk.name === currentSpeaker.name ? 'active-speaker' : ''}`} key={i}>
                <img src={spk.avatar} alt={spk.name} />
                <div className="role-label">{spk.role}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="center-speaker fade-in">
          <img src={currentSpeaker.avatar} alt="Speaker" className="speaker-avatar" />
          <h2>{currentSpeaker.name}</h2>
          <div className="role-tag">{currentSpeaker.role} Speaking</div>
          {showCaptions && captionLines.length > 0 && captionLineIndex < captionLines.length && (
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
          {isUserTurn && <div className="your-turn">🎙️ Your turn to speak</div>}
        </div>

        <div className="side right summary-box">
          <h3>🟨 Opposition Summary</h3>
          <div className="summary-scroll-container">
            {oppSummary.map((point, i) => (
              <div key={i} className="summary-point">{point}</div>
            ))}
          </div>
          <div className="team-avatars">
            {allSpeakers.filter(p => p.team === 'opp').map((spk, i) => (
              <div className={`avatar-box ${spk.name === currentSpeaker.name ? 'active-speaker' : ''}`} key={i}>
                <img src={spk.avatar} alt={spk.name} />
                <div className="role-label">{spk.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="control-bar">
        <button className={`circle-btn ${!isMuted ? 'speaking' : ''}`} disabled>
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button className="circle-btn">
          <FileText size={20} />
        </button>
        <button className="circle-btn" onClick={() => setShowCaptions(!showCaptions)}>
          {showCaptions ? 'CC Off' : 'CC On'}
        </button>
        <button className="circle-btn" onClick={toggleNoteTaker}>
          {isNoteTakerOpen ? 'Close Notes' : 'Open Notes'}
        </button>
        <button className="circle-btn hangup" onClick={() => hangupclick()}>
          <PhoneOff size={20} />
        </button>
        <button className="next-btn" onClick={nextSpeaker}>
          ➡️ Next
        </button>
      </div>

      <div className={`note-taker-panel ${isNoteTakerOpen ? 'open' : ''}`}>
        <div className="note-taker-header">
          <h2>Notes</h2>
          <button
            onClick={toggleNoteTaker}
            className="close-note-taker-btn"
            aria-label="Close note taker"
          >
            <Notebook size={18} />
          </button>
        </div>
        <textarea
          className="note-taker-textarea"
          style={{ height: '70%' }}
          value={notes}
          readOnly
          placeholder="No notes available..."
        />
      </div>
    </div>
  );
};

export default DebateUI;
