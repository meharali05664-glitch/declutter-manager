import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function ResetPassword() {
  const location = useLocation()
  const searchParams = new URLSearchParams(location.search)
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { resetPassword } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    if (!token) {
      setError('Invalid or missing reset token. Please request a new link.')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    const res = await resetPassword(token, password)
    if (res.success) {
      setSuccess(true)
    } else {
      setError(res.error)
    }
    setLoading(false)
  }

  const inputStyle = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '14px 16px',
    color: 'white',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s',
  }
  const labelStyle = { fontSize: '14px', fontWeight: '500', color: 'rgba(255,255,255,0.8)' }

  return (
    <div className="auth-page" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: '24px',
      color: 'white',
      fontFamily: 'Outfit, sans-serif'
    }}>
      <div style={{ maxWidth: '400px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '64px', height: '64px', borderRadius: '16px', 
            background: 'linear-gradient(45deg, #F59E0B, #D97706)',
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)',
            transition: 'all 0.3s ease'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            New Password
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
            Please enter your new password below.
          </p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#34D399', fontSize: '18px', marginBottom: '24px' }}>Password successfully reset!</p>
            <button 
              onClick={() => navigate('/login')}
              style={{
                background: 'linear-gradient(45deg, #7C3AED, #4F46E5)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.2)'
              }}
            >
              Go to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Confirm New Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#F59E0B'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            {error && <p style={{ color: '#F87171', fontSize: '14px', textAlign: 'center' }}>{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              style={{
                background: 'linear-gradient(45deg, #F59E0B, #D97706)',
                border: 'none',
                borderRadius: '12px',
                padding: '16px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginTop: '10px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
                transition: 'all 0.3s ease',
                opacity: loading ? 0.7 : 1
              }}
              onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
