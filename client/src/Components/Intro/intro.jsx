import React, { useState, useEffect } from 'react';
import { ChevronDown, Mic, Users, Brain, Trophy, ArrowRight, Play, Zap, MessageSquare } from 'lucide-react';
import './intro.css'
import { useNavigate } from 'react-router-dom';
const DebattlexIntro = () => {
  const [isVisible, setIsVisible] = useState(false);
    const navigate = useNavigate()
  useEffect(() => {
    // Add external CSS link to document head
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles.css'; // Your external CSS file
    document.head.appendChild(link);
    
    // Trigger animations
    setTimeout(() => setIsVisible(true), 100);
    
    return () => {
      // Cleanup
      document.head.removeChild(link);
    };
  }, []);

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleDebateNow = () => {
    navigate('/login')
  };

  const handleWatchDemo = () => {
    window.open('https://youtu.be/dJw6kCNbuCg', '_blank');
  };

  return (
    <div className="website-container">
      {/* Navigation */}
      <nav className="navbar">
        <div className="nav-container">
          <a href="/" className="logo">
            <img src="logo.png" alt="" className='dx-logo' />
            Debattlex
          </a>
          <ul className="nav-links">
            <li><a href="#" className="nav-link" onClick={() => scrollToSection('hero')}>Home</a></li>
            <li><a href="#" className="nav-link" onClick={() => scrollToSection('features')}>Features</a></li>
            <li><a href="#" className="nav-link" onClick={() => scrollToSection('demo')}>Demo</a></li>
            <li><a href="#" className="nav-link" onClick={() => scrollToSection('tech')}>Technology</a></li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="hero">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className={`hero-content ${isVisible ? 'fade-in' : ''}`}>
          <h1 className="hero-title">
            Real-Time <span className="highlight">AI Debate Platform</span>
          </h1>
          <p className="hero-subtitle">
            Engage in structured debates with AI or other users. Improve your communication, 
            critical thinking, and argumentation through live speech and AI feedback.
          </p>
          <div className="hero-buttons">
            <button 
              className="btn btn-primary"
              onClick={handleDebateNow}
            >
              <Mic size={18} />
              Debate Now
              <ArrowRight className="btn-icon" size={18} />
            </button>
            <button 
              className="btn btn-secondary"
              onClick={handleWatchDemo}
            >
              <Play size={18} />
              Watch Demo
            </button>
          </div>
          
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="stat-icon">🎤</div>
              <div className="stat-text">Live Speech Recognition</div>
            </div>
            <div className="hero-stat">
              <div className="stat-icon">🤖</div>
              <div className="stat-text">AI-Powered Debates</div>
            </div>
            <div className="hero-stat">
              <div className="stat-icon">⚖️</div>
              <div className="stat-text">Real-Time Feedback</div>
            </div>
          </div>
        </div>
        
        <div className="scroll-indicator" onClick={() => scrollToSection('features')}>
          <ChevronDown size={24} className="bounce" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="section features-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Core Features</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="services-grid">
            <div className="service-card">
              <div className="service-icon"><Mic size={40} color="#a855f7" /></div>
              <h3>Real-Time Speech Recognition</h3>
              <p>Live voice-to-text conversion for seamless debate participation with instant transcription and analysis.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Brain size={40} color="#a855f7" /></div>
              <h3>AI Speakers & Summarization</h3>
              <p>AI-generated speeches with live summaries in bullet points. Get instant feedback and structured arguments.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Users size={40} color="#a855f7" /></div>
              <h3>Role-Based Format</h3>
              <p>Supports PM, LO, DPM, DLO, GW, OW roles in Asian Parliamentary format for structured debates.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><MessageSquare size={40} color="#a855f7" /></div>
              <h3>Case Preparation</h3>
              <p>Collaborate with AI to prepare points per role before debates. Get strategic insights and argument structures.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Trophy size={40} color="#a855f7" /></div>
              <h3>AI Judge Feedback</h3>
              <p>Automatic judgment based on arguments, structure, logic, and persuasiveness with detailed performance metrics.</p>
            </div>
            <div className="service-card">
              <div className="service-icon"><Zap size={40} color="#a855f7" /></div>
              <h3>Multiple Modes</h3>
              <p>Beginner, Intermediate, and Advanced modes with 1v1 and 3v3 debate formats for all skill levels.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="section demo-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Experience Debattlex</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="demo-content">
            <div className="demo-info">
              <h3>Try it Live</h3>
              <p>
                Experience the power of AI-driven debates with our live platform. 
                Join debates, get real-time feedback, and improve your argumentation skills.
              </p>
              
              <div className="demo-credentials">
                <h4>Demo Login Credentials:</h4>
                <div className="credential-item">
                  <span className="credential-label">📧 Email:</span>
                  <span className="credential-value">krishna@debattlex.com</span>
                </div>
                <div className="credential-item">
                  <span className="credential-label">🔒 Password:</span>
                  <span className="credential-value">radhakrishna</span>
                </div>
              </div>
              
              <div className="demo-buttons">
                <button className="btn btn-primary" onClick={handleDebateNow}>
                  <Mic size={18} />
                  Launch Platform
                  <ArrowRight className="btn-icon" size={18} />
                </button>
                <button className="btn btn-secondary" onClick={handleWatchDemo}>
                  <Play size={18} />
                  Watch Demo Video
                </button>
              </div>
            </div>
            
            <div className="demo-features">
              <div className="demo-feature">
                <div className="demo-feature-icon">🎯</div>
                <h4>Structured Debates</h4>
                <p>Follow Asian Parliamentary format with defined roles and time limits</p>
              </div>
              <div className="demo-feature">
                <div className="demo-feature-icon">📊</div>
                <h4>Performance Analytics</h4>
                <p>Get detailed feedback on logic, clarity, and persuasiveness</p>
              </div>
              <div className="demo-feature">
                <div className="demo-feature-icon">💾</div>
                <h4>Transcript Storage</h4>
                <p>All debates are saved with transcripts and summaries in MongoDB</p>
              </div>
              <div className="demo-feature">
                <div className="demo-feature-icon">🏆</div>
                <h4>Ranking System</h4>
                <p>Track your progress with wins, debates, and performance metrics</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="tech" className="section tech-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Technology Stack</h2>
            <div className="section-divider"></div>
          </div>
          
          <div className="tech-grid">
            <div className="tech-category">
              <h3>Frontend</h3>
              <div className="tech-items">
                <div className="tech-item">React.js</div>
                <div className="tech-item">React Router DOM</div>
                <div className="tech-item">Axios</div>
                <div className="tech-item">Web Speech API</div>
              </div>
            </div>
            <div className="tech-category">
              <h3>Backend</h3>
              <div className="tech-items">
                <div className="tech-item">Node.js</div>
                <div className="tech-item">Express.js</div>
                <div className="tech-item">Mongoose</div>
                <div className="tech-item">MongoDB Atlas</div>
              </div>
            </div>
            <div className="tech-category">
              <h3>AI Integration</h3>
              <div className="tech-items">
                <div className="tech-item">Sarvam AI</div>
                <div className="tech-item">Text-to-Speech</div>
                <div className="tech-item">Speech-to-Text</div>
                <div className="tech-item">AI Feedback System</div>
              </div>
            </div>
            <div className="tech-category">
              <h3>Hosting</h3>
              <div className="tech-items">
                <div className="tech-item">Render.com</div>
                <div className="tech-item">GitHub</div>
                <div className="tech-item">Environment Config</div>
                <div className="tech-item">Cloud Deployment</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DebattlexIntro;
