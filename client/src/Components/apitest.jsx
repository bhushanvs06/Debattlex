import React, { useState } from 'react';
import axios from 'axios';

function Api() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/ask', { question });
      setAnswer(res.data.answer);
    } catch (err) {
      setAnswer('Error: Could not get response from server');
      console.error(err);
    }
  };
      
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Sarvam AI Chat</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question..."
          style={{ width: '300px', padding: '8px', marginRight: '10px' }}
        />
        <button type="submit">Ask</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <strong>Answer:</strong>
        <p>{answer}</p>
      </div>
    </div>
  );
}

export default Api;
