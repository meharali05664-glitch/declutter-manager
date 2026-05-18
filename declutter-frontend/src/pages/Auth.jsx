import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function Auth() {
  const location = useLocation()
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register')
  const [showForgot, setShowForgot] = useState(false)
  
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  
  const { login, register, forgotPassword } = useApp()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccessMsg('')
    
    if (showForgot) {
      if (!email) {
        setError('Please enter your email.')
        setLoading(false)
        return
      }
      const res = await forgotPassword(email)
      if (res.success) {
        setSuccessMsg(res.message || 'Password reset link sent to your email.')
      } else {
        setError(res.error)
      }
      setLoading(false)
      return
    }

    let res
    if (isLogin) {
      res = await login(email, password)
    } else {
      if (password !== confirmPassword) {
        setError('Passwords do not match')
        setLoading(false)
        return
      }
      res = await register(name, email, password)
    }

    if (res.success) {
      navigate('/dashboard')
    } else {
      setError(res.error)
    }
    setLoading(false)
  }

  // Styles
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
            background: showForgot ? 'linear-gradient(45deg, #F59E0B, #D97706)' : (isLogin ? 'linear-gradient(45deg, #7C3AED, #4F46E5)' : 'linear-gradient(45deg, #10B981, #3B82F6)'),
            margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 8px 24px ${showForgot ? 'rgba(245, 158, 11, 0.3)' : (isLogin ? 'rgba(124, 58, 237, 0.3)' : 'rgba(16, 185, 129, 0.3)')}`,
            transition: 'all 0.3s ease'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', letterSpacing: '-0.5px' }}>
            {showForgot ? 'Reset Password' : (isLogin ? 'Declutter' : 'Create Account')}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '16px' }}>
            {showForgot ? 'Enter your email to receive a reset link.' : (isLogin ? "Never pay for what you don't use." : 'Join Declutter to start saving money')}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {!isLogin && !showForgot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin && !showForgot}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={labelStyle}>Email Address</label>
            <input 
              type="email" 
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = showForgot ? '#F59E0B' : (isLogin ? '#7C3AED' : '#10B981')}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>

          {!showForgot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label style={labelStyle}>Password</label>
                {isLogin && (
                  <button 
                    type="button" 
                    onClick={() => { setShowForgot(true); setError(''); setSuccessMsg(''); }}
                    style={{ background:'none', border:'none', color:'#A78BFA', fontSize:'14px', cursor:'pointer', padding:0 }}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!showForgot}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = isLogin ? '#7C3AED' : '#10B981'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          {!isLogin && !showForgot && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={labelStyle}>Confirm Password</label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required={!isLogin && !showForgot}
                style={inputStyle}
                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>
          )}

          {error && <p style={{ color: '#F87171', fontSize: '14px', textAlign: 'center' }}>{error}</p>}
          {successMsg && <p style={{ color: '#34D399', fontSize: '14px', textAlign: 'center' }}>{successMsg}</p>}

          <button 
            type="submit" 
            disabled={loading}
            style={{
              background: showForgot ? 'linear-gradient(45deg, #F59E0B, #D97706)' : (isLogin ? 'linear-gradient(45deg, #7C3AED, #4F46E5)' : 'linear-gradient(45deg, #10B981, #059669)'),
              border: 'none',
              borderRadius: '12px',
              padding: '16px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginTop: '10px',
              boxShadow: `0 4px 12px ${showForgot ? 'rgba(245, 158, 11, 0.2)' : (isLogin ? 'rgba(124, 58, 237, 0.2)' : 'rgba(16, 185, 129, 0.2)')}`,
              transition: 'all 0.3s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
          >
            {loading ? (showForgot ? 'Sending...' : (isLogin ? 'Logging in...' : 'Creating Account...')) : (showForgot ? 'Send Reset Link' : (isLogin ? 'Login' : 'Register'))}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '32px', color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
          {showForgot ? (
            <>
              Remember your password? {' '}
              <button 
                onClick={() => { setShowForgot(false); setIsLogin(true); setError(''); setSuccessMsg(''); }}
                style={{ background: 'none', border: 'none', color: '#A78BFA', fontWeight: '600', cursor: 'pointer', padding: 0, fontSize: '14px' }}
              >
                Login here
              </button>
            </>
          ) : (
            <>
              {isLogin ? "Don't have an account?" : "Already have an account?"} {' '}
              <button 
                onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }}
                style={{ 
                  background: 'none', border: 'none', 
                  color: isLogin ? '#A78BFA' : '#10B981', 
                  fontWeight: '600', cursor: 'pointer', padding: 0, fontSize: '14px' 
                }}
              >
                {isLogin ? 'Register here' : 'Login here'}
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
