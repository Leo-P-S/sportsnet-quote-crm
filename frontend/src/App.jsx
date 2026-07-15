import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import QuoteForm from './components/QuoteForm'
import QuoteList from './components/QuoteList'
import CustomerList from './components/CustomerList'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import Profile from './components/Profile'
import PriceCalculator from './components/PriceCalculator'
import TeamManager from './components/TeamManager'
import WarehouseDashboard from './components/WarehouseDashboard'

import WarehouseMap from './components/WarehouseMap'

export default function App() {
  const [activeTab, setActiveTab] = useState('quote')
  const [lastQuote, setLastQuote] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  useEffect(() => {
    if (user) {
      if (user.role === 'almacenador') {
        setActiveTab('inventory')
      } else {
        setActiveTab('quote')
      }
    }
  }, [user?.username]) // Solo ejecutar cuando el usuario cambie

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  if (!user) {
    return <Login onLogin={setUser} />
  }

  return (
    <div className="app">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} user={user} onLogout={handleLogout} />
      <main className="main-content">
        {activeTab === 'quote' && user.role !== 'almacenador' && (
          <QuoteForm onQuoteCreated={(q) => setLastQuote(q)} user={user} />
        )}
        {activeTab === 'history' && user.role !== 'almacenador' && (
          <QuoteList user={user} />
        )}
        {activeTab === 'customers' && user.role !== 'almacenador' && (
          <CustomerList />
        )}
        {activeTab === 'inventory' && <WarehouseDashboard user={user} />}
        {activeTab === 'map' && <WarehouseMap user={user} />}
        {activeTab === 'profile' && <Profile user={user} setUser={setUser} />}
        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminPanel />
        )}
        {activeTab === 'calculator' && user.role !== 'almacenador' && (
          <PriceCalculator user={user} />
        )}
        {activeTab === 'team' && user.role !== 'almacenador' && (
          <TeamManager user={user} />
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          SportNet CRM v1.4.2
        </div>
      </main>
    </div>
  )
}
