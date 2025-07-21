import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import Lottie from 'lottie-react';
import Confetti from 'react-confetti';
import cryAnimation from './cry.json';

import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);
const url = 'https://debattlex.onrender.com'
const AIJudge = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [latestTopic, setLatestTopic] = useState('');
  const [latestKey, setLatestKey] = useState('');
  const [userRole, setUserRole] = useState(null);

  const email = localStorage.getItem('userEmail');

  const saveAndRetrieveJudgement = async (email, topicKey, judgeResult, userRole) => {
    try {
      const response = await axios.post(url+'/api/save-judgement', {
        email,
        topicKey,
        judgeResult,
        userRole,
      });

      if (response.status === 200) {
        const judgementData = {
          email,
          topicKey,
          judgeResult,
          userRole,
          timestamp: new Date().toISOString(),
        };
        localStorage.setItem(`judgement_${topicKey}`, JSON.stringify(judgementData));
        console.log('Saved to localStorage:', judgementData);

        const judgementKeys = Object.keys(localStorage).filter(key => key.startsWith('judgement_'));
        judgementKeys.forEach(key => {
          const data = localStorage.getItem(key);
          if (data) {
            console.log(`Retrieved judgement data for ${key}:`, JSON.parse(data));
          }
        });
      } else {
        console.error('Error saving judgement:', response.data.error);
      }
    } catch (err) {
      console.error('Error in saveAndRetrieveJudgement:', err);
    }
  };

  useEffect(() => {
    const fetchAndJudge = async () => {
      try {
        // Fetch entries
        const entryRes = await axios.post(url+'/api/fetchEntries', { email });
        const entries = entryRes.data.entries;
        console.log('Entries response:', entries);

        if (!entries || Object.keys(entries).length === 0) {
          console.error('No entries found for email:', email);
          setLoading(false);
          return;
        }

        const keys = Object.keys(entries);
        const lastKey = keys[keys.length - 1];
        const entry = entries[lastKey];
        const topic = entry.topic;

        setLatestKey(lastKey);
        setLatestTopic(topic);

        // Get userrole from entry
        let determinedUserRole = entry.userrole?.toLowerCase();
        console.log('userrole from entry:', determinedUserRole);

        if (!determinedUserRole || !['pm', 'dpm', 'gw', 'lo', 'dlo', 'ow'].includes(determinedUserRole)) {
          console.error('Invalid or missing userrole in entry:', determinedUserRole);
          setLoading(false);
          return;
        }

        setUserRole(determinedUserRole);
        console.log('Final userRole set:', determinedUserRole);

        // Fetch judgement
        const judgeRes = await axios.post(url+'/api/judge', {
          email,
          topic,
        });
        const raw = judgeRes.data.result;
        console.log('Raw judge result:', raw);

        const normalizeKeys = (obj = {}) => {
          const newObj = {};
          for (const key in obj) {
            newObj[key.toLowerCase()] = typeof obj[key] === 'number' ? obj[key] : obj[key] ?? 0;
          }
          return newObj;
        };

        const fixedResult = {
          ...raw,
          proposition: {
            pm: normalizeKeys(raw.pm || {}),
            dpm: normalizeKeys(raw.dpm || {}),
            gw: normalizeKeys(raw.gw || {}),
          },
          opposition: {
            lo: normalizeKeys(raw.lo || {}),
            dlo: normalizeKeys(raw.dlo || {}),
            ow: normalizeKeys(raw.ow || {}),
          },
          winner: raw.winner || 'Unknown',
          reason: raw.reason || 'No reason provided',
          userRole: determinedUserRole,
        };

        console.log('Fixed result:', fixedResult);
        console.log('User data for role', determinedUserRole, ':', fixedResult.proposition[determinedUserRole] || fixedResult.opposition[determinedUserRole]);
        setResult(fixedResult);

        const judgeResult = {
          winner: raw.winner,
          reason: raw.reason,
          pm: raw.pm,
          dpm: raw.dpm,
          gw: raw.gw,
          lo: raw.lo,
          dlo: raw.dlo,
          ow: raw.ow,
        };

        await saveAndRetrieveJudgement(email, lastKey, judgeResult, determinedUserRole);
      } catch (err) {
        console.error('Judging failed:', err);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (email) {
      fetchAndJudge();
    } else {
      console.error('No email found in localStorage');
      setLoading(false);
    }
  }, [email]);

  const fields = [
    { label: 'Logic', key: 'logic' },
    { label: 'Clarity', key: 'clarity' },
    { label: 'Relevance', key: 'relevance' },
    { label: 'Persuasiveness', key: 'persuasiveness' },
    { label: 'Depth', key: 'depth' },
    { label: 'Evidence Usage', key: 'evidenceusage' },
    { label: 'Emotional Appeal', key: 'emotionalappeal' },
    { label: 'Rebuttal Strength', key: 'rebuttalstrength' },
    { label: 'Structure', key: 'structure' },
    { label: 'Overall', key: 'overall' },
  ];

  const getTeamChartData = () => {
    const propRoles = ['pm', 'dpm', 'gw'];
    const oppRoles = ['lo', 'dlo', 'ow'];

    const calculateTeamAverage = (team, roles) => {
      return fields.map(field => {
        const scores = roles
          .map(role => result?.[team]?.[role]?.[field.key] ?? 0)
          .filter(score => score > 0);
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
      });
    };

    return {
      labels: fields.map(f => f.label),
      datasets: [
        {
          label: 'Proposition',
          data: calculateTeamAverage('proposition', propRoles),
          backgroundColor: '#c084fc',
          borderColor: '#a855f7',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 18,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        },
        {
          label: 'Opposition',
          data: calculateTeamAverage('opposition', oppRoles),
          backgroundColor: '#9333ea',
          borderColor: '#7e22ce',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 18,
          categoryPercentage: 0.6,
          barPercentage: 0.9,
        },
      ],
    };
  };

  const getUserChartData = () => {
    console.log('Using userRole for graph:', userRole);
    const userData = result?.proposition?.[userRole] || result?.opposition?.[userRole] || {};

    return {
      labels: fields.map(f => f.label),
      datasets: [
        {
          label: `Your Scores (${userRole?.toUpperCase() || 'Unknown'})`,
          data: fields.map(f => Number(userData[f.key]) || 0),
          backgroundColor: '#34d399',
          borderColor: '#059669',
          borderWidth: 1,
          borderRadius: 6,
          barThickness: 18,
        },
      ],
    };
  };

  const getUserFeedbackText = () => {
    console.log('Fetching feedback for userRole:', userRole);
    return result?.proposition?.[userRole]?.feedbacktext || 
           result?.opposition?.[userRole]?.feedbacktext || 
           'No feedback provided.';
  };

  const options = {
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const value = ctx.raw;
            return `${ctx.dataset.label}: ${value === 0 ? 'Undefined' : value.toFixed(1)}`;
          },
        },
        backgroundColor: '#2b1a44',
        titleColor: '#f5f3ff',
        bodyColor: '#d8b4fe',
        borderColor: '#a855f7',
        borderWidth: 1,
        cornerRadius: 8,
      },
      legend: {
        labels: {
          color: '#e9d5ff',
          font: { size: 13 },
          boxWidth: 20,
          padding: 20,
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#f5f3ff', font: { size: 12 } },
        grid: { color: '#3b0764' },
      },
      y: {
        ticks: {
          color: '#f5f3ff',
          font: { size: 12 },
          callback: function (value) {
            return value === 0 ? 'Undefined' : value;
          },
        },
        grid: { color: '#3b0764' },
        beginAtZero: true,
        max: 10,
      },
    },
    animation: {
      duration: 500,
      easing: 'easeOutQuart',
    },
  };

  const sumScores = (team) => {
    if (!result?.[team]) return 0;
    return Object.values(result[team]).reduce((sum, roleData) => {
      if (!roleData) return sum;
      const values = Object.entries(roleData)
        .filter(([k]) => k !== 'feedbacktext')
        .map(([, v]) => Number(v) || 0);
      return sum + values.reduce((a, b) => a + b, 0);
    }, 0);
  };

  const propositionScore = sumScores('proposition');
  const oppositionScore = sumScores('opposition');

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #23103c, #2b1a44)',
        minHeight: '100vh',
        color: '#f5f3ff',
        fontFamily: 'Inter, sans-serif',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <h2 style={{ fontSize: '2.5rem', color: '#c084fc', marginBottom: '1rem' }}>
        AI Debate Judge
      </h2>

      {loading ? (
        <p>Judging in progress...</p>
      ) : result ? (
        <div
          style={{
            width: '100%',
            maxWidth: '1200px',
            background: 'rgba(44, 19, 82, 0.7)',
            padding: '2rem',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(192, 132, 252, 0.18)',
          }}
        >
          <h3
            style={{
              fontSize: '1.6rem',
              color: '#facc15',
              marginBottom: '1rem',
              textAlign: 'center',
              fontWeight: 600,
            }}
          >
            Topic: "{latestTopic || 'No topic available'}"
          </h3>

          <h3
            style={{
              fontSize: '1.8rem',
              color: '#d8b4fe',
              marginBottom: '1rem',
              textAlign: 'center',
            }}
          >
            Winner: <span style={{ color: '#c084fc' }}>{result.winner}</span>
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginBottom: '1rem' }}>
            <div style={{ color: '#34d399' }}>Proposition Score: <strong>{propositionScore.toFixed(1)}</strong></div>
            <div style={{ color: '#f87171' }}>Opposition Score: <strong>{oppositionScore.toFixed(1)}</strong></div>
          </div>

          <div
            style={{
              marginTop: '2rem',
              background: '#381e61',
              padding: '1.5rem',
              borderRadius: '16px',
              color: '#f3e8ff',
              maxWidth: '1000px',
              width: '100%',
            }}
          >
            <h3 style={{ fontSize: '1.5rem', color: '#facc15', marginBottom: '1rem' }}>
              Proposition vs. Opposition Scores
            </h3>
            <div style={{ height: '300px', marginTop: '1.5rem' }}>
              <Bar data={getTeamChartData()} options={options} />
            </div>
          </div>

          <div
            style={{
              marginTop: '2rem',
              background: '#381e61',
              padding: '1.5rem',
              borderRadius: '16px',
              color: '#f3e8ff',
              maxWidth: '1000px',
              width: '100%',
            }}
          >
            <small style={{ fontSize: '0.8rem', color: '#d8b4fe', marginBottom: '0.5rem', display: 'block' }}>
              Note: If your scores are incorrect, ensure your email is assigned to the correct role (PM, DPM, GW, LO, DLO, OW) in the debate entry.
            </small>
            <h3 style={{ fontSize: '1.5rem', color: '#facc15', marginBottom: '1rem' }}>
              Your Scores (Role: {userRole?.toUpperCase() || 'Unknown'})
            </h3>
            <p style={{ marginBottom: '1rem', fontStyle: 'italic', color: '#d8b4fe' }}>
              "{getUserFeedbackText()}"
            </p>
            <div style={{ height: '300px', marginTop: '1.5rem' }}>
              <Bar data={getUserChartData()} options={options} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '6rem',
              alignItems: 'flex-start',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginTop: '2rem',
            }}
          >
            <div
              style={{
                flex: '3 1 300px',
                fontSize: '1.1rem',
                color: '#d8b4fe',
                maxWidth: '600px',
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: '#c084fc' }}>Reason:</strong> {result.reason}
            </div>
          </div>

          {result.winner === 'User' ? (
            <Confetti />
          ) : (
            <div style={{ width: 250, height: 250, margin: '2rem auto' }}>
              <Lottie animationData={cryAnimation} loop />
            </div>
          )}
        </div>
      ) : (
        <p>Failed to judge this debate.</p>
      )}

      <button
        onClick={() => window.location.href = '/overview'}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          fontSize: '1rem',
          fontWeight: 'bold',
          color: '#fff',
          backgroundColor: '#9333ea',
          border: 'none',
          borderRadius: '10px',
          cursor: 'pointer',
          transition: 'background-color 0.3s ease',
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#7e22ce'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#9333ea'}
      >
        ⬅ Return to Dashboard
      </button>
    </div>
  );
};

export default AIJudge;