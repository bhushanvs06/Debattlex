## 🧪 Local Development Setup

Run Debattlex on your local machine with these steps:

---

### 🔁 1. Clone the Repository

```bash
git clone https://github.com/bhushanvs06/Debattlex.git
cd Debattlex
```
##🔐 2. Configure Server Environment

In the server folder, create a .env file and add the following:
```bash
SARVAM_API_KEY=your_sarvam_api_key_here
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions
PORT=5000
MONGO_URI=your_mongodb_connection_string
```
Make sure your backend is set to run on port 5000.
##🧭 3.  Update Frontend API URL

In the frontend code (client/src/components/) 
( Aijudge, dash, arina, arina3v3, caseprep, feedback) .jsx
, find:
```bash
const url = 'https://debattlex.onrender.com';

```
to
```bash
const url = 'http://localhost:5000';

```
This ensures the frontend talks to your local backend.

##📦 4. Install Dependencies
Backend (Node.js + Express)

```bash
cd server
npm install
```
Frontend (React)
```bash
cd client
npm install
```

##▶️ 5. Start the Development Servers
Start Backend Server
```bash
cd server
npm run dev
```

Start Frontend Client
```bash
cd client
npm start
```

##🌐 6. Access the Application
Once both client and server are running:

Frontend: [http://localhost:3000](http://localhost:3000)

Backend API: [http://localhost:5000](http://localhost:5000)

✅ Your local Debattlex setup is now live and ready to use! 🎙️💡
