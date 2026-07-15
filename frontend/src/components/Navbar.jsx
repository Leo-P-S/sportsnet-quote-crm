import { useState, useRef, useEffect } from 'react'

export default function Navbar({ activeTab, setActiveTab, user, onLogout }) {
  const [showMore, setShowMore] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowMore(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  let mainTabs = [];
  let moreTabs = [];

  if (user?.role === 'almacenador') {
    mainTabs = [
      { id: 'inventory', label: 'Inventario', icon: '📦' },
      { id: 'map', label: 'Mapa 2D', icon: '🗺️' },
      { id: 'profile', label: 'Perfil', icon: '⚙️' },
    ];
  } else {
    // Para facturadores normales y admins
    mainTabs = [
      { id: 'quote', label: 'Proforma', icon: '📄' },
      { id: 'calculator', label: 'Catálogo', icon: '🧮' },
      { id: 'profile', label: 'Perfil', icon: '⚙️' },
    ];

    moreTabs = [
      { id: 'history', label: 'Historial', icon: '📚' },
      { id: 'customers', label: 'Clientes', icon: '👤' },
      { id: 'team', label: 'Equipo', icon: '👥' },
    ];

    if (user?.role === 'admin') {
      // El admin tiene acceso al mapa/inventario y panel
      moreTabs.push({ id: 'inventory', label: 'Inventario', icon: '📦' });
      moreTabs.push({ id: 'map', label: 'Mapa 2D', icon: '🗺️' });
      moreTabs.push({ id: 'admin', label: 'Admin', icon: '🛡️' });
    }
  }

  const handleTabClick = (id) => {
    setActiveTab(id);
    setShowMore(false);
  };

  const isMoreTabActive = moreTabs.some(t => t.id === activeTab);

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
              <div style={{fontSize:'0.8rem', color:'var(--text-secondary)'}}>
                {user.role === 'admin' ? 'Administrador' : user.role === 'almacenador' ? 'Almacenador' : 'Facturador'}
              </div>
              <div style={{fontSize:'0.9rem', fontWeight:'600'}}>{user.username}</div>
            </div>
            <button onClick={onLogout} className="btn btn-secondary btn-sm" style={{padding:'0.4rem 0.8rem', fontSize:'0.8rem', borderRadius: '8px'}}>Salir</button>
          </div>
        )}
      </header>
      
      <nav className="navbar-tabs" style={{ position: 'relative' }}>
        {mainTabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}

        {moreTabs.length > 0 && (
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              className={`tab-btn ${isMoreTabActive ? 'active' : ''}`}
              style={{ border: 'none' }}
              onClick={() => setShowMore(!showMore)}
            >
              <span className="tab-icon">➕</span>
              <span className="tab-label">Más</span>
            </button>

            {showMore && (
              <div className="more-dropdown">
                {moreTabs.map((tab) => (
                  <button
                    key={tab.id}
                    className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'}`}
                    style={{
                      justifyContent: 'flex-start',
                      padding: '0.8rem 1rem',
                      border: 'none',
                      backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                      color: activeTab === tab.id ? '#fff' : 'var(--text)',
                      textAlign: 'left'
                    }}
                    onClick={() => handleTabClick(tab.id)}
                  >
                    <span style={{ marginRight: '8px' }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
    </>
  )
}
