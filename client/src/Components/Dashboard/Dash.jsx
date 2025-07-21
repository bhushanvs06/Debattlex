import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as AreaTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, PolarGrid, PolarAngleAxis, RadarChart, Radar, Legend, PieChart, Pie
} from 'recharts';
import './Dashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Debate = () => {
  const [activeNav, setActiveNav] = useState('Overview');
  const [data, setData] = useState([]);
  const [userData, setUserData] = useState(null);
  const email = localStorage.getItem("userEmail");
  const navigate = useNavigate();
  const url = 'https://debattlex.onrender.com'
  useEffect(() => {
    if (!email) {
      alert("User not logged in");
      navigate("/login");
      return;
    }

    axios.post(url+"/api/fetchEntries", { email })
      .then((res) => {
        const entriesObj = res.data.entries;
        const entriesArray = Object.entries(entriesObj).map(([topicKey, entryData]) => {
          const topic = topicKey.toLowerCase();
          let category = 'Other';
          if (topic.includes("climate") || topic.includes("pollution") || topic.includes("environment")) category = 'Environment';
          else if (topic.includes("education") || topic.includes("school") || topic.includes("university")) category = 'Education';
          else if (topic.includes("technology") || topic.includes("ai") || topic.includes("machine")) category = 'Technology';
          else if (topic.includes("economy") || topic.includes("poverty") || topic.includes("jobs")) category = 'Economics';
          else if (topic.includes("spiritual") || topic.includes("religion") || topic.includes("faith")) category = 'Spirituality';
          else if (topic.includes("social") || topic.includes("rights") || topic.includes("gender")) category = 'Social Issues';

          return {
            ...entryData,
            topicKey,
            topicCategory: category,
            topic: topicKey.replace(/_/g, ' ')
          };
        });

        setData(entriesArray);

        if (entriesArray.length === 0) return;

let wins = 0;

entriesArray.forEach(entry => {
  const stance = entry.stance?.toLowerCase();
  const winner = entry.winner?.toLowerCase() || entry.aiJudgeFeedback?.winner?.toLowerCase();
  console.log("🧠 stance:", stance, "| winner:", winner);
  if (stance && winner && stance === winner) {
    wins++;
  }
});





      setUserData({
  name: res.data.displayName || 'User',
  avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
  level: entriesArray[0].type || 'Beginner',
  totalDebates: entriesArray.length,
  winRate: Math.round((wins / entriesArray.length) * 100),
  currentStreak: 0
});


      })
      .catch((err) => console.error("Error fetching entries:", err));
  }, [email, navigate]);

  

  const categoryColors = {
    Environment: '#34d399',
    Education: '#60a5fa',
    Technology: '#a78bfa',
    Economics: '#fbbf24',
    Spirituality: '#c084fc',
    'Social Issues': '#f87171',
    Other: '#d1d5db'
  };

  const topicCounts = {};
  data.forEach((entry) => {
    const category = entry.topicCategory || 'Other';
    topicCounts[category] = (topicCounts[category] || 0) + 1;
  });
  const topicData = Object.entries(topicCounts).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#ccc'
  }));

const performanceData = data.map((entry, index) => {
  const userRole = entry.userrole?.toLowerCase();
  const winner = entry.aiJudgeFeedback?.winner?.toLowerCase();

  const userStance = ['pm', 'dpm', 'gw'].includes(userRole) ? 'proposition' : 'opposition';
  const userWon = userStance === winner;

  return {
    name: `Debate ${index + 1}`,
    win: userWon ? 1 : 0,
    loss: userWon ? 0 : 1
  };
});



  const skills = [
  'logic', 'clarity', 'relevance', 'persuasiveness', 'depth',
  'evidenceUsage', 'emotionalAppeal', 'rebuttalStrength', 'structure'
];

const extractUserRoleFeedbacks = (entries) => {
  let feedbacks = [];

  entries.forEach(entry => {
    const role = entry.userrole?.toLowerCase();
    const side = entry.stance?.toLowerCase(); // 'proposition' or 'opposition'

    const roleFeedback = entry?.[side]?.[role]?.aifeedback;
    if (roleFeedback) feedbacks.push(roleFeedback);
  });

  return feedbacks;
};

const roleFeedbacks = extractUserRoleFeedbacks(data);

const skillAverages = skills.map(skill => {
  const values = roleFeedbacks.map(fb => fb[skill] || 0);
  const avg = values.length ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1) : 0;
  return {
    subject: skill.charAt(0).toUpperCase() + skill.slice(1),
    A: parseFloat(avg),
    fullMark: 10
  };
});


  const navigationItems = ['Overview', 'Feedbackpage'];

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  if (!userData) {
    return <div className="loading-screen">Loading user data...</div>;
  }

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
          {navigationItems.map(item => (
            <button
              key={item}
              className={`nav-item ${activeNav === item ? 'active' : ''}`}
              onClick={() => {
                setActiveNav(item);
                navigate(item.toLowerCase().replace(/ /g, '-'));
              }}
            >
              {item}
            </button>
          ))}
        </nav>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>

      <div className="main-content">
        <div className="debate-dashboard">
          <div className="dashboard-header">
            <div className="user-profile">
              <div className="avatar-container">
                <img src={userData.avatar} alt="User Avatar" className="user-avatar" />
                <div className="level-badge">{userData.level}</div>
              </div>
              <div className="user-info">
                <h1 className="user-name">{userData.name}</h1>
                <div className="quick-stats">
                  <div className="stat-item">
                    <span className="stat-number">{userData.totalDebates}</span>
                    <span className="stat-label">Total Debates</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userData.winRate}%</span>
                    <span className="stat-label">Win Rate</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-number">{userData.currentStreak}</span>
                    <span className="stat-label">Current Streak</span>
                  </div>
                </div>
              </div>
            </div>
            <button className="start-debate-btn" onClick={() => navigate("/list")}>⚡ Start New Debate</button>
          </div>

          <div className="stats-grid">
            <div className="chart-container">
              <h3 className="chart-title">Win/Loss Performance</h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={performanceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <AreaTooltip />
                  <Area type="monotone" dataKey="win" stackId="1" stroke="#10b981" fill="#34d399" />
                  <Area type="monotone" dataKey="loss" stackId="1" stroke="#ef4444" fill="#f87171" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Debate Topics by Category</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topicData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    nameKey="name"
                  >
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="legend">
                {topicData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="chart-container">
              <h3 className="chart-title">Skill Scores</h3>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart outerRadius={90} data={skillAverages}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" />
                  <Radar name="User" dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-container activity-feed">
              <h3 className="chart-title">Recent Activity</h3>
              <div className="activity-list">
                {data.slice(0, 4).map((entry, idx) => (
                  <div className="activity-item" key={idx}>
                    <div className={`activity-icon ${entry.aiJudgeFeedback?.winner === "User" ? 'win' : 'loss'}`}> 
                      {entry.aiJudgeFeedback?.winner === "User" ? 'W' : 'L'}
                    </div>
                    <div className="activity-details">
                      <span className="activity-title">
                        {entry.aiJudgeFeedback?.winner === "User" ? 'Won' : 'Lost'} debate on "{entry.topic}"
                      </span>
                      <span className="activity-time">Just now</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};

export default Debate;