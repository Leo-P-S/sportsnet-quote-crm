import { useState, useEffect } from 'react'
import Navbar from './components/Navbar'
import QuoteForm from './components/QuoteForm'
import QuoteList from './components/QuoteList'
import CustomerList from './components/CustomerList'
import Login from './components/Login'
import AdminPanel from './components/AdminPanel'
import Profile from './components/Profile'

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
        {activeTab === 'quote' && (
          <QuoteForm onQuoteCreated={(q) => setLastQuote(q)} user={user} />
        )}
        {activeTab === 'history' && (
          <QuoteList user={user} />
        )}
        {activeTab === 'customers' && (
          <CustomerList />
        )}
        {activeTab === 'profile' && (
          <Profile user={user} setUser={setUser} />
        )}
        {activeTab === 'admin' && user.role === 'admin' && (
          <AdminPanel />
        )}

        <div style={{ textAlign: 'center', marginTop: '3rem', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          SportNet CRM v1.1.0
        </div>
      </main>
    </div>
  )
}
