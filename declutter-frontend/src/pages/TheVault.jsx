import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const CATEGORIES = ['All','Entertainment','Music','Productivity','Health','Security']
const STATUS_TABS = ['active','paused','cancelled']
const DIFF = {
  green:  { label:'Easy',   color:'#10D9A0' },
  yellow: { label:'Medium', color:'#FFB84D' },
  red:    { label:'Hard',   color:'#FF4D6D' },
}

function daysUntil(dateStr) {
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

export default function TheVault() {
  const navigate = useNavigate()
  const { subscriptions, updateSubscription, deleteSubscription } = useApp()
  const [catFilter, setCatFilter] = useState('All')
  const [statusTab, setStatusTab] = useState('active')
  const [sort, setSort] = useState('renewal')
  const [selected, setSelected] = useState(null)
  const [cancellingSub, setCancellingSub] = useState(null)
  const [cancelAdvice, setCancelAdvice] = useState(null)
  const [loadingCancelAdvice, setLoadingCancelAdvice] = useState(false)

  useEffect(() => {
    if (!cancellingSub) {
      setCancelAdvice(null)
      return
    }

    const fetchAdvice = async () => {
      setLoadingCancelAdvice(true)
      try {
        const token = localStorage.getItem('declutter_token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const res = await fetch(`${API_BASE}/ai/advice/cancel?id=${cancellingSub.id}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setCancelAdvice(data)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCancelAdvice(false)
      }
    }

    fetchAdvice()
  }, [cancellingSub])

  let filtered = subscriptions.filter(s => s.status === statusTab)
  if (catFilter !== 'All') filtered = filtered.filter(s => s.category === catFilter)
  if (sort === 'amount') filtered = [...filtered].sort((a,b) => b.myShare - a.myShare)
  else if (sort === 'renewal') filtered = [...filtered].sort((a,b) => new Date(a.nextRenewal) - new Date(b.nextRenewal))
  else if (sort === 'name') filtered = [...filtered].sort((a,b) => a.name.localeCompare(b.name))

  const totalShown = filtered.reduce((a,s) => a + s.myShare, 0)
  
  const trialSubs = filtered.filter(s => s.isTrial)
  const regularSubs = filtered.filter(s => !s.isTrial)

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg, rgba(124,58,237,0.12) 0%, transparent 100%)', padding:'52px 20px 16px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'4px' }} className="anim-up">
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'24px', fontWeight:'800' }}>The Vault 🔐</h1>
          <button onClick={() => navigate('/add')} id="vault-add-btn"
            style={{ background:'linear-gradient(135deg,#7C3AED,#4F46E5)', border:'none', borderRadius:'12px', padding:'8px 16px', color:'white', fontSize:'13px', fontWeight:'600', cursor:'pointer' }}>
            + Add
          </button>
        </div>
        <p style={{ color:'var(--text2)', fontSize:'13px' }}>{subscriptions.filter(s => s.status === 'active').length} active subscriptions tracked</p>
      </div>

      {/* Status Tabs */}
      <div className="px" style={{ marginBottom:'16px' }}>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'4px', gap:'2px' }}>
          {STATUS_TABS.map(t => (
            <button key={t} id={`status-tab-${t}`}
              onClick={() => setStatusTab(t)}
              style={{
                flex:1, padding:'8px', border:'none', borderRadius:'10px', cursor:'pointer',
                background: statusTab===t ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'transparent',
                color: statusTab===t ? 'white' : 'var(--text2)',
                fontSize:'13px', fontWeight:'600', fontFamily:'Inter,sans-serif', transition:'all 0.2s',
                textTransform:'capitalize',
              }}>
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter */}
      <div className="scroll-x" style={{ marginBottom:'12px' }}>
        <div style={{ display:'flex', gap:'8px', padding:'0 20px' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} id={`cat-filter-${cat}`}
              className={`chip ${catFilter===cat?'active':''}`}
              onClick={() => setCatFilter(cat)}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + Total */}
      <div className="px" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'14px' }}>
        <p style={{ fontSize:'13px', color:'var(--text2)' }}>
          <span style={{ color:'white', fontWeight:'600' }}>{filtered.length}</span> subs · Rs. <span style={{ color:'#A78BFA', fontWeight:'600' }}>{totalShown.toLocaleString()}</span>/mo
        </p>
        <select id="sort-select" onChange={e => setSort(e.target.value)} value={sort}
          style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'var(--text2)', fontSize:'12px', padding:'6px 10px', outline:'none', fontFamily:'Inter,sans-serif', cursor:'pointer' }}>
          <option value="renewal">Sort: Renewal</option>
          <option value="amount">Sort: Amount</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      {/* Subscription List */}
      <div className="px grid-responsive" style={{ paddingBottom:'40px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:'center', padding:'48px 0', gridColumn:'1/-1' }}>
            <div style={{ fontSize:'48px', marginBottom:'12px' }}>📭</div>
            <p style={{ color:'var(--text2)' }}>No {statusTab} subscriptions</p>
          </div>
        ) : (
          <>
            {trialSubs.length > 0 && (
              <div style={{ gridColumn:'1/-1', marginBottom:'8px' }}>
                <h2 style={{ fontSize:'16px', fontWeight:'700', color:'#10D9A0' }}>🎁 Free Trials</h2>
              </div>
            )}
            {trialSubs.map((sub, i) => renderSub(sub, i))}
            
            {regularSubs.length > 0 && trialSubs.length > 0 && (
              <div style={{ gridColumn:'1/-1', marginTop:'16px', marginBottom:'8px' }}>
                <h2 style={{ fontSize:'16px', fontWeight:'700' }}>Active Subscriptions</h2>
              </div>
            )}
            {regularSubs.map((sub, i) => renderSub(sub, i))}
          </>
        )}
      </div>
      {/* Pre-Cancel RAG AI Advice Modal */}
      {cancellingSub && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="glass anim-bounce" style={{ maxWidth: '400px', width: '100%', padding: '24px', background: 'var(--bg2)', border: '1px solid rgba(var(--theme-rgb), 0.1)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '800', marginBottom: '12px', fontFamily: 'Sora, sans-serif' }}>
              Cancel {cancellingSub.name}?
            </h3>

            {loadingCancelAdvice ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <span style={{ fontSize: '24px' }}>🤖</span>
                <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '8px' }}>Declutter AI is reviewing community stats...</p>
              </div>
            ) : cancelAdvice ? (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ background: 'rgba(var(--theme-rgb), 0.04)', borderRadius: '12px', padding: '14px', marginBottom: '14px', borderLeft: `4px solid ${cancelAdvice.recommendation === 'cancel' ? '#FF4D6D' : '#10D9A0'}` }}>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: cancelAdvice.recommendation === 'cancel' ? '#FF4D6D' : '#10D9A0', marginBottom: '6px' }}>
                    Recommendation: {cancelAdvice.recommendation === 'cancel' ? 'Cancel Service' : 'Keep / Pause'}
                  </p>
                  <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>
                    {cancelAdvice.text}
                  </p>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(var(--theme-rgb), 0.03)', padding: '10px 12px', borderRadius: '8px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text2)' }}>Estimated Savings:</span>
                  <strong style={{ color: '#10D9A0' }}>Rs. {cancelAdvice.savings}</strong>
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: 'var(--text2)', marginBottom: '20px' }}>
                Are you sure you want to cancel this subscription? You will save Rs. {(cancellingSub.myShare * 12).toLocaleString()} per year.
              </p>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button id="confirm-cancel-btn" onClick={() => {
                updateSubscription(cancellingSub.id, { status: 'cancelled' });
                setCancellingSub(null);
              }} className="btn btn-danger" style={{ flex: 1, padding: '12px' }}>
                Yes, Cancel
              </button>
              <button onClick={() => setCancellingSub(null)} className="btn btn-ghost" style={{ flex: 1, padding: '12px' }}>
                Keep It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  function renderSub(sub, i) {
    const isTrial = sub.isTrial
    const days = daysUntil(isTrial ? sub.trialEndDate : sub.nextRenewal)
    const isOpen = selected === sub.id
    const diff = DIFF[sub.cancelDifficulty]
    const amountLabel = isTrial ? (sub.amount > 0 ? `Rs. ${sub.amount}` : 'Free') : `Rs. ${sub.myShare.toLocaleString()}`

    return (
      <div key={sub.id} id={`vault-card-${sub.id}`}
        style={{ borderRadius:'20px', overflow:'hidden', transition:'all 0.3s', height:'fit-content', border: isTrial ? '1px solid rgba(16,217,160,0.3)' : 'none' }}>
        {/* Main row */}
        <div className="glass" onClick={() => setSelected(isOpen ? null : sub.id)}
          style={{ padding:'18px 20px', display:'flex', alignItems:'center', gap:'16px', cursor:'pointer', borderRadius: isOpen ? '20px 20px 0 0' : '20px', borderBottomColor: isOpen ? 'transparent' : undefined, background: isTrial ? 'rgba(16,217,160,0.05)' : '' }}>
          <div style={{ width:'52px', height:'52px', borderRadius:'14px', background:`${sub.color}22`, border:`1px solid ${sub.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'28px', flexShrink:0 }}>
            {sub.icon}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', gap:'6px', marginBottom:'4px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'16px', fontWeight:'600' }}>{sub.name}</span>
              {isTrial && <span className="tag" style={{ fontSize:'9px', background:'rgba(16,217,160,0.15)', color:'#10D9A0' }}>🎁 Trial</span>}
              {sub.isZombie && <span className="tag tag-rose" style={{ fontSize:'9px' }}>🧟 Zombie</span>}
              {sub.isShared && <span className="tag tag-blue" style={{ fontSize:'9px' }}>🤝 Shared</span>}
            </div>
            <p style={{ fontSize:'12px', color:'var(--text2)' }}>{sub.category} · {sub.billingCycle}</p>
            <p style={{ fontSize:'11px', color: days<=3?'#FF4D6D':'var(--text3)', marginTop:'3px' }}>
              {isTrial ? 'Ends ' : 'Renews '}{days<=0?'today':days===1?'tomorrow':`in ${days}d`} · {sub.paymentMethod || 'No payment'}
            </p>
          </div>
          <div style={{ textAlign:'right', flexShrink:0 }}>
            <p style={{ fontSize:'18px', fontWeight:'700' }}>{amountLabel}</p>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', justifyContent:'flex-end', marginTop:'4px' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:diff.color }}/>
              <span style={{ fontSize:'10px', color:diff.color }}>{diff.label}</span>
            </div>
          </div>
        </div>

        {/* Expanded Panel */}
        {isOpen && (
          <div className="anim-in" style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderTop:'none', borderRadius:'0 0 20px 20px', padding:'16px' }}>
            {isTrial && (
              <div style={{ marginBottom:'12px', padding:'10px 12px', background:'rgba(16,217,160,0.08)', borderRadius:'12px', border:'1px solid rgba(16,217,160,0.15)' }}>
                <p style={{ fontSize:'12px', color:'#10D9A0', fontWeight:'600' }}>🎁 Free Trial ends on {new Date(sub.trialEndDate).toLocaleDateString()}</p>
                {sub.postTrialAmount > 0 && <p style={{ fontSize:'11px', color:'var(--text2)', marginTop:'2px' }}>Will charge Rs. {sub.postTrialAmount.toLocaleString()} after trial</p>}
              </div>
            )}
            {sub.isShared && (
              <div style={{ marginBottom:'12px', padding:'10px 12px', background:'rgba(96,165,250,0.08)', borderRadius:'12px', border:'1px solid rgba(96,165,250,0.15)' }}>
                <p style={{ fontSize:'12px', color:'#60A5FA', fontWeight:'600', marginBottom:'4px' }}>🤝 Shared with</p>
                <p style={{ fontSize:'13px', color:'var(--text)' }}>{sub.sharedWith.join(', ')} · Total Rs. {sub.amount.toLocaleString()} · Your share Rs. {sub.myShare.toLocaleString()}</p>
              </div>
            )}
            {sub.isZombie && (
              <div style={{ marginBottom:'12px', padding:'10px 12px', background:'rgba(255,77,109,0.08)', borderRadius:'12px', border:'1px solid rgba(255,77,109,0.15)' }}>
                <p style={{ fontSize:'12px', color:'#FF4D6D' }}>🧟 This subscription hasn't been used in 30+ days. Consider cancelling to save Rs. {(sub.myShare*12).toLocaleString()}/yr.</p>
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'12px' }}>
              {[
                { label:'Usage/month', value:`${sub.usageHours}h` },
                { label:'Since', value: sub.createdAt.slice(0,7) },
                { label:'Cancel', value: `${diff.label}` },
                { label:'Full price', value:`Rs. ${sub.amount.toLocaleString()}` },
              ].map(({label,value}) => (
                <div key={label} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'10px' }}>
                  <p style={{ fontSize:'11px', color:'var(--text3)', marginBottom:'2px' }}>{label}</p>
                  <p style={{ fontSize:'13px', fontWeight:'600' }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'8px' }}>
              <button id={`pause-btn-${sub.id}`} onClick={() => updateSubscription(sub.id, { status: sub.status==='active'?'paused':'active' })}
                className="btn btn-ghost" style={{ padding:'10px', fontSize:'12px', borderRadius:'12px' }}>
                {sub.status==='active' ? '⏸ Pause' : '▶ Resume'}
              </button>
              <button id={`cancel-btn-${sub.id}`} onClick={() => setCancellingSub(sub)}
                className="btn" style={{ padding:'10px', fontSize:'12px', borderRadius:'12px', background:'rgba(255,77,109,0.15)', border:'1px solid rgba(255,77,109,0.25)', color:'#FF4D6D' }}>
                ✕ Cancel
              </button>
              <button id={`delete-btn-${sub.id}`} onClick={() => { deleteSubscription(sub.id); setSelected(null) }}
                className="btn" style={{ padding:'10px', fontSize:'12px', borderRadius:'12px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'var(--text3)' }}>
                🗑 Delete
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }
}
