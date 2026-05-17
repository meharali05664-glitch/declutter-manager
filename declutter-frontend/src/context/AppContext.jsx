import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import axios from 'axios'

const AppContext = createContext(null)

const SERVICES = [
  { name:'YouTube Premium', category:'Entertainment',  icon:'▶️', color:'#FF0000', cancelDifficulty:'yellow', paymentMethod:'Nayapay **1234' },
  { name:'Hotstar',         category:'Entertainment',  icon:'⭐', color:'#1F80E0', cancelDifficulty:'yellow', paymentMethod:'SadaPay **9012' },
  { name:'Adobe CC',         category:'Productivity',   icon:'🎨', color:'#FF0000', cancelDifficulty:'yellow', paymentMethod:'Nayapay **1234' },
  { name:'Microsoft 365',    category:'Productivity',   icon:'📊', color:'#F25022', cancelDifficulty:'yellow', paymentMethod:'SadaPay **9012' },
  { name:'Udemy',            category:'Education',      icon:'🎓', color:'#A435F0', cancelDifficulty:'green',  paymentMethod:'Nayapay **1234' },
  { name:'SlideShare',       category:'Productivity',   icon:'📑', color:'#0077B5', cancelDifficulty:'green',  paymentMethod:'Cash' },
  { name:'N8N',              category:'Productivity',   icon:'⚡', color:'#FF6C37', cancelDifficulty:'green',  paymentMethod:'SadaPay **9012' },
]

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

function calcHealth(subs) {
  let score = 100
  const active = subs.filter(s => s.status === 'active')
  const zombies = active.filter(s => s.isZombie)
  const categories = active.map(s => s.category)
  const dupCats = categories.filter((c,i) => categories.indexOf(c) !== i)
  score -= zombies.length * 12
  score -= [...new Set(dupCats)].length * 8
  score -= active.filter(s => s.amount > 2000).length * 3
  return Math.max(0, Math.min(100, score))
}

export function AppProvider({ children }) {
  const [subscriptions, setSubscriptions] = useState([])
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('declutter_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifications, setNotifications] = useState([])

  const fetchSubscriptions = useCallback(async () => {
    const token = localStorage.getItem('declutter_token')
    try {
      const res = await axios.get(`${API_BASE}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(res.data)
    } catch (err) {
      console.error('Fetch failed:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('declutter_token')
    try {
      const res = await axios.get(`${API_BASE}/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(res.data)
    } catch (err) {
      console.error('Fetch notifications failed:', err)
    }
  }, [])

  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem('declutter_token')
    try {
      const res = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUser(res.data)
      localStorage.setItem('declutter_user', JSON.stringify(res.data))
    } catch (err) {
      console.error('Fetch user profile failed:', err)
      if (err.response?.status === 401) {
        setUser(null)
        localStorage.removeItem('declutter_user')
        localStorage.removeItem('declutter_token')
      }
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      const token = localStorage.getItem('declutter_token')
      const tasks = [fetchSubscriptions(), fetchNotifications()]
      if (token) {
        tasks.push(fetchUserProfile())
      } else {
        setUser(null)
      }
      await Promise.all(tasks)
      setLoading(false)
    }
    init()

    // Polling for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [fetchSubscriptions, fetchUserProfile, fetchNotifications])

  const addSubscription = useCallback(async (sub) => {
    const token = localStorage.getItem('declutter_token')
    try {
      const res = await axios.post(`${API_BASE}/subscriptions`, sub, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(prev => [...prev, res.data])
      fetchNotifications()
    } catch (err) {
      console.error('Add failed:', err)
    }
  }, [])

  const updateSubscription = useCallback(async (id, data) => {
    const token = localStorage.getItem('declutter_token')
    try {
      const res = await axios.patch(`${API_BASE}/subscriptions/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(prev => prev.map(s => s.id === id ? res.data : s))
    } catch (err) {
      console.error('Update failed:', err)
    }
  }, [])

  const deleteSubscription = useCallback(async (id) => {
    const token = localStorage.getItem('declutter_token')
    try {
      await axios.delete(`${API_BASE}/subscriptions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setSubscriptions(prev => prev.filter(s => s.id !== id))
    } catch (err) {
      console.error('Delete failed:', err)
    }
  }, [])

  const markNotificationAsRead = useCallback(async (id) => {
    const token = localStorage.getItem('declutter_token')
    try {
      await axios.patch(`${API_BASE}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
    } catch (err) {
      console.error('Mark read failed:', err)
    }
  }, [])

  const markAllNotificationsAsRead = useCallback(async () => {
    const token = localStorage.getItem('declutter_token')
    try {
      await axios.patch(`${API_BASE}/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('Mark all read failed:', err)
    }
  }, [])

  const login = async (email, phone) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, { email, phone })
      const { token, user } = res.data
      localStorage.setItem('declutter_token', token)
      localStorage.setItem('declutter_user', JSON.stringify(user))
      setUser(user)
      fetchSubscriptions()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Login failed' }
    }
  }

  const register = async (name, email, phone) => {
    try {
      const res = await axios.post(`${API_BASE}/auth/simple-register`, { name, email, phone })
      const { token, user } = res.data
      localStorage.setItem('declutter_token', token)
      localStorage.setItem('declutter_user', JSON.stringify(user))
      setUser(user)
      fetchSubscriptions()
      return { success: true }
    } catch (err) {
      return { success: false, error: err.response?.data?.error || 'Registration failed' }
    }
  }

  const logout = () => {
    localStorage.removeItem('declutter_token')
    localStorage.removeItem('declutter_user')
    setUser(null)
    setSubscriptions([])
  }

  const activeSubs = subscriptions.filter(s => s.status === 'active')
  const monthlySpend = activeSubs.reduce((acc, s) => {
    const share = s.myShare ?? s.amount ?? 0
    if (s.billingCycle === 'yearly') return acc + Math.round(share / 12)
    return acc + share
  }, 0)
  const yearlySpend = monthlySpend * 12
  const healthScore = calcHealth(subscriptions)
  const potentialSavings = subscriptions.filter(s => s.isZombie || s.status === 'paused').reduce((a,s)=>a+(s.myShare ?? s.amount ?? 0), 0)

  const upcoming = [...activeSubs]
    .sort((a,b) => new Date(a.nextRenewal) - new Date(b.nextRenewal))
    .slice(0,5)

  const zombies = activeSubs.filter(s => s.isZombie)
  const categories = [...new Set(activeSubs.map(s => s.category))]
  const categoryBreakdown = categories.map(cat => ({
    name: cat,
    amount: activeSubs.filter(s => s.category === cat).reduce((a,s) => a + (s.myShare ?? s.amount ?? 0), 0),
    count: activeSubs.filter(s => s.category === cat).length,
  })).sort((a,b) => b.amount - a.amount)

  const savedAmount = subscriptions.filter(s => s.status === 'cancelled').reduce((a, s) => a + s.myShare, 0) * 12 || 15000

  const HISTORY = [
    { month:'Nov', spend: Math.round(monthlySpend * 0.8) }, 
    { month:'Dec', spend: Math.round(monthlySpend * 0.9) }, 
    { month:'Jan', spend: Math.round(monthlySpend * 1.1) },
    { month:'Feb', spend: Math.round(monthlySpend * 0.95) }, 
    { month:'Mar', spend: Math.round(monthlySpend * 1.05) }, 
    { month:'Apr', spend: monthlySpend },
  ]

  return (
    <AppContext.Provider value={{
      subscriptions, user, addSubscription, updateSubscription, deleteSubscription,
      login, register, logout,
      activeSubs, monthlySpend, yearlySpend, healthScore, potentialSavings,
      upcoming, zombies, categories, categoryBreakdown, spendHistory: monthlySpend > 0 ? HISTORY : [],
      SERVICES, loading, error, refresh: fetchSubscriptions, refreshUserProfile: fetchUserProfile, savedAmount,
      notifications, markNotificationAsRead, markAllNotificationsAsRead, fetchNotifications
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
