// All styles below are now fully inline and written as JavaScript objects for use in React components.

const styles = {
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, sans-serif`,
    background: '#1c0b2e'
  },
  sidebar: {
    width: '280px',
    position: 'fixed',
    top: 0,
    left: 0,
    height: '100vh',
    zIndex: 1000,
    background: '#581c87',
    boxShadow: '2px 0 10px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
    padding: '2rem 0'
  },
  sidebarHeader: {
    padding: '0 2rem 3rem'
  },
  appTitle: {
    margin: 0,
    fontSize: '2rem',
    fontWeight: 800,
    textAlign: 'center',
    letterSpacing: '1px'
  },
  titleDebate: {
    color: '#c084fc',
    fontVariant: 'small-caps',
    fontStyle: 'italic'
  },
  titleGuard: {
    color: '#d8b4fe'
  },
  sidebarNav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 1.5rem'
  },
  navItem: {
    background: 'none',
    border: 'none',
    color: '#d8b4fe',
    padding: '1rem 1.5rem',
    textAlign: 'left',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: '12px',
    transition: 'background 0.2s ease, color 0.2s ease',
    position: 'relative'
  },
  logoutBtn: {
    margin: '2rem 1.5rem 1rem',
    padding: '1rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '12px',
    cursor: 'pointer',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    background: 'rgba(46, 1, 45, 0.897)',
    color: '#d3bdbd',
    transition: 'all 0.2s ease'
  },
  mainContent: {
    flex: 1,
    marginLeft: '280px'
  },
  debateDashboard: {
    minHeight: '100vh',
    padding: '2rem',
    color: '#f5f3ff',
    background: 'linear-gradient(135deg, #23103c 0%, #2b1a44 50%, #23103c 100%)'
  },
  dashboardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '2rem',
    background: 'rgba(44, 19, 82, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(192, 132, 252, 0.18)',
    borderRadius: '20px',
    padding: '2rem',
    marginBottom: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)'
  },
  userAvatar: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '50%',
    border: '4px solid #6b21a8',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)'
  },
  chartContainer: {
    background: 'rgba(44, 19, 82, 0.7)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(192, 132, 252, 0.18)',
    borderRadius: '20px',
    padding: '2rem',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
    transition: 'transform 0.3s ease'
  },
  chartTitle: {
    margin: '0 0 1.5rem',
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#f5f3ff'
  }
};

export default styles;
