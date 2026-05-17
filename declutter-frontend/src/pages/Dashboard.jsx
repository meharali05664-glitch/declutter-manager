import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import NotificationBell from '../components/NotificationBell'

const DIFFICULTY_CONFIG = {
  green:  { label:'1-Click',      color:'#10D9A0', bg:'rgba(16,217,160,0.12)' },
  yellow: { label:'Web Portal',   color:'#FFB84D', bg:'rgba(255,184,77,0.12)' },
  red:    { label:'Call Support', color:'#FF4D6D', bg:'rgba(255,77,109,0.12)' },
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / 86400000)
  return diff
}

function ScoreRing({ score }) {
  const r = 54, c = 2 * Math.PI * r
  const offset = c - (score / 100) * c
  const color = score >= 70 ? '#10D9A0' : score >= 40 ? '#FFB84D' : '#FF4D6D'

  return (
    <svg width="130" height="130" viewBox="0 0 130 130" className="score-ring" style={{ '--offset': offset }}>
      <circle cx="65" cy="65" r={r} className="track" strokeWidth="10"/>
      <circle cx="65" cy="65" r={r} className="fill" strokeWidth="10"
        stroke={color} strokeDasharray={c} strokeDashoffset={c}
        transform="rotate(-90 65 65)"
        style={{ animation:`ring 1.4s cubic-bezier(0.34,1.4,0.64,1) 0.3s forwards`, '--offset': offset }}/>
      <text x="65" y="60" textAnchor="middle" fill="white" fontSize="26" fontWeight="800" fontFamily="Sora,sans-serif">{score}</text>
      <text x="65" y="78" textAnchor="middle" fill="rgba(255,255,255,0.45)" fontSize="11" fontFamily="Inter,sans-serif">Health</text>
    </svg>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, monthlySpend, yearlySpend, healthScore, upcoming, zombies, activeSubs, potentialSavings } = useApp()

  const trialSubs = activeSubs.filter(s => s.isTrial)
  const endingTrials = trialSubs.filter(s => daysUntil(s.trialEndDate) <= 3)

  const nudges = [
    ...endingTrials.map(t => ({
      type: `trial-${t.id}`,
      icon: '⏳',
      msg: `Your ${t.name} free trial ends in ${daysUntil(t.trialEndDate)} days. Cancel now to avoid Rs. ${t.postTrialAmount || t.amount} charge!`,
      cta: 'Manage',
      route: '/vault'
    })),
    zombies.length > 0 && { type:'zombie', icon:'🧟', msg:`${zombies.length} zombie subscription${zombies.length>1?'s':''} detected — never used but still charging!`, cta:'Review', route:'/declutter' },
    activeSubs.filter(s=>s.category==='Entertainment').length >= 2 && { type:'overlap', icon:'📺', msg:`You have ${activeSubs.filter(s=>s.category==='Entertainment').length} video streaming services. Potential Rs. ${activeSubs.filter(s=>s.category==='Entertainment').slice(1).reduce((a,s)=>a+s.myShare,0).toLocaleString()} savings.`, cta:'Optimize', route:'/declutter' },
  ].filter(Boolean)

  return (
    <div className="page">
      {/* Background */}
      <div style={{ position:'fixed', top:0, left:'50%', transform:'translateX(-50%)', width:'430px', height:'300px', background:'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.25) 0%, transparent 65%)', pointerEvents:'none', zIndex:0 }}/>

      {/* Header */}
      <div className="px" style={{ paddingTop:'52px', paddingBottom:'20px', position:'relative', zIndex:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }} className="anim-up">
          <div>
            <p style={{ color:'var(--text2)', fontSize:'13px', marginBottom:'2px' }}>Good morning 👋</p>
            <h1 style={{ fontSize:'22px', fontWeight:'800', fontFamily:'Sora,sans-serif' }}>{user.name.split(' ')[0]}</h1>
          </div>
          <div style={{ display:'flex', gap:'10px' }}>
            <button onClick={() => navigate('/add')} id="header-add-btn"
              style={{ background:'linear-gradient(135deg,#7C3AED,#4F46E5)', border:'none', borderRadius:'12px', width:'38px', height:'38px', color:'white', fontSize:'18px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(124,58,237,0.4)' }}>+</button>
            <NotificationBell />
          </div>
        </div>
      </div>

      {/* Health Score Card */}
      <div className="px" style={{ marginBottom:'24px', position:'relative', zIndex:1 }}>
        <div className="glass anim-up d1" style={{ padding:'28px', background:'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(79,70,229,0.08))' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'24px', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 300px', display:'flex', alignItems:'center', gap:'24px' }}>
              <ScoreRing score={healthScore} />
              <div>
                <p style={{ color:'var(--text2)', fontSize:'12px', marginBottom:'4px', fontWeight:'500', textTransform:'uppercase', letterSpacing:'0.8px' }}>Subscription Health</p>
                <h3 style={{ fontSize:'20px', fontWeight:'700', marginBottom:'4px' }}>
                  {healthScore >= 70 ? 'Excellent' : healthScore >= 40 ? 'Good' : 'Needs Work'}
                </h3>
                <p style={{ color:'var(--text2)', fontSize:'13px' }}>
                  {healthScore >= 70 ? '🟢 Looking great! Keep it up.' : healthScore >= 40 ? '🟡 Room to optimize.' : '🔴 Action needed!'}
                </p>
              </div>
            </div>
            <div style={{ flex:'1 1 200px', display:'flex', flexDirection:'column', gap:'12px', textAlign:'right' }}>
              <div>
                <p style={{ color:'var(--text2)', fontSize:'12px', marginBottom:'4px' }}>Monthly Spend</p>
                <p style={{ fontSize:'32px', fontWeight:'800', fontFamily:'Sora,sans-serif' }} className="text-grad-purple">
                  Rs. {monthlySpend.toLocaleString()}
                </p>
              </div>
              <div style={{ display:'flex', justifyContent:'flex-end', gap:'20px' }}>
                <div>
                  <p style={{ color:'var(--text2)', fontSize:'11px', marginBottom:'2px' }}>Yearly</p>
                  <p style={{ fontSize:'15px', fontWeight:'600' }}>Rs. {yearlySpend.toLocaleString()}</p>
                </div>
                {potentialSavings > 0 && (
                  <div style={{ background:'rgba(16,217,160,0.1)', border:'1px solid rgba(16,217,160,0.2)', borderRadius:'10px', padding:'6px 12px' }}>
                    <p style={{ color:'#10D9A0', fontSize:'11px', fontWeight:'600' }}>💡 Save Rs. {potentialSavings.toLocaleString()}/yr</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nudges */}
      {nudges.length > 0 && (
        <div className="px grid-responsive" style={{ marginBottom:'24px' }}>
          {nudges.map((n,i) => (
            <div key={i} className={`glass anim-up d${i+2}`}
              style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', borderColor:'rgba(255,184,77,0.2)', background:'rgba(255,184,77,0.06)', cursor:'pointer' }}
              onClick={() => navigate(n.route)} id={`nudge-${n.type}`}>
              <span style={{ fontSize:'28px' }}>{n.icon}</span>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:'13px', color:'var(--text2)', lineHeight:'1.5' }}>{n.msg}</p>
                <span style={{ color:'#FFB84D', fontSize:'12px', fontWeight:'600', marginTop:'4px', display:'inline-block' }}>{n.cta} →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upcoming Renewals */}
      <div style={{ marginBottom:'16px' }}>
        <div className="px" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'700' }}>Upcoming Renewals</h2>
          <span onClick={() => navigate('/vault')} style={{ color:'#A78BFA', fontSize:'13px', cursor:'pointer' }}>See all →</span>
        </div>
        <div className="scroll-x">
          <div className="h-cards">
            {upcoming.map((sub, i) => {
              const days = daysUntil(sub.nextRenewal)
              const urgent = days <= 3
              return (
                <div key={sub.id} className={`glass anim-right d${i+1}`}
                  style={{ width:'160px', padding:'16px', cursor:'pointer', borderColor: urgent ? 'rgba(255,77,109,0.3)' : 'rgba(255,255,255,0.09)' }}
                  onClick={() => navigate('/vault')} id={`renewal-card-${sub.id}`}>
                  <div style={{ fontSize:'28px', marginBottom:'8px' }}>{sub.icon}</div>
                  <p style={{ fontSize:'13px', fontWeight:'600', marginBottom:'4px' }}>{sub.name}</p>
                  <p style={{ fontSize:'20px', fontWeight:'800', fontFamily:'Sora,sans-serif', color: urgent ? '#FF4D6D' : '#A78BFA', marginBottom:'4px' }}>
                    Rs. {sub.myShare.toLocaleString()}
                  </p>
                  <p style={{ fontSize:'11px', color: urgent ? '#FF4D6D' : 'var(--text2)', fontWeight: urgent ? '600' : '400' }}>
                    {days <= 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`}
                  </p>
                  {sub.paymentMethod && (
                    <p style={{ fontSize:'10px', color:'var(--text3)', marginTop:'4px' }}>via {sub.paymentMethod}</p>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="px" style={{ marginBottom:'16px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'10px' }}>
          {[
            { icon:'📦', label:'Active', value: activeSubs.length },
            { icon:'🧟', label:'Zombie', value: zombies.length, color:'#FF4D6D' },
            { icon:'🤝', label:'Shared', value: activeSubs.filter(s=>s.isShared).length, color:'#10D9A0' },
          ].map((stat, i) => (
            <div key={stat.label} className={`glass anim-up d${i+3}`} style={{ padding:'14px 12px', textAlign:'center' }}>
              <div style={{ fontSize:'22px', marginBottom:'6px' }}>{stat.icon}</div>
              <p style={{ fontSize:'20px', fontWeight:'800', fontFamily:'Sora,sans-serif', color: stat.color || 'white' }}>{stat.value}</p>
              <p style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px" style={{ marginBottom:'8px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'700' }}>Active Subscriptions</h2>
          <span onClick={() => navigate('/vault')} style={{ color:'#A78BFA', fontSize:'13px', cursor:'pointer' }}>View vault →</span>
        </div>
        <div className="grid-responsive">
          {activeSubs.slice(0,6).map((sub, i) => {
            const cfg = DIFFICULTY_CONFIG[sub.cancelDifficulty]
            return (
              <div key={sub.id} className={`glass anim-up d${i+1}`}
                style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:'16px', cursor:'pointer' }}
                onClick={() => navigate('/vault')} id={`sub-row-${sub.id}`}>
                <div style={{ width:'48px', height:'48px', borderRadius:'14px', background: sub.color+'22', border:`1px solid ${sub.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'24px', flexShrink:0 }}>
                  {sub.icon}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'3px' }}>
                    <p style={{ fontSize:'15px', fontWeight:'600', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{sub.name}</p>
                    {sub.isZombie && <span className="tag tag-rose" style={{ fontSize:'9px', padding:'2px 6px' }}>Zombie</span>}
                  </div>
                  <p style={{ fontSize:'12px', color:'var(--text2)' }}>{sub.billingCycle} · {sub.category}</p>
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <p style={{ fontSize:'16px', fontWeight:'700', color:'white' }}>Rs. {sub.myShare.toLocaleString()}</p>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end', marginTop:'3px' }}>
                    <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:cfg.color }}/>
                    <span style={{ fontSize:'10px', color:cfg.color }}>{cfg.label}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <button className="btn btn-ghost" onClick={() => navigate('/add')} id="add-sub-fab"
          style={{ marginTop:'12px', borderStyle:'dashed', color:'var(--text2)' }}>
          + Add Subscription
        </button>
      </div>
    </div>
  )
}