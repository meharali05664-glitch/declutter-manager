import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

function SettingRow({ icon, label, sub, right, onClick, id }) {
  return (
    <div id={id} onClick={onClick}
      style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 0', borderBottom:'1px solid rgba(var(--theme-rgb),0.05)', cursor: onClick?'pointer':'default' }}>
      <div style={{ width:'38px', height:'38px', borderRadius:'12px', background:'rgba(var(--theme-rgb),0.06)', border:'1px solid rgba(var(--theme-rgb),0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', flexShrink:0 }}>
        {icon}
      </div>
      <div style={{ flex:1 }}>
        <p style={{ fontSize:'14px', fontWeight:'500' }}>{label}</p>
        {sub && <p style={{ fontSize:'12px', color:'var(--text3)', marginTop:'1px' }}>{sub}</p>}
      </div>
      {right}
      {onClick && !right && <span style={{ color:'var(--text3)', fontSize:'16px' }}>›</span>}
    </div>
  )
}

export default function Settings() {
  const navigate = useNavigate()
  const { user, monthlySpend, savedAmount, activeSubs, healthScore, logout, refreshUserProfile, theme, toggleTheme } = useApp()

  useEffect(() => {
    refreshUserProfile()
  }, [refreshUserProfile])

  const [alerts, setAlerts] = useState({ push:true, email:false, threeDay:true, oneDay:true })
  const [currency, setCurrency] = useState('PKR')

  const Toggle = ({ val, onChange }) => (
    <label className="toggle">
      <input type="checkbox" checked={val} onChange={e => onChange(e.target.checked)} />
      <span className="slider"/>
    </label>
  )


  return (
    <div className="page">
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg, rgba(124,58,237,0.1) 0%, transparent 100%)', padding:'52px 20px 0' }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'24px', fontWeight:'800', marginBottom:'4px' }} className="anim-up">Profile ⚙️</h1>
        <p style={{ color:'var(--text2)', fontSize:'13px', marginBottom:'20px' }} className="anim-up d1">Manage your account & preferences</p>
      </div>

      {/* Profile Card */}
      <div className="px" style={{ marginBottom:'24px' }}>
        <div className="glass anim-up d1" style={{ padding:'24px', background:'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(79,70,229,0.08))', position:'relative', overflow:'hidden' }}>
          {/* Decorative background circle */}
          <div style={{ position:'absolute', top:'-20px', right:'-20px', width:'120px', height:'120px', borderRadius:'50%', background:'radial-gradient(circle, rgba(124,58,237,0.2), transparent 70%)', pointerEvents:'none' }} />
          
          <div style={{ display:'flex', alignItems:'center', gap:'20px', position:'relative', zIndex:1 }}>
            <div style={{ width:'72px', height:'72px', borderRadius:'22px', background:'linear-gradient(135deg,#7C3AED,#4F46E5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'32px', flexShrink:0, boxShadow:'0 8px 24px rgba(124,58,237,0.4)', color:'white', fontWeight:'800' }}>
              {user.name.charAt(0)}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
                <h2 style={{ fontSize:'22px', fontWeight:'800', fontFamily:'Sora,sans-serif' }}>{user.name}</h2>
                {user.isPro && (
                  <div style={{ background:'linear-gradient(135deg,#FFB84D,#F59E0B)', color:'#1A0F00', fontSize:'10px', fontWeight:'800', padding:'2px 8px', borderRadius:'99px', textTransform:'uppercase', letterSpacing:'0.5px' }}>
                    PRO
                  </div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:'4px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text2)', fontSize:'14px' }}>
                  <span style={{ fontSize:'16px', opacity:0.8 }}>📧</span>
                  <span>{user.email || 'No email linked'}</span>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', color:'var(--text2)', fontSize:'14px' }}>
                  <span style={{ fontSize:'16px', opacity:0.8 }}>📱</span>
                  <span>{user.phone || 'No phone linked'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px', paddingTop:'16px', borderTop:'1px solid rgba(var(--theme-rgb),0.07)' }}>
            {[
              { label:'Health Score', value: healthScore, color:'#10D9A0' },
              { label:'Active Subs', value: activeSubs.length, color:'#A78BFA' },
              { label:'Rs. Saved', value: `${Math.round(savedAmount/1000)}k`, color:'#FFB84D' },
            ].map(s => (
              <div key={s.label} style={{ textAlign:'center' }}>
                <p style={{ fontSize:'20px', fontWeight:'800', fontFamily:'Sora,sans-serif', color:s.color }}>{s.value}</p>
                <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'2px' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px grid-responsive" style={{ gridTemplateColumns:'repeat(auto-fit, minmax(320px, 1fr))', gap:'24px', marginBottom:'24px' }}>
        {/* Notification Settings */}
        <div>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'12px' }}>Alerts & Notifications</p>
          <div className="glass" style={{ padding:'4px 16px' }}>
            <SettingRow id="toggle-push" icon="🔔" label="Push Notifications" sub="In-app alerts" right={<Toggle val={alerts.push} onChange={v=>setAlerts({...alerts,push:v})}/>} />
            <SettingRow id="toggle-email" icon="📧" label="Email Reminders" sub="Summary & renewal emails" right={<Toggle val={alerts.email} onChange={v=>setAlerts({...alerts,email:v})}/>} />
            <SettingRow id="toggle-3day" icon="⏰" label="3-Day Reminder" right={<Toggle val={alerts.threeDay} onChange={v=>setAlerts({...alerts,threeDay:v})}/>} />
            <SettingRow id="toggle-1day" icon="📅" label="1-Day Reminder" right={<Toggle val={alerts.oneDay} onChange={v=>setAlerts({...alerts,oneDay:v})}/>} />
          </div>
        </div>

        {/* Privacy & Security */}
        <div>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'12px' }}>Privacy & Security</p>
          <div className="glass" style={{ padding:'4px 16px' }}>
            <SettingRow id="sms-privacy-row" icon="📱" label="SMS Privacy" sub="On-device only parsing" onClick={() => {}} />
            <SettingRow id="encryption-row" icon="🛡️" label="Encryption" sub="AES-256 at rest" />
          </div>
        </div>

        {/* App Settings */}
        <div>
          <p style={{ fontSize:'12px', fontWeight:'600', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'12px' }}>App Settings</p>
          <div className="glass" style={{ padding:'4px 16px' }}>
            <SettingRow id="theme-row" icon={theme === 'dark' ? '🌙' : '☀️'} label="Dark Mode" sub="Toggle application theme" right={<Toggle val={theme === 'dark'} onChange={toggleTheme}/>} />
            <SettingRow id="currency-row" icon="💰" label="Currency" right={
              <select id="currency-select" value={currency} onChange={e=>setCurrency(e.target.value)}
                style={{ background:'rgba(var(--theme-rgb),0.06)', border:'1px solid rgba(var(--theme-rgb),0.1)', borderRadius:'8px', color:'var(--text)', fontSize:'12px', padding:'5px 8px', outline:'none', fontFamily:'Inter,sans-serif' }}>
                <option value="PKR">🇵🇰 PKR</option>
                <option value="INR">🇮🇳 INR</option>
                <option value="USD">🇺🇸 USD</option>
              </select>
            }/>
            <SettingRow id="export-row" icon="📤" label="Export Data" sub="Download CSV report" onClick={() => {}} />
          </div>
        </div>

      </div>


      <div className="px" style={{ marginBottom:'40px' }}>
        <button 
          id="logout-btn"
          onClick={logout}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#EF4444',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseDown={(e) => e.target.style.transform = 'scale(0.98)'}
          onMouseUp={(e) => e.target.style.transform = 'scale(1)'}
        >
          Sign Out
        </button>
      </div>

      <p style={{ textAlign:'center', color:'var(--text3)', fontSize:'12px', padding:'16px', marginBottom:'8px' }}>
        Declutter v1.0.0 · Made with ❤️ for PK & IN
      </p>
    </div>
  )
}
