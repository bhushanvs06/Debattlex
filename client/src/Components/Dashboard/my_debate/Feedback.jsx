import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";
import "./FeedbackPage.css";
const url = 'https://debattlex.onrender.com'
const FeedbackPage = () => {
  const [entries, setEntries] = useState([]);
  const [activeNav, setActiveNav] = useState("Feedback");
  const [expandedSection, setExpandedSection] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const email = localStorage.getItem("userEmail");
        if (!email) {
          setError("No user email found in localStorage");
          return;
        }

        const res = await axios.post(url+"/api/fetchEntries", {
          email,
        });

        const entriesArray = Object.entries(res.data.entries || {}).map(
          ([key, entry]) => {
            return {
              key,
              topic: entry.topic || "Untitled Debate",
              stance: entry.stance || "Not specified",
              userrole: entry.userrole || "Not specified",
              winner: entry.winner || "Not determined",
              reason: entry.reason || "No reason provided",
              userScore: entry.aifeedback?.overall || 0,
              userFeedback: entry.aifeedback || {},
              userSummary: String(entry.summary || ""),
              userTranscript: String(entry.transcript || ""),
            };
          }
        );
        setEntries(entriesArray.reverse());
        setError(null);
      } catch (err) {
        console.error("Failed to fetch entries:", err);
        setError(err.response?.data?.error || "Failed to fetch debate entries");
        setEntries([]);
      }
    };
    fetchEntries();
  }, []);

  const handleNavClick = (label, route) => {
    setActiveNav(label);
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const toggleReadMore = (idx, type) => {
    setExpandedSection((prev) => ({
      ...prev,
      [type + idx]: !prev[type + idx],
    }));
  };

  const trimText = (text, lines = 2, maxWords = 50) => {
    const splitBySentence = String(text).split(/(?<=[.?!])\s+/);
    if (splitBySentence.length > lines) {
      return [
        splitBySentence.slice(0, lines).join(" "),
        splitBySentence.slice(lines).join(" "),
      ];
    }
    const words = String(text).split(/\s+/).filter(Boolean);
    if (words.length > maxWords) {
      return [
        words.slice(0, maxWords).join(" "),
        words.slice(maxWords).join(" "),
      ];
    }
    return [String(text), ""];
  };

  const formatSummaryLines = (text) => {
    return String(text)
      .split(/[-\n]+/)
      .filter(Boolean)
      .map((line) =>
        `• ${line.replace(/\*\*(.*?)\*\*/g, "$1").trim().replace(/[.,]*$/, "")}.`
      );
  };

  return (
    <div className="feedback-page">
      <div className="app-container dark-purple-theme">
        <aside className="sidebar">
          <div className="sidebar-header">
            <h1 className="app-title">
              <span className="title-debate">Debattlex</span>
            </h1>
          </div>

          <nav className="sidebar-nav">
            {["Overview","Ranking", "feedbackpage"].map((label) => (
              <button
                key={label}
                className={`nav-item ${activeNav === label ? "active" : ""}`}
                onClick={() =>
                  handleNavClick(
                    label,
                    `/overview${label === "Overview" ? "" : `/${label.toLowerCase()}`}`
                  )
                }
              >
                {label}
              </button>
            ))}
          </nav>

          <button className="logout-btn" onClick={handleLogout}>
            Logout
          </button>
        </aside>

        <main className="main-content">
          <div className="feedback-container">
            <h2 className="feedback-heading">Debate Feedback</h2>

            {error && (
              <p className="error-message" style={{ color: "red" }}>
                {error}
              </p>
            )}

            {entries.length === 0 && !error ? (
              <p className="no-feedback">No feedback available yet.</p>
            ) : (
              <div className="feedback-list">
                {entries.map((entry, idx) => (
                  <div className="feedback-card" key={entry.key}>
                    <h3 className="debate-topic">{entry.topic}</h3>

                    <div className="feedback-grid">
                      <div>
                        <strong>Stance:</strong> {entry.stance}
                      </div>
                      <div>
                        <strong>Role:</strong> {entry.userrole}
                      </div>
                      <div>
                        <strong>Winner:</strong> {entry.winner}
                      </div>
                      <div>
                        <strong>Your Score:</strong> {entry.userScore}
                      </div>
                    </div>

                    {entry.reason && entry.reason !== "No reason provided" && (
                      <p>
                        <strong>
                          {entry.winner.toLowerCase() === entry.stance.toLowerCase()
                            ? "Reason for Winning"
                            : "Reason for Losing"}
                        </strong>
                        :{" "}
                        {(() => {
                          const [first, rest] = trimText(entry.reason);
                          return (
                            <>
                              {first}
                              {rest && !expandedSection[`reason${idx}`] && "..."}
                              {rest && (
                                <button
                                  className="read-more-btn"
                                  onClick={() => toggleReadMore(idx, "reason")}
                                >
                                  {expandedSection[`reason${idx}`]
                                    ? " Read Less"
                                    : " Read More"}
                                </button>
                              )}
                              {expandedSection[`reason${idx}`] && <span> {rest}</span>}
                            </>
                          );
                        })()}
                      </p>
                    )}

                    <div className="feedback-content-wrapper">
                      <div className="feedback-left-content">
                        <div className="summary-section">
                          <div className="summary-item">
                            <p>
                              <strong>Your Summary:</strong>
                            </p>
                            <div className="summary-content">
                              {(() => {
                                const lines = formatSummaryLines(entry.userSummary);
                                const first = lines.slice(0, 1); // Show only the first point
                                const rest = lines.slice(1); // Hide remaining points
                                return (
                                  <>
                                    {first.length > 0 ? (
                                      first.map((line, i) => (
                                        <p key={i}>{line}</p>
                                      ))
                                    ) : (
                                      <p>No summary available.</p>
                                    )}
                                    {expandedSection[`userSum${idx}`] &&
                                      rest.map((line, i) => <p key={i + 1}>{line}</p>)}
                                  </>
                                );
                              })()}
                              {(() => {
                                const lines = formatSummaryLines(entry.userSummary);
                                const rest = lines.slice(1); // Check if there are more than one point
                                if (rest.length > 0) {
                                  return (
                                    <button
                                      className="read-more-btn"
                                      onClick={() => toggleReadMore(idx, "userSum")}
                                    >
                                      {expandedSection[`userSum${idx}`] ? "Read Less" : "Read More"}
                                    </button>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                          </div>

                          <div className="summary-item">
                            <p>
                              <strong>Your Transcript:</strong>
                            </p>
                            <div className="summary-content">
                              <div className="transcript-text">
                                {(() => {
                                  const fullText = String(entry.userTranscript || "");
                                  if (!fullText.trim()) return <p>No transcript available.</p>;
                                  const [first, rest] = trimText(fullText);
                                  return (
                                    <>
                                      <p>{first}{rest && !expandedSection[`userTrans${idx}`] && "..."}</p>
                                      {expandedSection[`userTrans${idx}`] && rest && <p>{rest}</p>}
                                    </>
                                  );
                                })()}
                              </div>
                              {(() => {
                                const fullText = String(entry.userTranscript || "");
                                const [, rest] = trimText(fullText);
                                return rest ? (
                                  <button
                                    className="read-more-btn"
                                    onClick={() => toggleReadMore(idx, "userTrans")}
                                  >
                                    {expandedSection[`userTrans${idx}`] ? "Read Less" : "Read More"}
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          </div>

                          <div className="summary-item">
                            <p>
                              <strong>Your Feedback:</strong>
                            </p>
                            <div className="summary-content">
                              <div className="transcript-text">
                                {(() => {
                                  const fullText = String(entry.userFeedback.feedbackText || "");
                                  if (!fullText.trim()) return <p>No feedback available.</p>;
                                  const [first, rest] = trimText(fullText);
                                  return (
                                    <>
                                      <p>{first}{rest && !expandedSection[`userFeedback${idx}`] && "..."}</p>
                                      {expandedSection[`userFeedback${idx}`] && rest && <p>{rest}</p>}
                                    </>
                                  );
                                })()}
                              </div>
                              {(() => {
                                const fullText = String(entry.userFeedback.feedbackText || "");
                                const [, rest] = trimText(fullText);
                                return rest ? (
                                  <button
                                    className="read-more-btn"
                                    onClick={() => toggleReadMore(idx, "userFeedback")}
                                  >
                                    {expandedSection[`userFeedback${idx}`] ? "Read Less" : "Read More"}
                                  </button>
                                ) : null;
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="feedback-right-content">
                        {entry.userFeedback && Object.keys(entry.userFeedback).some(
                          (k) => typeof entry.userFeedback[k] === "number"
                        ) && (
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height={300}>
                              <RadarChart
                                cx="50%"
                                cy="50%"
                                outerRadius="80%"
                                data={Object.keys(entry.userFeedback)
                                  .filter((k) => typeof entry.userFeedback[k] === "number")
                                  .map((k) => ({ subject: k, A: entry.userFeedback[k] }))}
                              >
                                <PolarGrid />
                                <PolarAngleAxis dataKey="subject" stroke="#d8b4fe" />
                                <PolarRadiusAxis stroke="#a78bfa" />
                                <Radar
                                  name="User"
                                  dataKey="A"
                                  stroke="#a855f7"
                                  fill="#a855f7"
                                  fillOpacity={0.6}
                                />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default FeedbackPage;
