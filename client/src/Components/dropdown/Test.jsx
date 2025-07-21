import React from 'react';

function Test({ onBackToList }) {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Component</h1>
      <div>Hello this is working</div>
      <p>Welcome to the Test page! The stepper has been completed successfully.</p>
      
      <div style={{ marginTop: '20px' }}>
        <p>This is your new component that loads after completing the stepper.</p>
        
        {/* Optional: Add a button to go back to the stepper */}
        {onBackToList && (
          <button 
            onClick={onBackToList}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '20px'
            }}
          >
            Back to Stepper
          </button>
        )}
      </div>
    </div>
  );
}

export default Test;