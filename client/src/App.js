import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import LoginPage from './Components/login/Login';
import List from './Components/dropdown/List';
import Dashboard from './Components/Dashboard/Dash';
import Api from './Components/apitest'
import Arina from './Components/Arina/arina'
import MyDebates  from "./Components/Dashboard/my_debate/MyDebates.jsx"; 
import FeedbackPage from './Components/Dashboard/my_debate/Feedback.jsx';
import AIJudge from './Components/Aijudge/Aijudge.jsx'
import TalkingAvatar from './Components/Arina/avatar/TalkingAvatar.jsx'
import DebateRoom from './Components/Arina/arina3v3.jsx'
import DebatePrep1 from './Components/Caseprep/DebatePrep1.jsx'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("userEmail"));
  const [showStepper, setShowStepper] = useState(true);
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    localStorage.setItem("userEmail", user.email);
    setIsLoggedIn(true);
    navigate("/overview");
  };

  const handleStepperComplete = () => {
    setShowStepper(false);
    navigate("/");
  };

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <div className="App">
      
      <nav >
        <Link to="/overview" ></Link>
        <Link to="/list"></Link>
        <Link to="/login"></Link>
        <Link to='/dashboard'></Link>
        <Link to='arina'></Link>
        <Link to='api'></Link>
        <Link to='my-debates'></Link>
        <Link to='feedbackpage'></Link>
        <Link to='/'></Link>
        <Link to='/aijudge'></Link>
        <Link to='talkai'></Link>
        <Link to="arina3v3"></Link>
        <Link to="caseprep"></Link>

      </nav>

 <Routes>
        <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
          path="/overview"
          element={
            isLoggedIn ? <Dashboard /> : <Navigate to="/login" />
          }
        />
        
        <Route
          path="/list"
          element={
            isLoggedIn ? <List /> : <Navigate to="/login" />
          }
        />
        <Route
           path="/arina"
           element={
            isLoggedIn ? <Arina /> : <Navigate to="/login"/>}/>
        <Route
           path="/api"
           element={
            isLoggedIn ? <Api /> : <Navigate to="/login" />}/>
        <Route
           path="overview/my-debates"
           element={
            isLoggedIn ? <MyDebates /> : <Navigate to="/login" />}/>
        <Route
           path="/aijudge"
           element={
            isLoggedIn ? <AIJudge /> : <Navigate to="/login" />}/>  
            <Route
          path="/login"
          element={<LoginPage onLoginSuccess={handleLoginSuccess} />}
        />
        <Route
           path="/talkai"
           element={
            isLoggedIn ? <TalkingAvatar textToSpeak="That’s a very interesting argument you made. Let me explain..." />
 : <Navigate to="/login" />}/>  
            <Route
          path="/login"
          element={< TalkingAvatar/>}
        />
        <Route
          path="overview/feedbackpage"
          element={
            isLoggedIn ? <FeedbackPage /> : <Navigate to="/login" />
          }
        /> 
         <Route
          path="arina3v3"
          element={
            isLoggedIn ? <DebateRoom /> : <Navigate to="/login" />
          }
        />    
        <Route
          path="caseprep"
          element={
            isLoggedIn ? <DebatePrep1 /> : <Navigate to="/login" />
          }
        />         

      </Routes>
  

      
    </div>
  );
}

export default App;
