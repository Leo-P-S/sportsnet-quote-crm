export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const tabs = [
    { id: 'quote', label: 'Proforma', icon: '📄' },
    { id: 'history', label: 'Historial', icon: '📚' },
    { id: 'customers', label: 'Clientes', icon: '👤' },
    { id: 'profile', label: 'Perfil', icon: '⚙️' },
  ]

  if (user?.role === 'admin') {
    tabs.push({ id: 'admin', label: 'Admin', icon: '🛡️' })
  }

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">⚽</span>
          <span className="brand-name">SportNet</span>
        </div>
        
        {user && (
          <div style={{display:'flex', alignItems:'center', gap:'1rem'}}>
            <div style={{textAlign:'right'}} className="desktop-only">
              <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>Facturador</div>
              <div style={{fontSize:'0.9rem', fontWeight:'600'}}>{user.username}</div>
            </div>
            <button onClick={onLogout} className="btn btn-secondary btn-sm" style={{padding:'0.4rem 0.8rem', fontSize:'0.8rem', borderRadius: '8px'}}>Salir</button>
          </div>
        )}
      </header>
      
      <nav className="navbar-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
