import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Search, Users, Brain, MessageSquare, BookOpen, Target, Clock, Notebook, X } from 'lucide-react';
import './Debateprep1.css';

// Custom hook for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const DebatePrep1 = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState([]);
  const [userTranscript, setUserTranscript] = useState([]);
  const [teammate1Transcript, setTeammate1Transcript] = useState([]);
  const [teammate2Transcript, setTeammate2Transcript] = useState([]);
  const [summaryHighlights, setSummaryHighlights] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState('');
  const [currentMotion, setCurrentMotion] = useState('');
  const [debateTimer, setDebateTimer] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [team, setTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isNoteTakerOpen, setIsNoteTakerOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [factCheckResult, setFactCheckResult] = useState('');
  const [debateData, setDebateData] = useState(null);
  const [topic, setTopic] = useState('');
  const [topicSlug, setTopicSlug] = useState('');
  const [userrole, setUserRole] = useState('');

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = 'https://debattlex.onrender.com';
  const email = localStorage.getItem('userEmail') || 'aniketsonone2908@gmail.com';

  const debouncedNotes = useDebounce(notes, 500);

  // Role mapping for user-friendly names
  const roleMap = {
    pm: 'Prime Minister',
    dpm: 'Deputy Prime Minister',
    gw: 'Government Whip',
    lo: 'Leader of Opposition',
    dlo: 'Deputy Leader of Opposition',
    ow: 'Opposition Whip'
  };

  // Fetch debate data from /api/caseprepfetchdata
  useEffect(() => {
    console.log("🔥 useEffect triggered");

    const fetchDebateData = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/caseprepfetchdata`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();
        console.log("📦 Raw response:", data);

        if (!res.ok || data.message) {
          throw new Error(data.message || `HTTP error! status: ${res.status}`);
        }

        setDebateData(data);
        setTopic(data.topic);
        setTopicSlug(data.topicSlug);
        setCurrentMotion(data.topic);
        setTeam(data.stance);
        setUserRole(data.userRole || 'lo');

        console.log('✅ Debate Topic:', data.topic);
        console.log('✅ Topic Slug:', data.topicSlug);
        console.log('✅ User Role:', data.userRole);
        console.log('✅ Proposition:', data.proposition);
        console.log('✅ Opposition:', data.opposition);
        console.log('✅ Team:', data.stance);
      } catch (err) {
        console.error('❌ Failed to fetch debate data:', err.message);
        setTranscript(prev => [...prev, {
          from: 'System',
          role: 'Error',
          avatar: '⚠️',
          text: `Failed to fetch debate data: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system',
          color: '#EF4444'
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDebateData();
  }, []);

  // Dynamic teamMembers based on fetched data and userrole
  const teamMembers = debateData && userrole
    ? (() => {
        const isProposition = debateData.stance === 'proposition';
        const propRoles = ['pm', 'dpm', 'gw'];
        const oppRoles = ['lo', 'dlo', 'ow'];
        const availableRoles = isProposition ? propRoles : oppRoles;
        const remainingRoles = availableRoles.filter(role => role !== userrole.toLowerCase());

        return {
          user: {
            name: 'You',
            role: roleMap[userrole.toLowerCase()] || 'Leader of Opposition',
            avatar: '👤',
            color: '#3B82F6',
            description: 'Opening arguments and case establishment'
          },
          teammate1: {
            name: `AI ${roleMap[remainingRoles[0]]}`,
            role: roleMap[remainingRoles[0]],
            avatar: '👩‍💼',
            color: '#10B981',
            description: 'Rebuttals and case reinforcement'
          },
          teammate2: {
            name: `AI ${roleMap[remainingRoles[1]]}`,
            role: roleMap[remainingRoles[1]],
            avatar: '👨‍💻',
            color: '#8B5CF6',
            description: 'Summary and final arguments'
          }
        };
      })()
    : {
        user: {
          name: 'You',
          role: 'Leader of Opposition',
          avatar: '👤',
          color: '#3B82F6',
          description: 'Opening arguments and case establishment'
        },
        teammate1: {
          name: 'AI Deputy Leader of Opposition',
          role: 'Deputy Leader of Opposition',
          avatar: '👩‍💼',
          color: '#10B981',
          description: 'Rebuttals and case reinforcement'
        },
        teammate2: {
          name: 'AI Opposition Whip',
          role: 'Opposition Whip',
          avatar: '👨‍💻',
          color: '#8B5CF6',
          description: 'Summary and final arguments'
        }
      };

  // Memoize summaryHighlights to prevent duplicate saves
  const memoizedSummaryHighlights = useMemo(() => summaryHighlights, [JSON.stringify(summaryHighlights)]);

  // Summarize transcripts and save for all roles
  useEffect(() => {
    const summarizeTranscripts = async () => {
      if (!debateData || !transcript.length || !userrole || !topicSlug) {
        console.warn('📝 summarizeTranscripts: Missing required data', { debateData, transcript, userrole, topicSlug });
        return;
      }

      const isProposition = debateData.stance === 'proposition';
      const propRoles = ['pm', 'dpm', 'gw'];
      const oppRoles = ['lo', 'dlo', 'ow'];
      const availableRoles = isProposition ? propRoles : oppRoles;
      const teammate1Role = availableRoles.filter(role => role !== userrole.toLowerCase())[0];
      const teammate2Role = availableRoles.filter(role => role !== userrole.toLowerCase())[1];

      const transcripts = {
        [userrole.toLowerCase()]: userTranscript.map(entry => entry.text).join(' '),
        [teammate1Role]: teammate1Transcript.map(entry => entry.text).join(' '),
        [teammate2Role]: teammate2Transcript.map(entry => entry.text).join(' ')
      };

      const highlights = {};

      for (const [role, text] of Object.entries(transcripts)) {
        if (text.trim()) {
          try {
            console.log(`📝 Summarizing transcript for ${role}:`, text);
            const response = await fetch(`${API_URL}/api/caseprepsummariser`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ 
                email, 
                topic, 
                topicSlug, 
                team: debateData.stance, 
                role, 
                transcript: text 
              })
            });
            const data = await response.json();

            if (!response.ok || data.message) {
              throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            highlights[role] = data.highlights || ['No highlights available'];
          } catch (error) {
            console.error(`❌ Failed to summarize transcript for ${role}:`, error.message);
            highlights[role] = [`Error summarizing transcript for ${roleMap[role] || role}`];
          }
        } else {
          highlights[role] = ['No transcript available for summarization'];
        }
      }

      setSummaryHighlights(highlights);
      console.log('✅ Summary Highlights:', highlights, 'User Role:', userrole);

      // Save summaries for all roles
      const savePromises = Object.entries(highlights).map(async ([role, highlightsForRole]) => {
        try {
          console.log('📝 Sending to /api/saveSummary:', { email, topic, topicSlug, team: debateData.stance, role, highlights: highlightsForRole });
          const response = await fetch(`${API_URL}/api/saveSummary`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email,
              topic,
              topicSlug,
              team: debateData.stance,
              role,
              highlights: highlightsForRole
            })
          });
          const data = await response.json();
          console.log(`📦 /api/saveSummary response for ${role}:`, data);
          if (!response.ok || data.message !== 'Summary saved successfully') {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
          }
          return { role, status: 'success', message: `Summary saved for ${role}` };
        } catch (error) {
          console.error(`❌ Failed to save summary to MongoDB Atlas for ${role}:`, error.message);
          return { role, status: 'error', message: error.message };
        }
      });

      const results = await Promise.all(savePromises);
      console.log('✅ Save Summary Results:', results);
    };

    summarizeTranscripts().catch(err => console.error('❌ Error summarizing transcripts:', err.message));
  }, [userTranscript, teammate1Transcript, teammate2Transcript, debateData, topic, topicSlug, userrole, email]);

  // Save notes to MongoDB Atlas on debouncedNotes change
  useEffect(() => {
    const saveNotes = async () => {
      if (!debouncedNotes || !debateData || !userrole || !topicSlug) return;

      try {
        const response = await fetch(`${API_URL}/api/saveNotes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email,
            topic,
            topicSlug,
            team: debateData.stance,
            role: userrole.toLowerCase(),
            notes: debouncedNotes
          })
        });
        const data = await response.json();
        if (!response.ok || data.message) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        console.log('✅ Notes saved to MongoDB Atlas:', data.message);
      } catch (error) {
        console.error('❌ Failed to save notes to MongoDB Atlas:', error.message);
      }
    };

    saveNotes().catch(err => console.error('❌ Error saving notes:', err.message));
  }, [debouncedNotes, debateData, userrole, topic, topicSlug, email]);

  // Timer logic with 20-minute limit and navigation
  useEffect(() => {
    if (isTimerActive) {
      timerRef.current = setInterval(() => {
        setDebateTimer(prev => {
          const newTime = prev + 1;
          if (newTime >= 1200) { // 20 minutes = 1200 seconds
            console.log('⏰ Timer reached 20 minutes, navigating to /arina3v3');
            clearInterval(timerRef.current);
            setIsTimerActive(false);
            navigate('/arina3v3');
            return prev;
          }
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isTimerActive, navigate]);

  const sanitizeInput = (text) => {
    return text.replace(/[^a-zA-Z0-9\s.,!?]/g, '');
  };

  const summarizeTextWithSarvam = async (text) => {
    try {
      const response = await fetch(`${API_URL}/api/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const summary = sanitizeInput(data.summary || 'Summary failed.');
      console.log('📝 Summarized Text Input:', text);
      console.log('📝 Summarized Text Output:', summary);
      return summary;
    } catch (error) {
      console.error('❌ Summarization Failed:', { text, error: error.message });
      const maxLength = 300;
      return text.length <= maxLength ? text : text.substring(0, maxLength - 3) + '...';
    }
  };

  const checkFacts = async () => {
    if (!notes.trim()) {
      setFactCheckResult('Please enter some notes to check.');
      return;
    }
    setIsLoading(true);
    try {
      const sanitizedNotes = sanitizeInput(notes);
      const response = await fetch(`${API_URL}/api/factcheck`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: sanitizedNotes }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      const result = sanitizeInput(data.result || 'No fact-check results available.');
      setFactCheckResult(result);
    } catch (error) {
      console.error('❌ Fact-checking failed:', error.message);
      setFactCheckResult(`Error checking facts: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => {
    const generateRoleTextMap = async () => {
      const roleOrder = debateData && userrole
        ? (debateData.stance === 'proposition'
            ? ['pm', 'dpm', 'gw']
            : ['lo', 'dlo', 'ow']).filter(role => role !== userrole.toLowerCase()).concat(userrole.toLowerCase())
        : ['lo', 'dlo', 'ow'];
      const roleTextMap = {};

      for (const key of roleOrder) {
        const role = roleMap[key] || key;
        const latestEntry = [...transcript]
          .reverse()
          .find(entry => entry.role === role);

        if (latestEntry) {
          roleTextMap[key] = await summarizeTextWithSarvam(latestEntry.text);
        }
      }

      if (Object.keys(roleTextMap).length > 0) {
        console.log('📝 Role Text Map:', roleTextMap);
      }
    };

    generateRoleTextMap().catch(err => console.error('❌ Error generating roleTextMap:', err.message));
  }, [transcript, debateData, userrole]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleMic = () => {
    if (!isListening) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setTranscript(prev => [...prev, {
          from: 'System',
          role: 'Error',
          avatar: '⚠️',
          text: 'Speech recognition not supported. Please type your input.',
          timestamp: new Date().toLocaleTimeString(),
          type: 'system',
          color: '#EF4444'
        }]);
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript;
        const sanitizedText = sanitizeInput(spokenText);
        const entry = {
          from: teamMembers.user.name,
          role: teamMembers.user.role,
          avatar: teamMembers.user.avatar,
          text: sanitizedText,
          timestamp: new Date().toLocaleTimeString(),
          type: 'user',
          color: teamMembers.user.color
        };
        setTranscript(prev => [...prev, entry]);
        setUserTranscript(prev => [...prev, entry]);
        simulateAIResponses(sanitizedText);
      };
      recognition.onerror = (event) => {
        setTranscript(prev => [...prev, {
          from: 'System',
          role: 'Error',
          avatar: '⚠️',
          text: `Speech recognition error: ${event.error}`,
          timestamp: new Date().toLocaleTimeString(),
          type: 'system',
          color: '#EF4444'
        }]);
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsTimerActive(true);
    } else {
      recognitionRef.current?.stop();
      setIsTimerActive(false);
    }
    setIsListening(!isListening);
  };

  const handleReadyClick = () => {
    console.log('📝 I Am Ready clicked, navigating to /arina3v3');
    setIsTimerActive(false);
    navigate('/arina3v3');
  };

  const speak = (text, rate = 1, pitch = 1) => {
    if (!window.speechSynthesis) {
      console.error('Speech synthesis not supported.');
      return;
    }

    const synth = window.speechSynthesis;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = rate;
    utter.pitch = pitch;
    utter.lang = 'en-US';
    utter.onerror = (event) => console.error('Speech synthesis error:', event);

    if (synth.speaking) {
      synth.cancel();
    }

    const voices = synth.getVoices();
    if (voices.length > 0) {
      utter.voice = voices.find(v => v.lang === 'en-US') || voices[0];
    }

    synth.speak(utter);
  };

  const simulateAIResponses = async (userInput) => {
    setIsLoading(true);
    try {
      const isProposition = debateData.stance === 'proposition';
      const propRoles = ['pm', 'dpm', 'gw'];
      const oppRoles = ['lo', 'dlo', 'ow'];
      const availableRoles = isProposition ? propRoles : oppRoles;
      const teammate1Role = availableRoles.filter(role => role !== userrole.toLowerCase())[0];
      const teammate2Role = availableRoles.filter(role => role !== userrole.toLowerCase())[1];

      // First AI teammate response
      const teammate1Res = await fetch(`${API_URL}/api/teama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          userInput,
          topic,
          topicSlug,
          team: debateData.stance,
          role: teammate1Role
        })
      });
      const teammate1Data = await teammate1Res.json();

      if (teammate1Data.message) {
        throw new Error(teammate1Data.message);
      }

      const sanitizedTeammate1Text = sanitizeInput(teammate1Data.result);
      const teammate1Entry = {
        from: teamMembers.teammate1.name,
        role: teamMembers.teammate1.role,
        avatar: teamMembers.teammate1.avatar,
        text: sanitizedTeammate1Text,
        timestamp: new Date().toLocaleTimeString(),
        type: 'ai-teammate1',
        color: teamMembers.teammate1.color
      };
      setTranscript(prev => [...prev, teammate1Entry]);
      setTeammate1Transcript(prev => [...prev, teammate1Entry]);

      await new Promise((resolve) => {
        const utter1 = new SpeechSynthesisUtterance(sanitizedTeammate1Text);
        utter1.rate = 0.9;
        utter1.pitch = 1.1;
        utter1.lang = 'en-US';
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          utter1.voice = voices.find(v => v.lang === 'en-US') || voices[0];
        }
        utter1.onend = resolve;
        utter1.onerror = resolve;
        window.speechSynthesis.speak(utter1);
      });

      // Second AI teammate response
      const teammate2Res = await fetch(`${API_URL}/api/teama`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          userInput,
          topic,
          topicSlug,
          team: debateData.stance,
          role: teammate2Role
        })
      });
      const teammate2Data = await teammate2Res.json();

      if (teammate2Data.message) {
        throw new Error(teammate2Data.message);
      }

      const sanitizedTeammate2Text = sanitizeInput(teammate2Data.result);
      const teammate2Entry = {
        from: teamMembers.teammate2.name,
        role: teamMembers.teammate2.role,
        avatar: teamMembers.teammate2.avatar,
        text: sanitizedTeammate2Text,
        timestamp: new Date().toLocaleTimeString(),
        type: 'ai-teammate2',
        color: teamMembers.teammate2.color
      };
      setTranscript(prev => [...prev, teammate2Entry]);
      setTeammate2Transcript(prev => [...prev, teammate2Entry]);

      const utter2 = new SpeechSynthesisUtterance(sanitizedTeammate2Text);
      utter2.rate = 0.8;
      utter2.pitch = 0.9;
      utter2.lang = 'en-US';
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utter2.voice = voices.find(v => v.lang === 'en-US') || voices[0];
      }
      window.speechSynthesis.speak(utter2);
    } catch (error) {
      console.error('❌ AI Teammate Response Failed:', error.message);
      setTranscript(prev => [...prev, {
        from: 'System',
        role: 'Error',
        avatar: '⚠️',
        text: `Failed to get AI teammate response: ${error.message}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'system',
        color: '#EF4444'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    try {
      const sanitizedQuery = sanitizeInput(searchQuery);
      const response = await fetch(`${API_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: sanitizedQuery })
      });
      const data = await response.json();

      if (data.message) {
        throw new Error(data.message);
      }

      setSearchResult(sanitizeInput(data.result) || 'No research results found.');
    } catch (error) {
      console.error('❌ Search failed:', error.message);
      setSearchResult(`Error retrieving research results: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    setUserTranscript([]);
    setTeammate1Transcript([]);
    setTeammate2Transcript([]);
    setSummaryHighlights({});
    setDebateTimer(0);
    setIsTimerActive(false);
    window.speechSynthesis.cancel();
  };

  const toggleNoteTaker = () => {
    setIsNoteTakerOpen(!isNoteTakerOpen);
  };

  const profilePhotoStyle = (color) => ({
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: `3px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
    fontWeight: 'bold',
    background: `linear-gradient(135deg, ${color}15, ${color}25)`,
    boxShadow: `0 2px 8px ${color}40`,
    transition: 'all 0.3s ease'
  });

  const coachAvatarStyle = (color) => ({
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: `3px solid ${color}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 'bold',
    background: `linear-gradient(135deg, ${color}20, ${color}30)`,
    boxShadow: `0 4px 12px ${color}30`,
    transition: 'all 0.3s ease'
  });

  // Display all team members' roles and teams
  const allMembers = debateData
    ? [
        { name: 'You', role: roleMap[userrole.toLowerCase()] || 'Leader of Opposition', team: debateData.stance },
        { name: teamMembers.teammate1.name, role: teamMembers.teammate1.role, team: debateData.stance },
        { name: teamMembers.teammate2.name, role: teamMembers.teammate2.role, team: debateData.stance }
      ]
    : [];

  return (
    <div className="debate-prep">
      <header className="debate-header">
        <div className="header-content">
          <h1><Target className="header-icon" /> AP Debate Preparation Studio</h1>
          <div className="session-info">
            <div className="timer">
              <Clock size={16} />
              <span>{formatTime(debateTimer)}</span>
            </div>
            <div className="participants">
              <Users size={16} />
              <span>{allMembers.length || 3} Team Members</span>
            </div>
          </div>
        </div>
      </header>

      <div className="motion-display">
        <div className="motion-content">
          <BookOpen className="motion-icon" />
          <div className="motion-text">
            <h3>Current Motion:</h3>
            <p>{topic || 'Loading topic...'}</p>
          </div>
        </div>
        <div className="stance-selector">
          <label>Team: </label>
          <select value={team} onChange={(e) => setTeam(e.target.value)}>
            <option value="proposition">Proposition</option>
            <option value="opposition">Opposition</option>
          </select>
        </div>
      </div>

      <div className="main-content">
        <div className="left-panel">
          <div className="chat-section">
            <div className="section-header">
              <MessageSquare size={20} />
              <h2>Team Discussion</h2>
              <button className="clear-btn" onClick={clearTranscript}>Clear</button>
            </div>

            <div className="chat-container" ref={chatContainerRef}>
              <div className="chat-box">
                {transcript.length === 0 ? (
                  <div className="empty-state">
                    <MessageSquare size={48} className="empty-icon" />
                    <p>Start your debate preparation by clicking the microphone</p>
                  </div>
                ) : (
                  transcript.map((entry, i) => (
                    <div key={i} className={`message ${entry.type}`}>
                      <div className="message-header">
                        <div
                          className="avatar"
                          style={profilePhotoStyle(entry.color)}
                        >
                          {entry.avatar}
                        </div>
                        <div className="sender-info">
                          <span className="sender">{entry.from}</span>
                          <span className="role">{entry.role}</span>
                        </div>
                        <span className="timestamp">{entry.timestamp}</span>
                      </div>
                      <div className="message-content">
                        {entry.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mic-controls">
              <button
                onClick={toggleMic}
                className={`mic-btn ${isListening ? 'listening' : ''}`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                aria-pressed={isListening}
                disabled={isLoading || !debateData}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                <span>{isListening ? 'Stop Recording' : 'Start Recording'}</span>
              </button>
              <button
                onClick={handleReadyClick}
                className="ready-btn"
                aria-label="I am ready, proceed to debate"
                disabled={isLoading}
              >
                <span>I Am Ready</span>
              </button>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="research-section">
            <div className="section-header">
              <Brain size={20} />
              <h2>Research Assistant</h2>
              <button
                onClick={toggleNoteTaker}
                className="note-taker-btn"
                aria-label={isNoteTakerOpen ? 'Close note taker' : 'Open note taker'}
              >
                <Notebook size={18} />
                <span>{isNoteTakerOpen ? 'Close Notes' : 'Open Notes'}</span>
              </button>
            </div>

            <div className="search-container">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Ask about evidence, statistics, or case studies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(sanitizeInput(e.target.value))}
                  onKeyPress={handleKeyPress}
                  className="search-input"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSearch}
                  className="search-btn"
                  disabled={isLoading}
                  aria-label="Search"
                >
                  {isLoading ? 'Searching...' : <Search size={18} />}
                </button>
              </div>

              {searchResult && (
                <div className="search-results">
                  <div className="result-header">
                    <BookOpen size={16} />
                    <span>Research Results</span>
                  </div>
                  <div className='result-scroll'>
                    <div className="result-content">
                      {searchResult}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="ai-coaches">
              <div className="coach-card teammate1">
                <div className="coach-header">
                  <div
                    className="coach-avatar"
                    style={coachAvatarStyle(teamMembers.teammate1.color)}
                  >
                    {teamMembers.teammate1.avatar}
                  </div>
                  <div className="coach-info">
                    <div className="coach-name">{teamMembers.teammate1.name}</div>
                    <div className="coach-role">{teamMembers.teammate1.role}</div>
                  </div>
                </div>
                <p>{teamMembers.teammate1.description}</p>
              </div>

              <div className="coach-card teammate2">
                <div className="coach-header">
                  <div
                    className="coach-avatar"
                    style={coachAvatarStyle(teamMembers.teammate2.color)}
                  >
                    {teamMembers.teammate2.avatar}
                  </div>
                  <div className="coach-info">
                    <div className="coach-name">{teamMembers.teammate2.name}</div>
                    <div className="coach-role">{teamMembers.teammate2.role}</div>
                  </div>
                </div>
                <p>{teamMembers.teammate2.description}</p>
              </div>
            </div>

            {allMembers.length > 0 && (
              <div className="all-members">
                <h3>All Team Members</h3>
                <ul>
                  {allMembers.map((member, index) => (
                    <li key={index}>
                      {member.name} - {member.role} ({member.team.charAt(0).toUpperCase() + member.team.slice(1)})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className={`note-taker-panel ${isNoteTakerOpen ? 'open' : ''}`}>
            <div className="note-taker-header">
              <h2>Notes</h2>
              <button
                onClick={toggleNoteTaker}
                className="close-note-taker-btn"
                aria-label="Close note taker"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              className="note-taker-textarea"
              style={{ height: '40%' }}
              value={notes}
              onChange={(e) => {
                const newNotes = e.target.value;
                setNotes(newNotes);
              }}
              placeholder="Write your debate notes here..."
            />
            <div className="note-taker-actions">
              <button
                onClick={checkFacts}
                className="fact-check-btn"
                disabled={isLoading}
                aria-label="Check facts of notes"
              >
                <Brain size={18} />
                <span>{isLoading ? 'Checking Facts...' : 'Check Facts'}</span>
              </button>
              {factCheckResult && (
                <div className="fact-check-results">
                  <div className="result-header">
                    <BookOpen size={16} />
                    <span>Fact-Check Results</span>
                  </div>
                  <div className="result-content">
                    {factCheckResult}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebatePrep1;