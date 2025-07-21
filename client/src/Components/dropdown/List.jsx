import React, { useState, useEffect } from "react";
import Stepper, { Step } from "../React_bits/Card/Stepper";
import axios from "axios";
import "./List.css";
import { useNavigate } from "react-router-dom";
import ProfileCard from "../React_bits/ProfileCard/ProfileCard";
const url = 'https://debattlex.onrender.com'
function List({ onStepperComplete }) {
  const [type, setType] = useState("");
  const [topic, setTopic] = useState("");
  const [debateType, setDebateType] = useState(""); // NEW
  const [stance, setStance] = useState("");
  const [userrole, setRole] = useState(""); // NEW
  const [email, setEmail] = useState("");
  const [loadingTopic, setLoadingTopic] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("userEmail");
    if (!storedEmail) {
      alert("User email not found. Please log in again.");
      navigate("/login");
    } else {
      setEmail(storedEmail);
    }
  }, [navigate]);

  const generateTopic = async () => {
    if (!topic.trim()) {
      alert("Type at least a keyword for your interest first.");
      return;
    }

    setLoadingTopic(true);
    try {
      const res = await fetch(url+"/api/generate-debate-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interest: topic }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Unknown error");
      setTopic(data.generatedTopic);
    } catch (err) {
      console.error("Error generating topic:", err);
      alert("Could not generate topic. Try again.");
    } finally {
      setLoadingTopic(false);
    }
  };
const handleFinalSubmit = async () => {
  let finalRole = userrole;

  if (debateType === '1v1') {
    if (stance === 'proposition') {
      finalRole = 'pm';
    } else if (stance === 'opposition') {
      finalRole = 'lo';
    }
  }

  if (!type || !topic || !debateType || !stance || !finalRole) {
    alert("Please complete all fields before proceeding.");
    return;
  }

  const entry = { type, topic, debateType, stance, userrole: finalRole };
  const key = `entry-${Date.now()}`;
  console.log(entry);

  try {
    const res = await axios.post(url+"/api/userdata", {
      email,
      entry,
    });

    if (onStepperComplete) onStepperComplete();
    if(debateType==='1v1'){
    navigate("/arina");
    }else if (debateType === '3v3'){
      navigate("/caseprep")
    }
  } catch (err) {
    console.error("Error saving stepper data:", err.response?.data || err.message);
    alert("Something went wrong while saving your data.");
  }
};


  const getRoles = () => {
    if (stance === "proposition") {
      return ["pm", "dpm", "gw"];
    } else if (stance === "opposition") {
      return ["lo", "dlo", "ow"];
    }
    return [];
  };

  return (
    <div className="main-box">
      <Stepper
        initialStep={1}
        onStepChange={(step) => {
          if (step === 2 && !type) {
            alert("Please select participant type.");
            return false;
          }
          if (step === 3 && !topic) {
            alert("Please enter a debate topic or generate one.");
            return false;
          }
          if (step === 4 && !debateType) {
            alert("Please select debate type.");
            return false;
          }
          if (step === 5 && !stance) {
            alert("Please select your stance.");
            return false;
          }
          return true;
        }}
        onFinalStepCompleted={handleFinalSubmit}
        backButtonText="Previous"
        nextButtonText="Next"
      >
        {/* Step 1: Participant Type */}
        <Step>
          <h2 style={{ fontStyle: "italic", fontVariant: "small-caps", fontSize: "2em" }}>
            Participant Type
          </h2> 
          <div style={{ display: "flex", gap: "5%", marginTop: "20px" }}>
            {["beginner", "intermediate", "advanced"].map((level) => (
              <div
                key={level}
                onClick={() => setType(level)}
                style={{
                  cursor: "pointer",
                  border: type === level ? "3px solid #FFFFFF" : "2px solid transparent",
                  borderRadius: "2em",
                  padding: "4px",
                  transition: "all 0.3s ease",
                }}
              >
                <ProfileCard
                  name={level.charAt(0).toUpperCase() + level.slice(1)}
                  title={
                    level === "beginner"
                      ? "Learner Debater"
                      : level === "intermediate"
                      ? "Confident Debater"
                      : "Master Debater"
                  }
                  handle={
                    level === "beginner"
                      ? "basic_speaker"
                      : level === "intermediate"
                      ? "moderate_speaker"
                      : "pro_speaker"
                  }
                  status={type === level ? "Selected" : "Click to Select"}
                  contactText={`Choose ${level}`}
                  avatarUrl="beginner.png"
                  showUserInfo={false}
                  enableTilt={true}
                  onContactClick={() => setType(level)}
                />
              </div>
            ))}
          </div>
        </Step>

        {/* Step 2: Debate Topic */}
        <Step>
          <h2 style={{ fontStyle: "italic", fontVariant: "small-caps", fontSize: "2em" }}>
            Debate Topic
          </h2>
          <div style={{ display: "flex", gap: "40px", marginTop: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: "250px" }}>
              <input
                type="text"
                placeholder="Enter your interest"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "1em",
                  borderRadius: "8px",
                  border: "1px solid #ccc",
                  backgroundColor: "#f7f7f7",
                }}
              />
              <button
                type="button"
                onClick={generateTopic}
                disabled={loadingTopic}
                style={{
                  marginTop: "10px",
                  padding: "8px 16px",
                  backgroundColor: "#5a28fb",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                {loadingTopic ? "Generating..." : "Generate with AI"}
              </button>
            </div>
            <div
              style={{
                flex: 1,
                minWidth: "250px",
                backgroundColor: "#1e1e1e",
                color: "#e0e0e0",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.3)",
                fontSize: "1.1em",
                fontStyle: "italic",
              }}
            >
              <strong style={{ color: "#9c9cfa", fontVariant: "small-caps" }}>Generated Topic:</strong>
              <div style={{ marginTop: "10px" }}>
                {topic ? topic : <span style={{ color: "#888" }}>No topic generated yet</span>}
              </div>
            </div>
          </div>
        </Step>

        {/* Step 3: Debate Type */}
        <Step>
          <h2 style={{ fontStyle: "italic", fontVariant: "small-caps", fontSize: "2em" }}>
            Select Debate Type
          </h2>
          <div style={{ display: "flex", gap: "40px", justifyContent: "center", marginTop: "20px" }}>
            {["1v1", "3v3"].map((dt) => (
              <label
                key={dt}
                style={{
                  position: "relative",
                  paddingLeft: "32px",
                  fontSize: "1.2em",
                  cursor: "pointer",
                  userSelect: "none",
                  color: "#e0e0e0",
                  fontStyle: "italic",
                  fontVariant: "small-caps",
                  fontWeight: "bold",
                }}
              >
                <input
                  type="radio"
                  name="debateType"
                  value={dt}
                  checked={debateType === dt}
                  onChange={(e) => setDebateType(e.target.value)}
                  required
                  style={{ opacity: 0, position: "absolute", left: 0, top: "2px" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "3px",
                    height: "18px",
                    width: "18px",
                    backgroundColor: "white",
                    border: `2px solid ${debateType === dt ? "#5a28fb" : "#999"}`,
                    borderRadius: "50%",
                    transition: "all 0.3s ease",
                  }}
                >
                  {debateType === dt && (
                    <span
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#5a28fb",
                        borderRadius: "50%",
                      }}
                    ></span>
                  )}
                </span>
                {dt}
              </label>
            ))}
          </div>
        </Step>

        {/* Step 4: Stance Selection */}
        <Step>
          <h2 style={{ fontStyle: "italic", fontVariant: "small-caps", fontSize: "2em" }}>
            Select your stance
          </h2>
          <div style={{ display: "flex", gap: "40px", justifyContent: "center", marginTop: "20px" }}>
            {["proposition", "opposition"].map((s) => (
              <label
                key={s}
                style={{
                  position: "relative",
                  paddingLeft: "32px",
                  fontSize: "1.2em",
                  cursor: "pointer",
                  userSelect: "none",
                  color: "#e0e0e0",
                  fontStyle: "italic",
                  fontVariant: "small-caps",
                  fontWeight: "bold",
                }}
              >
                <input
                  type="radio"
                  name="stance"
                  value={s}
                  checked={stance === s}
                  onChange={(e) => setStance(e.target.value)}
                  required
                  style={{ opacity: 0, position: "absolute", left: 0, top: "2px" }}
                />
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "3px",
                    height: "18px",
                    width: "18px",
                    backgroundColor: "white",
                    border: `2px solid ${stance === s ? "#5a28fb" : "#999"}`,
                    borderRadius: "50%",
                    transition: "all 0.3s ease",
                  }}
                >
                  {stance === s && (
                    <span
                      style={{
                        position: "absolute",
                        top: "4px",
                        left: "4px",
                        width: "8px",
                        height: "8px",
                        backgroundColor: "#5a28fb",
                        borderRadius: "50%",
                      }}
                    ></span>
                  )}
                </span>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </label>
            ))}
          </div>
        </Step>

        {/* Step 5 (Conditional): Role Selection */}
        {debateType === "3v3" && (
          <Step>
            <h2 style={{ fontStyle: "italic", fontVariant: "small-caps", fontSize: "2em" }}>
              Select your role in {stance === "proposition" ? "Proposition" : "Opposition"}
            </h2>
            <div style={{ display: "flex", gap: "30px", justifyContent: "center", marginTop: "20px", flexWrap: "wrap" }}>
              {getRoles().map((r) => (
                <label
                  key={r}
                  style={{
                    position: "relative",
                    paddingLeft: "32px",
                    fontSize: "1.2em",
                    cursor: "pointer",
                    userSelect: "none",
                    color: "#e0e0e0",
                    fontStyle: "italic",
                    fontVariant: "small-caps",
                    fontWeight: "bold",
                  }}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={userrole === r}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    style={{ opacity: 0, position: "absolute", left: 0, top: "2px" }}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      top: "3px",
                      height: "18px",
                      width: "18px",
                      backgroundColor: "white",
                      border: `2px solid ${userrole === r ? "#5a28fb" : "#999"}`,
                      borderRadius: "50%",
                      transition: "all 0.3s ease",
                    }}
                  >
                    {userrole === r && (
                      <span
                        style={{
                          position: "absolute",
                          top: "4px",
                          left: "4px",
                          width: "8px",
                          height: "8px",
                          backgroundColor: "#5a28fb",
                          borderRadius: "50%",
                        }}
                      ></span>
                    )}
                  </span>
                  {r}
                </label>
              ))}
            </div>
          </Step>
        )}
      </Stepper>
    </div>
  );
}

export default List;
