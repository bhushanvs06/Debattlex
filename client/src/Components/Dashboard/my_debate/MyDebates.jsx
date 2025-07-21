import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./MyDebate.css";

function MyDebates({ userId }) {
  const [debates, setDebates] = useState([]);
  const [activeNav, setActiveNav] = useState("My Debates");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDebates = async () => {
      try {
        const res = await axios.get(`/api/user/${userId}`);
        setDebates(res.data.entries);
      } catch (err) {
        console.error("Failed to fetch debates", err);
      }
    };
    if (userId) fetchDebates();
  }, [userId]);

  const handleNavClick = (label, route) => {
    setActiveNav(label);
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <div className="sidebar-header">
          <h1 className="app-title">
            <span className="title-debate">Debatle</span>
            <span className="title-guard"></span>
          </h1>
        </div>

        <nav className="sidebar-nav">
         
          
          <button
            className={`nav-item ${activeNav === "Overview" ? "active" : ""}`}
            onClick={() => handleNavClick("Overview", "/overview")}
          >
            Overview
          </button>

          <button
            className={`nav-item ${activeNav === "My Debates" ? "active" : ""}`}
            onClick={() => handleNavClick("My Debates", "/overview/my-debates")}
          >
            My Debates
          </button>

          <button
            className={`nav-item ${activeNav === "Feedback" ? "active" : ""}`}
            onClick={() => handleNavClick("Feedback", "/overview/feedbackpage")}
          >
            Feedback
          </button>

          <button
            className={`nav-item ${activeNav === "Settings" ? "active" : ""}`}
            onClick={() => handleNavClick("Settings", "/overview/settings")}
          >
            Settings
          </button>
        </nav>

        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        <div className="debate-container">
          <h2 className="debate-heading">🗣️ My Debate History</h2>

          {debates.length === 0 ? (
            <p className="no-debate">No debates found.</p>
          ) : (
            debates.map((debate, index) => (
              <div className="debate-card" key={index}>
                <div className="debate-header">
                  <h3>{debate.topic}</h3>
                  <span className="debate-type">{debate.type}</span>
                </div>
                <p><strong>Stance:</strong> {debate.stance}</p>
                <p><strong>Summary:</strong> {debate.user_summary}</p>

                {debate.AI_feedback && (
                  <div className="feedback-grid">
                    <div><strong>Clarity:</strong> {debate.AI_feedback.clarity}</div>
                    <div><strong>Communication:</strong> {debate.AI_feedback.communication}</div>
                    <div><strong>Grammar:</strong> {debate.AI_feedback.grammar}</div>
                    <div><strong>Score:</strong> {debate.AI_feedback.score}</div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default MyDebates;
