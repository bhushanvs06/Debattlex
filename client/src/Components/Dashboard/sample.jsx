import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const [userData, setUserData] = useState([]);
  const navigate = useNavigate();
  const email = localStorage.getItem("userEmail");

  useEffect(() => {
    if (!email) {
      alert("User not logged in");
      navigate("/login");
      return;
    }

    axios
      .post("http://localhost:5000/api/fetchEntries", { email })
      .then((res) => setUserData(res.data.entries))
      .catch((err) => console.error("Error fetching entries:", err));
  }, [email, navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white px-6 py-8 font-sans">
      <header className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-white">Debatle Dashboard</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          Logout
        </button>
      </header>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-purple-300">Your Entries</h2>
        {userData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {userData.map((entry, idx) => (
              <div
                key={idx}
                className="bg-gray-800 rounded-xl p-5 shadow hover:shadow-purple-600 transition duration-300"
              >
                <h3 className="text-lg font-bold mb-2 text-teal-300">{entry.topic}</h3>
                <p><span className="font-medium text-gray-400">Name:</span> {entry.name}</p>
                <p><span className="font-medium text-gray-400">Type:</span> {entry.type}</p>
                <p><span className="font-medium text-gray-400">Stance:</span> {entry.stance}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-400">No debate entries found.</p>
        )}
      </section>
    </div>
  );
}
