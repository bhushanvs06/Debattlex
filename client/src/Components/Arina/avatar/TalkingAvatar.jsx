import React, { useEffect, useRef, useState } from "react";
import "./TalkingAvatar.css";

const TalkingAvatar = ({ textToSpeak }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    if (textToSpeak) {
      speakText(textToSpeak);
    }
  }, [textToSpeak]);
let text = 'hello bhushan you are great'
  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = "en-US";

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    synthRef.current.speak(utterance);
  };

  return (
    <div className={`avatar ${isSpeaking ? "speaking" : ""}`}>
      <div className="head">
        <div className="eyes">
          <div className="eye left"></div>
          <div className="eye right"></div>
        </div>
        <div className={`mouth ${isSpeaking ? "talking" : ""}`}></div>
      </div>
    </div>
  );
};

export default TalkingAvatar;
