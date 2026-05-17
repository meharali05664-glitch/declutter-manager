import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import axios from 'axios'

const CANCEL_SCRIPTS = {
  gym: `Hi, I'd like to cancel my gym membership. Please process my cancellation effective immediately and confirm via WhatsApp. Thank you.`,
  isp: `Dear Support, I wish to cancel my internet subscription. Kindly process this request and share a confirmation message. Thank you.`,
}

const SUGGESTIONS = (subs, zombies) => {
  const items = []
  if (zombies.length > 0) {
    zombies.forEach(z => items.push({
      id: `zombie-${z.id}`, subId: z.id, type:'zombie', severity:'high',
      icon: z.icon, name: z.name,
      title: `${z.name} is a Zombie 🧟`,
      desc: `You've used it ${z.usageHours}h this month but still paying Rs. ${z.myShare.toLocaleString()}/mo. Cancel to save Rs. ${(z.myShare*12).toLocaleString()}/yr.`,
      saving: z.myShare * 12,
      cta:'Cancel Now', ctaType:'danger',
      difficulty: z.cancelDifficulty,
    }))
  }
  const entertainment = subs.filter(s=>s.status==='active'&&s.category==='Entertainment')
  if (entertainment.length >= 2) {
    items.push({
      id:'overlap-ent', type:'overlap', severity:'medium',
      icon:'📺', name:'Video Streaming',
      title:`${entertainment.length} Streaming Services Overlap`,
      desc:`You pay Rs. ${entertainment.reduce((a,s)=>a+s.myShare,0).toLocaleString()}/mo across ${entertainment.map(s=>s.name).join(', ')}. Consider pausing ${entertainment.slice(-1)[0].name}.`,
      saving: entertainment.slice(-1)[0].myShare * 12,
      cta:'Compare Plans', ctaType:'warning',
    })
  }
  const highUsage = subs.filter(s=>s.status==='active'&&s.billingCycle==='monthly'&&s.amount>=2000)
  if (highUsage.length > 0) {
    items.push({
      id:'yearly-switch', type:'downgrade', severity:'low',
      icon:'💡', name:'Switch to Yearly',
      title:'Save 20% by Going Yearly',
      desc:`Switching ${highUsage[0].name} to annual billing could save you ~20%. That's Rs. ${Math.round(highUsage[0].myShare*0.2*12).toLocaleString()}/yr.`,
      saving: Math.round(highUsage[0].myShare * 0.2 * 12),
      cta:'Switch Plan', ctaType:'teal',
    })
  }
  items.push({
    id:'whatsapp-alerts', type:'feature', severity:'low',
    icon:'💬', name:'WhatsApp Alerts',
    title:'Enable WhatsApp Nudges',
    desc:'Get high-visibility renewal alerts on WhatsApp — works even when push notifications are blocked by battery savers.',
    saving: 0, cta:'Enable', ctaType:'teal',
  })
  return items
}

function SeverityBadge({ severity }) {
  const cfg = { high:['🔴','#FF4D6D','rgba(255,77,109,0.12)'], medium:['🟡','#FFB84D','rgba(255,184,77,0.12)'], low:['🟢','#10D9A0','rgba(16,217,160,0.12)'] }[severity]
  return <span style={{ background:cfg[2], color:cfg[1], border:`1px solid ${cfg[1]}33`, borderRadius:'99px', padding:'3px 9px', fontSize:'11px', fontWeight:'600' }}>{cfg[0]} {severity.charAt(0).toUpperCase()+severity.slice(1)} Priority</span>
}

export default function Declutter() {
  const navigate = useNavigate()
  const { activeSubs, zombies, potentialSavings, updateSubscription, monthlySpend } = useApp()
  const [dismissed, setDismissed] = useState([])
  const [actionDone, setActionDone] = useState([])
  const [confetti, setConfetti] = useState(false)
  
  // New AI state
  const [aiRecs, setAiRecs] = useState([])
  const [communityInsights, setCommunityInsights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAiRecs = async () => {
      const token = localStorage.getItem('declutter_token')
      setLoading(true)
      try {
        console.log('AI Hub: Fetching from /api/ai/recommendations');
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const res = await axios.get(`${API_BASE}/ai/recommendations`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        })
        
        let recs = res.data.recommendations || []
        // If API returns no recs, fallback to local logic only if user has no active subs
        if (recs.length === 0 && activeSubs.length > 0) {
          recs = SUGGESTIONS(activeSubs, zombies)
        }
        
        setAiRecs(recs)
        setCommunityInsights(res.data.communityInsights || [])
        setError(null)
      } catch (err) {
        console.error('AI Hub Connection Error:', err.response?.data || err.message)
        setError(err.response?.data?.error || 'Database connection issue.')
        // Fallback to local logic on error
        setAiRecs(SUGGESTIONS(activeSubs, zombies))
      } finally {
        setLoading(false)
      }
    }
    fetchAiRecs()
  }, [activeSubs.length, zombies.length]) 

  const suggestions = aiRecs.filter(s => !dismissed.includes(s.id))
  const totalSavings = suggestions.reduce((a,s) => a + (s.saving || 0), 0)

  const handleAction = (sug) => {
    if (sug.ctaType === 'danger' || sug.id.includes('zombie') || sug.id.includes('rec-zombie')) {
      if (sug.subId) updateSubscription(sug.subId, { status:'cancelled' })
      setActionDone(prev => [...prev, sug.id])
      setDismissed(prev => [...prev, sug.id])
      setConfetti(true)
      setTimeout(() => setConfetti(false), 3000)
    } else if (sug.id.includes('overlap')) {
      navigate('/vault')
    } else if (sug.id.includes('yearly-savings') || sug.id.includes('rec-yearly')) {
      navigate('/vault')
    } else {
      setDismissed(prev => [...prev, sug.id])
    }
  }

  return (
    <div className="page">
      {/* Confetti overlay */}
      {confetti && (
        <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:999, overflow:'hidden' }}>
          {[...Array(18)].map((_,i) => (
            <div key={i} style={{
              position:'absolute', width:'8px', height:'8px', borderRadius:'2px',
              left:`${Math.random()*100}%`, top:'-10px',
              background:['#10D9A0','#A78BFA','#FFB84D','#FF4D6D','#60A5FA'][i%5],
              animation:`confetti ${1.5+Math.random()}s ease-in ${Math.random()*0.5}s forwards`,
            }}/>
          ))}
        </div>
      )}

      {/* Header */}
      <div style={{ background:'linear-gradient(180deg, rgba(16,217,160,0.1) 0%, transparent 100%)', padding:'52px 20px 20px' }}>
        <div className="anim-up">
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'24px', fontWeight:'800', marginBottom:'4px' }}>
            AI Declutter Hub ✨
          </h1>
          <p style={{ color:'var(--text2)', fontSize:'13px' }}>Smart suggestions to cut waste & save money</p>
        </div>
      </div>

      {/* Savings Hero */}
      <div className="px" style={{ marginBottom:'24px' }}>
        <div className="glass anim-up d1" style={{ padding:'32px', background:'linear-gradient(135deg, rgba(16,217,160,0.12), rgba(6,182,212,0.06))', borderColor:'rgba(16,217,160,0.2)' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'32px', flexWrap:'wrap' }}>
            <div style={{ flex:'1 1 300px', textAlign:'left' }}>
              <p style={{ color:'#10D9A0', fontSize:'12px', fontWeight:'600', textTransform:'uppercase', letterSpacing:'0.8px', marginBottom:'8px' }}>Potential Annual Savings</p>
              <p style={{ fontFamily:'Sora,sans-serif', fontSize:'48px', fontWeight:'800', color:'white', marginBottom:'4px' }}>
                Rs. {totalSavings.toLocaleString()}
              </p>
              <p style={{ color:'var(--text2)', fontSize:'14px' }}>across {suggestions.filter(s=>s.saving>0).length} actionable suggestions</p>
            </div>
            <div style={{ flex:'1 1 300px', display:'flex', justifyContent:'flex-end', gap:'24px' }}>
              {[
                { label:'Monthly Spend', val:`Rs. ${monthlySpend.toLocaleString()}` },
                { label:'Zombie Subs', val: zombies.length },
                { label:'Suggestions', val: suggestions.length },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <p style={{ fontSize:'22px', fontWeight:'800', color:'white' }}>{s.val}</p>
                  <p style={{ fontSize:'12px', color:'var(--text3)' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Community Insights */}
      {communityInsights.length > 0 && !loading && (
        <div className="px" style={{ marginBottom:'24px' }}>
          <h2 style={{ fontSize:'18px', fontWeight:'700', marginBottom:'16px' }}>Community Insights 🌍</h2>
          <div className="grid-responsive" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {communityInsights.map((insight, i) => (
              <div key={insight.id} className={`glass anim-up d${Math.min(i+1,5)}`} style={{ padding:'20px', borderColor:'rgba(96,165,250,0.2)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px' }}>
                  <span style={{ fontSize:'24px' }}>📊</span>
                  <div>
                    <p style={{ fontSize:'15px', fontWeight:'700' }}>{insight.category} Subscriptions</p>
                    <p style={{ fontSize:'12px', color:'var(--text2)' }}>Based on {insight.totalUsers} users</p>
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.03)', borderLeft:'3px solid #60A5FA', padding:'12px', borderRadius:'0 8px 8px 0' }}>
                  <p style={{ fontSize:'13px', color:'var(--text1)' }}>
                    <span style={{ fontWeight:'700', color:'#60A5FA' }}>Insight:</span> {insight.cancelPercent}% of users cancelled their {insight.category} subscriptions, while {insight.keptPercent}% kept them.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="px" style={{ display:'flex', flexDirection:'column', gap:'16px', paddingBottom:'40px' }}>
        <h2 style={{ fontSize:'18px', fontWeight:'700' }}>Smart Recommendations</h2>

        {loading ? (
          <div style={{ padding:'60px 0', textAlign:'center' }}>
            <div className="anim-float" style={{ marginBottom:'24px' }}>
              <div style={{ fontSize:'48px', marginBottom:'12px' }}>🧠</div>
              <div style={{ 
                height:'4px', width:'200px', background:'rgba(255,255,255,0.1)', 
                margin:'0 auto', borderRadius:'2px', overflow:'hidden', position:'relative' 
              }}>
                <div style={{ 
                  position:'absolute', inset:0, background:'var(--teal)', width:'60%',
                  borderRadius:'2px', animation:'shimmer-bar 1.5s infinite linear'
                }} />
              </div>
            </div>
            <p style={{ color:'var(--text2)', fontSize:'15px', fontWeight:'500' }}>AI is analyzing your spending patterns...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div style={{ textAlign:'center', padding:'64px 0' }} className="anim-up">
            <div style={{ fontSize:'64px', marginBottom:'16px' }}>🏆</div>
            <h3 style={{ fontSize:'22px', fontWeight:'700', marginBottom:'12px' }}>Your Vault is Perfect!</h3>
            <p style={{ color:'var(--text2)', fontSize:'15px' }}>The AI found no waste. You are officially a Declutter Pro.</p>
          </div>
        ) : (
          <div className="grid-responsive" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(350px, 1fr))' }}>
            {suggestions.map((sug, i) => (
              <div key={sug.id} id={`suggestion-${sug.id}`}
                className={`glass anim-up d${Math.min(i+1,5)}`}
                style={{ 
                  padding:'24px', 
                  borderColor: sug.severity==='high'?'rgba(255,77,109,0.2)':sug.severity==='medium'?'rgba(255,184,77,0.15)':'rgba(255,255,255,0.09)',
                  display:'flex', flexDirection:'column'
                }}>

                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                    <span style={{ fontSize:'32px' }}>{sug.icon || '✨'}</span>
                    <div>
                      <p style={{ fontSize:'15px', fontWeight:'700', marginBottom:'4px' }}>{sug.title}</p>
                      <SeverityBadge severity={sug.severity} />
                    </div>
                  </div>
                  <button onClick={() => setDismissed(p=>[...p,sug.id])}
                    style={{ background:'none', border:'none', color:'var(--text3)', cursor:'pointer', fontSize:'22px', lineHeight:1 }}>×</button>
                </div>

                <p style={{ fontSize:'14px', color:'var(--text2)', lineHeight:'1.6', marginBottom:'16px' }}>
                  {sug.desc}
                </p>
                
                {sug.advice && (
                  <div style={{ 
                    background:'rgba(255,255,255,0.03)', borderLeft:'3px solid var(--accent)', 
                    padding:'12px', borderRadius:'0 8px 8px 0', marginBottom:'16px' 
                  }}>
                    <p style={{ fontSize:'13px', color:'var(--text1)', fontStyle:'italic' }}>
                      <span style={{ fontWeight:'700', color:'var(--accent)' }}>AI Insight:</span> {sug.advice}
                    </p>
                  </div>
                )}

                <div style={{ minHeight:'50px', marginTop:'auto' }}>
                  {sug.saving > 0 && (
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'rgba(16,217,160,0.1)', border:'1px solid rgba(16,217,160,0.2)', borderRadius:'99px', padding:'6px 14px', marginBottom:'16px' }}>
                      <span style={{ color:'#10D9A0', fontSize:'12px', fontWeight:'700' }}>💰 Potential Savings: Rs. {sug.saving.toLocaleString()}/yr</span>
                    </div>
                  )}
                </div>

                <div style={{ display:'flex', gap:'10px' }}>
                  <button id={`action-btn-${sug.id}`}
                    className={`btn ${sug.ctaType==='danger'?'btn-danger':sug.ctaType==='teal'?'btn-teal':'btn-primary'}`}
                    style={{ borderRadius:'14px', padding:'12px 20px', fontSize:'14px', flex:1 }}
                    onClick={() => handleAction(sug)}>
                    {sug.cta || 'Take Action'}
                  </button>
                  <button id={`dismiss-btn-${sug.id}`}
                    className="btn btn-ghost"
                    style={{ borderRadius:'14px', padding:'12px 20px', fontSize:'14px', flex:'0 0 auto', width:'auto' }}
                    onClick={() => setDismissed(p=>[...p,sug.id])}>
                    Skip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Savings tracker */}
        {actionDone.length > 0 && (
          <div className="glass anim-bounce" style={{ padding:'20px', textAlign:'center', borderColor:'rgba(16,217,160,0.3)', background:'rgba(16,217,160,0.06)' }}>
            <div style={{ fontSize:'40px', marginBottom:'8px' }}>🎉</div>
            <p style={{ fontFamily:'Sora,sans-serif', fontSize:'18px', fontWeight:'700', color:'#10D9A0', marginBottom:'4px' }}>
              You're decluttering!
            </p>
            <p style={{ color:'var(--text2)', fontSize:'13px' }}>{actionDone.length} action{actionDone.length>1?'s':''} taken this session</p>
          </div>
        )}
      </div>
    </div>
  )
}
