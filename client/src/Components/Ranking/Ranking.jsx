import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ranking.css";
import "../Dashboard/my_debate/FeedbackPage.css"; // Import shared styles if needed for sidebar

const url = 'https://debattlex.onrender.com';

const Ranking = () => {
  const [rankings, setRankings] = useState([]);
  const [activeNav, setActiveNav] = useState("Ranking");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await axios.get(url + "/api/rankings");
        setRankings(res.data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch rankings:", err);
        setError(err.response?.data?.error || "Failed to fetch rankings");
        setRankings([]);
      }
    };
    fetchRankings();
  }, []);

  const handleNavClick = (label, route) => {
    setActiveNav(label);
    navigate(route);
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  const getPodiumOrder = (rankings) => {
    if (rankings.length < 3) return rankings;
    // Reorder for podium display: 2nd, 1st, 3rd
    return [rankings[1], rankings[0], rankings[2]];
  };

  const getRankIcon = (index) => {
    if (index === 0) return '👑';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '🔥';
  };

  const getPodiumClass = (originalIndex) => {
    if (originalIndex === 0) return 'first';
    if (originalIndex === 1) return 'second';
    if (originalIndex === 2) return 'third';
    return '';
  };

  return (
    <div className="ranking-page">
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
                    label === "Overview" ? "/overview" : `/overview/${label.toLowerCase()}`
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
          <div className="ranking-container">
            <h2 className="ranking-heading">Global Debate Rankings</h2>

            {error && (
              <p className="error-message" style={{ color: "red" }}>
                {error}
              </p>
            )}

            {rankings.length === 0 && !error ? (
              <p className="no-rankings">No rankings available yet.</p>
            ) : (
              <>
                {/* Podium for top 3 */}
                {rankings.length >= 3 && (
                  <div className="podium-container">
                    {getPodiumOrder(rankings).map((user, displayIndex) => {
                      const originalIndex = displayIndex === 1 ? 0 : displayIndex === 0 ? 1 : 2;
                      return (
                        <div key={originalIndex} className={`podium-user ${getPodiumClass(originalIndex)}`}>
                          <div className="podium-card">
                            <div className="podium-icon">
                              {getRankIcon(originalIndex)}
                            </div>
                            <div className="podium-rank">
                              #{originalIndex + 1}
                            </div>
                            <div className="podium-name">
                              {user.displayName}
                            </div>
                            <div className="podium-stats">
                              Wins: {user.wins}
                            </div>
                            <div className="podium-stats">
                              Rate: {user.winRate}%
                            </div>
                          </div>
                          <div className={`podium-base ${getPodiumClass(originalIndex)}`}>
                            #{originalIndex + 1}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Other Rankings */}
                {rankings.length > 3 && (
                  <div className="other-rankings">
                    <div className="other-rankings-header">
                      <span className="other-rankings-icon">🔥</span>
                      <h2 className="other-rankings-title">Other Rankings</h2>
                    </div>
                    
                    <div className="rankings-list">
                      {rankings.slice(3).map((user, index) => (
                        <div key={index + 3} className="ranking-item">
                          <div className="ranking-item-left">
                            <div className="ranking-number">
                              #{index + 4}
                            </div>
                            <div className="ranking-user-info">
                              <div className="ranking-username">
                                {user.displayName}
                              </div>
                              <div className="ranking-user-stats">
                                {user.wins} wins • {user.winRate}% rate
                              </div>
                            </div>
                          </div>
                          
                          <div className="ranking-winrate">
                            {user.winRate}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Ranking;