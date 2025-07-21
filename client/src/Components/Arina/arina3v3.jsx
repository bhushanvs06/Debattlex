import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, FileText, PhoneOff } from 'lucide-react';
import './DebateUI.css';
import { useNavigate } from 'react-router-dom';
const url = 'https://debattlex.onrender.com'
const DebateUI = () => {
  const [isMuted, setIsMuted] = useState(true);
  const [currentSpeakerIndex, setCurrentSpeakerIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [caption, setCaption] = useState('');
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
  const [ema,Setema]=useState('')
  const navigate = useNavigate()

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

    const res = await fetch(url+"/api/saveRoleTranscript", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: userData.email,
        topicSlug: latestKey,
        team, // <- fixed here
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
      const res = await fetch(url+`/api/getUserDebateData?email=${storedEmail}`);
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

      // ✅ Extract prep for every role
      const allPreps = {
        PM: proposition?.pm?.prep || "",
        DPM: proposition?.dpm?.prep || "",
        GW: proposition?.gw?.prep || "",
        LO: opposition?.lo?.prep || "",
        DLO: opposition?.dlo?.prep || "",
        OW: opposition?.ow?.prep || ""
      };
      setAllPrep(allPreps); // You need to define this in useState

      // ✅ Generate members list
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

  // 🧠 This block adds user transcript + summary to Mongo before moving to next speaker
  if (isUserTurn && userTranscript.trim()) {
    const tempTranscript = userTranscript.trim();
    const tempSpeaker = currentSpeaker;

    const latestKey = Object.keys(userData.entries)
      .filter(k => userData.entries[k].debateType === '3v3')
      .sort((a, b) => new Date(userData.entries[b].createdAt) - new Date(userData.entries[a].createdAt))[0];

    // 🧠 Generate summary from the transcript
    generateSummary(tempTranscript, tempSpeaker).then((tempSummary) => {
      saveToMongo({
        transcript: tempTranscript,
        summary: tempSummary,
        speaker: {
          team: tempSpeaker.team,
          role: userData.entries[latestKey]?.userrole // 🎯 pass user role
        }
      });
    });

    setUserTranscript('');
  }

  if (recognitionRef.current) recognitionRef.current.stop();
  setCaption('');
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
        setCaption(interim);
        setUserTranscript(fullTranscript.trim());
      };

      recognition.onerror = () => recognition.stop();
    } else {
      recognition.stop();
    }
  }, [currentSpeakerIndex, debateStarted]);

  useEffect(() => {
    if (triggerNextAISpeech && currentSpeaker && !isUserTurn && debateStarted) {
      setTimeout(() => generateAISpeech(currentSpeaker), 500);
      setTriggerNextAISpeech(false);
    }
  }, [triggerNextAISpeech, currentSpeakerIndex, debateStarted]);

  function hangupclick(){
    navigate('/aijudge')
  }

  const nextSpeaker = () => {
    const nextIndex = currentSpeakerIndex + 1;

    if (nextIndex >= allSpeakers.length) {
      // Debate complete, auto-end after 10s
      setCaption("✅ Debate completed!");
      setTimeout(() => {
        const exitBtn = document.querySelector('.hangup');
        if (exitBtn) exitBtn.click();
        window.location.href = "/aijudge";
      }, 10000);
      return;
    }

    setCurrentSpeakerIndex(nextIndex);
    setTimeLeft(60);
    setCaption('');
    setIsSpeaking(false);
    setTriggerNextAISpeech(true);
  };

  const speakText = (text) => {
    const cleanText = text.replace(/\*+/g, '').replace(/\\n/g, ' ').trim();
    const utter = new SpeechSynthesisUtterance(cleanText);
    utter.lang = 'en-US';
    utter.onstart = () => setIsSpeaking(true);
    utter.onend = () => setIsSpeaking(false);
    utter.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utter;
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  const generateAISpeech = async (speaker) => {
    const res = await fetch(url+"/api/generateAISpeech", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: speaker.role, team: speaker.team, topic })
    });
    const data = await res.json();
    if (!data.transcript) return;
    setTranscripts(prev => ({ ...prev, [speaker.role]: data.transcript }));
    setCaption(data.transcript);
    speakText(data.transcript);
    generateSummary(data.transcript, speaker);
  };

  const generateSummary = async (text, speaker) => {
  try {
    const res = await fetch(url+"/api/generateSummary", {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: text, role: speaker.role, team: speaker.team, topic })
    });

    const data = await res.json();
    if (!Array.isArray(data.summary)) return;

    const labeled = data.summary.map(point => `${speaker.role}: ${point}`);
    if (speaker.team === 'prop') setPropSummary(prev => [...labeled, ...prev]);
    else setOppSummary(prev => [...labeled, ...prev]);

    // ✅ Save immediately to MongoDB
    await saveToMongo({ transcript: text, summary: data.summary, speaker });
  } catch (err) {
    console.error('Summary error:', err);
  }
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
            {propSummary.map((point, i) => <div key={i} className="summary-point">{point}</div>)}
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
          <div className="caption">🗣️ {caption || 'Waiting for speech...'}</div>
          {isUserTurn && <div className="your-turn">🎙️ Your turn to speak</div>}
        </div>

        <div className="side right summary-box">
          <h3>🟨 Opposition Summary</h3>
          <div className="summary-scroll-container">
            {oppSummary.map((point, i) => <div key={i} className="summary-point">{point}</div>)}
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
        <button className={`circle-btn ${!isMuted ? 'speaking' : ''}`} disabled>{isMuted ? <MicOff size={20} /> : <Mic size={20} />}</button>
        <button className="circle-btn"><FileText size={20} /></button>
        <button className="circle-btn">CC</button>
        <button className="circle-btn hangup" onClick={()=>hangupclick()}><PhoneOff size={20} /></button>
        <button className="next-btn" onClick={nextSpeaker}>➡️ Next</button>
      </div>
    </div>
  );
};

export default DebateUI;
