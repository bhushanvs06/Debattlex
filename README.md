# 🧠 Debattlex - Real-Time AI Debate Platform

Debattlex is a real-time AI-powered debate platform where users can engage in structured debates with AI or other users in formats like 1v1, 3v3, and 5v5. The platform is designed to improve communication, critical thinking, and argumentation through live speech, summaries, role-based preparation, and AI feedback.

## 🚀 Live Demo

🔗 [Click here to try Debattlex](https://debattlexfrontend.onrender.com/)  

 
**Login Credentials**:  
- 📧 **Email**: `aniketsonone2908@gmail.com`  
- 🔒 **Password**: `12345678`  

## 🔥 Features

- 🎤 **Real-time Speech Recognition**: Live voice-to-text for user inputs.
- 🤖 **AI Speakers & Summarization**: AI-generated speeches with live summaries.
- 🧑‍⚖️ **Role-based Format**: Supports PM, LO, DPM, DLO, GW, OW roles in AP format.
- 💡 **Case Preparation**: Collaborate with AI to prepare points per role.
- 📦 **MongoDB Storage**: Stores transcripts, summaries, and prep points by topic, stance, and role.
- ⚖️ **AI Judge Feedback**: Automatic judgment based on arguments and structure.
- 🧑‍🤝‍🧑 **Modes**: Beginner (AI makes errors), Intermediate, Advance.

---


## 📁 Project Structure

```bash
Debattlex/
└── client/
    ├── public/
    ├── src/
    │   └── Components/
    │       ├── Aijudge/        # AI-generated judge feedback module
    │       ├── Arina/          # Arina 3v3 debate UI component
    │       ├── Caseprep/       # Case preparation with AI
    │       ├── Dashboard/      # User dashboard & team views
    │       ├── React_bits/     # Reusable components (buttons, cards, etc.)
    │       ├── dropdown/       # UI dropdowns for topics, roles, stance
    │       └── login/          # Login, Signup,
    ├── package.json
    └── package-lock.json
```
---

## 🌟 Core Features

### 🎤 1. Real-Time Debate System
- Live debate structure following **Asian Parliamentary (AP)** format.
- Speaker roles: PM, LO, DPM, DLO, GW, OW.
- 1v1 and 3v3 visual layout with mic access, timers, and speaker transitions.
- Google Meet-like **Arina3v3 UI** with active speaker center focus.

### 🤖 2. AI Speakers & Summaries
- AI plays the role of a debate speaker based on topic, stance, and role.
- Real-time summarization of every speech in **bullet points**.

### 📝 3. Transcript + Summary Saving
- Every user's and AI's speech is:
  - Transcribed live
  - Summarized in real time
  - Stored in MongoDB under topic and role

### 💼 4. Case Preparation with AI
- New “Case Prep” feature lets users:
  - Collaborate with AI to build arguments
  - Get role-specific suggestions before a debate
  - Save `prepPoints` by topic, stance, and speaker role

## 🧰 Technologies Used

### 💻 Frontend
- **React.js** – UI library for building interactive components
- **React Router DOM** – Navigation and routing between pages
- **Axios** – HTTP client for making API requests
- **Web Speech API** – Live speech-to-text for voice input

### 🧪 Backend
- **Node.js** – JavaScript runtime for the server
- **Express.js** – Fast and flexible backend framework
- **Mongoose** – MongoDB ODM for modeling schema and queries

### 🗄️ Database
- **MongoDB Atlas** – Cloud-hosted NoSQL database for:
  - User entries
  - Role-based transcripts and summaries
  - AI-generated prep points
  - Judge feedback

### 🤖 AI & Voice Integration
- **Sarvam AI** – Custom AI speech and feedback generation
- **Text-to-Speech (TTS)** – AI voice playback for generated content
- **Speech-to-Text (STT)** – Real-time transcription from mic input

### 🌍 Hosting & DevOps
- **Render.com** – Full-stack cloud deployment (frontend & backend)
- **Git & GitHub** – Version control and collaboration
- **dotenv (.env)** – For managing environment variables securely



### 🧠 5. AI Judge Feedback
- After debate ends, AI judges:
  - Analyze strength, relevance, rebuttals, and flow
  - Give **role-specific feedback** for each team member
  - Share improvement tips
