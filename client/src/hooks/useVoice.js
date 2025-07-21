// src/hooks/useVoice.js
import { useEffect, useRef, useState } from "react";

const useVoice = () => {
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const res = event.results[i];
        if (res.isFinal) {
          setTranscript((prev) => prev + " " + res[0].transcript);
        } else {
          interim += res[0].transcript;
        }
      }
    };

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
  }, []);

  const listen = () => {
    recognitionRef.current?.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
  };

  return { transcript, listening, listen, stopListening };
};

export default useVoice;
