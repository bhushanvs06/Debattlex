// // DashboardLayout.jsx
// import { Outlet, NavLink, useNavigate } from "react-router-dom";
// // import "./Dashboard.css";

// export default function DashboardLayout() {
//   const navigate = useNavigate();
//   const handleLogout = () => {
//     localStorage.removeItem("userEmail");
//     navigate("/login");
//   };

//   const nav = [
//     { label: "Overview",   to: "/dashboard" },
//     { label: "My Debates", to: "/dashboard/my-debates" },
//     { label: "Feedback",   to: "/dashboard/feedback" },
//     { label: "Settings",   to: "/dashboard/settings" }
//   ];

//   return (
//     <div className="app-container">
//       {/* ---------- Sidebar ---------- */}
//       <aside className="sidebar">
//         <h1 className="app-title"><span className="title-debate">Debatle</span></h1>
//         <nav className="sidebar-nav">
//           {nav.map(i => (
//             <NavLink
//               key={i.label}
//               to={i.to}
//               className={({isActive}) => `nav-item ${isActive ? "active" : ""}`}
//             >
//               {i.label}
//             </NavLink>
//           ))}
//         </nav>
//         <button className="logout-btn" onClick={handleLogout}>Logout</button>
//       </aside>

//       {/* ---------- Routed content ---------- */}
//       <main className="main-content">
//         <Outlet />   {/* Overview / MyDebates / … will render here */}
//       </main>
//     </div>
//   );
// }
