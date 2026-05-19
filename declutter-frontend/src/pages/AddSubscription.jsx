import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const QUICK_ADD = [
  { name:'YouTube Premium', icon:'▶️', color:'#FF0000', amount:400,  category:'Entertainment', billingCycle:'monthly', cancelDifficulty:'yellow' },
  { name:'Hotstar',         icon:'⭐', color:'#1F80E0', amount:699,  category:'Entertainment', billingCycle:'monthly', cancelDifficulty:'yellow' },
  { name:'Adobe CC',        icon:'🎨', color:'#FF0000', amount:3200, category:'Productivity',   billingCycle:'monthly', cancelDifficulty:'yellow' },
  { name:'Microsoft 365',   icon:'📊', color:'#F25022', amount:1200, category:'Productivity',   billingCycle:'yearly',  cancelDifficulty:'yellow' },
  { name:'Udemy',           icon:'🎓', color:'#A435F0', amount:1500, category:'Education',      billingCycle:'monthly', cancelDifficulty:'green'  },
  { name:'SlideShare',      icon:'📑', color:'#0077B5', amount:0,    category:'Productivity',   billingCycle:'monthly', cancelDifficulty:'green'  },
  { name:'N8N',             icon:'⚡', color:'#FF6C37', amount:0,    category:'Productivity',   billingCycle:'monthly', cancelDifficulty:'green'  },
  { name:'Other',           icon:'➕', color:'#8B8DB8', amount:0,    category:'Other',           billingCycle:'monthly', cancelDifficulty:'yellow' },
]

const CATEGORIES = ['Entertainment','Music','Productivity','Education','Health','Security','Finance','Utilities','Other']
const CYCLES = ['monthly','yearly','weekly','quarterly']
const DIFFICULTIES = [
  { val:'green',  label:'1-Click (Easy)',       color:'#10D9A0' },
  { val:'yellow', label:'Web Portal (Medium)',   color:'#FFB84D' },
  { val:'red',    label:'Call Required (Hard)',  color:'#FF4D6D' },
]
const PAYMENT_METHODS = ['Nayapay','JazzCash','SadaPay','Easypaisa','HBL','Meezan Bank','Credit Card','Cash','Other']

function nextMonthDate() {
  const d = new Date(); d.setMonth(d.getMonth()+1)
  return d.toISOString().split('T')[0]
}

function nextWeekDate() {
  const d = new Date(); d.setDate(d.getDate()+7)
  return d.toISOString().split('T')[0]
}

export default function AddSubscription() {
  const navigate = useNavigate()
  const { addSubscription } = useApp()
  const [mode, setMode] = useState('quick')      // quick | manual
  const [quickSelected, setQuickSelected] = useState(null)
  const [form, setForm] = useState({
    name:'', icon:'📦', color:'#7C3AED', amount:'', billingCycle:'monthly',
    nextRenewal: nextMonthDate(), category:'Entertainment', cancelDifficulty:'yellow',
    paymentMethod:'Nayapay', isShared:false, sharedWith:'', notes:'',
    isTrial:false, trialEndDate: nextWeekDate(), postTrialAmount:''
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedData, setExtractedData] = useState(false)
  const [advice, setAdvice] = useState(null)
  const [loadingAdvice, setLoadingAdvice] = useState(false)
  const fileInputRef = useRef(null)


  const pickQuick = (svc) => {
    setQuickSelected(svc.name)
    setForm(f => ({ ...f, name:svc.name, icon:svc.icon, color:svc.color, amount:String(svc.amount), billingCycle:svc.billingCycle, category:svc.category, cancelDifficulty:svc.cancelDifficulty, isTrial:false }))
    setMode('manual')
    setExtractedData(false)
  }

  const readFileAsDataURL = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setExtracting(true)
    try {
      const base64String = await readFileAsDataURL(file)
      
      const token = localStorage.getItem('token') || ''
      const headers = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_BASE}/ai/extract-receipt`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          imageBase64: base64String,
          mimeType: file.type
        })
      })

      if (!res.ok) {
        const errData = await res.json().catch(()=>({}))
        throw new Error(errData.error || 'Extraction failed')
      }
      const data = await res.json()

      let amt = data.amount ? String(data.amount).replace(/[^0-9.]/g, '') : ''
      
      setForm(f => ({
        ...f,
        name: data.name || f.name,
        amount: amt || f.amount,
        nextRenewal: data.nextRenewal || f.nextRenewal,
        isTrial: data.isTrial ?? f.isTrial,
        trialEndDate: data.trialEndDate || f.trialEndDate,
        postTrialAmount: data.postTrialAmount ? String(data.postTrialAmount) : f.postTrialAmount
      }))
      setExtractedData(true)
      setMode('manual')
    } catch (err) {
      console.error(err)
      alert('Failed to extract data. You may need to add GEMINI_API_KEY to the backend .env file. Please enter manually.')
    } finally {
      setExtracting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!form.name || form.name.length < 2) {
      setAdvice(null)
      return
    }

    const handler = setTimeout(async () => {
      setLoadingAdvice(true)
      try {
        const token = localStorage.getItem('declutter_token')
        const headers = {}
        if (token) headers['Authorization'] = `Bearer ${token}`

        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
        const res = await fetch(`${API_BASE}/ai/advice/add?name=${encodeURIComponent(form.name)}`, { headers })
        if (res.ok) {
          const data = await res.json()
          setAdvice(data)
        } else {
          setAdvice(null)
        }
      } catch (err) {
        console.error(err)
        setAdvice(null)
      } finally {
        setLoadingAdvice(false)
      }
    }, 600)

    return () => clearTimeout(handler)
  }, [form.name]) // Wait, React imports are already at top


  const handleSave = async () => {
    if (!form.name.trim() || (form.amount === '' && !form.isTrial)) return
    setLoading(true)
    try {
      await addSubscription({
        ...form,
        amount: parseFloat(form.amount || 0),
        myShare: form.isShared && form.sharedWith
          ? Math.round(parseFloat(form.amount || 0) / (form.sharedWith.split(',').length + 1))
          : parseFloat(form.amount || 0),
        sharedWith: form.sharedWith ? form.sharedWith.split(',').map(s=>s.trim()) : [],
        status:'active', usageHours:0, isZombie:false,
        isTrial: form.isTrial,
        trialEndDate: form.isTrial ? form.trialEndDate : null,
        postTrialAmount: form.isTrial && form.postTrialAmount ? parseFloat(form.postTrialAmount) : null
      })
      setSuccess(true)
      setTimeout(() => navigate('/vault'), 1200)
    } catch (err) {
      alert('Failed to save subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const F = (k, v) => setForm(f => ({...f, [k]:v}))

  if (success) return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'40px' }}>
      <div style={{ fontSize:'64px', marginBottom:'16px' }} className="anim-bounce">✅</div>
      <h2 style={{ fontFamily:'Sora,sans-serif', fontSize:'22px', fontWeight:'800', marginBottom:'8px', textAlign:'center' }}>Subscription Added!</h2>
      <p style={{ color:'var(--text2)', textAlign:'center' }}>Redirecting to your vault…</p>
    </div>
  )

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg,rgba(16,217,160,0.08) 0%,transparent 100%)', padding:'52px 20px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'4px' }}>
          <button onClick={() => navigate(-1)} style={{ background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'12px', width:'36px', height:'36px', color:'var(--text)', fontSize:'16px', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>←</button>
          <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'22px', fontWeight:'800' }}>Add Subscription</h1>
        </div>
        <p style={{ color:'var(--text2)', fontSize:'13px', marginLeft:'48px' }}>Track a new service or bill</p>
      </div>

      {/* Mode Toggle */}
      <div className="px" style={{ marginBottom:'20px' }}>
        <div style={{ display:'flex', background:'rgba(255,255,255,0.04)', borderRadius:'14px', padding:'4px', gap:'4px' }}>
          {[['quick','⚡ Quick Add'],['manual','✏️ Manual']].map(([m,l]) => (
            <button key={m} id={`mode-${m}`} onClick={() => setMode(m)}
              style={{ flex:1, padding:'10px', border:'none', borderRadius:'10px', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:'14px', fontWeight:'600', transition:'all 0.2s',
                background: mode===m ? 'linear-gradient(135deg,#7C3AED,#4F46E5)' : 'transparent',
                color: mode===m ? 'white' : 'var(--text2)',
              }}>{l}</button>
          ))}
        </div>
      </div>

      {mode === 'quick' ? (
        <div className="px">
          <p style={{ fontSize:'13px', color:'var(--text2)', marginBottom:'14px' }}>Tap a service to auto-fill details:</p>
          <div className="grid-responsive" style={{ gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))', gap:'12px', marginBottom:'24px' }}>
            {QUICK_ADD.map((svc, i) => (
              <button key={svc.name} id={`quick-${svc.name.toLowerCase().replace(/\s/g,'-')}`}
                onClick={() => pickQuick(svc)}
                className={`anim-up d${Math.min(i%3+1,5)}`}
                style={{
                  background: quickSelected===svc.name ? `${svc.color}22` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${quickSelected===svc.name ? svc.color+'55' : 'rgba(255,255,255,0.08)'}`,
                  borderRadius:'18px', padding:'20px 10px', cursor:'pointer',
                  display:'flex', flexDirection:'column', alignItems:'center', gap:'8px',
                  transition:'all 0.2s',
                }}>
                <span style={{ fontSize:'32px' }}>{svc.icon}</span>
                <span style={{ fontSize:'12px', fontWeight:'600', color:'var(--text)', textAlign:'center', lineHeight:'1.2' }}>{svc.name}</span>
                {svc.amount > 0 && <span style={{ fontSize:'11px', color:'var(--text3)' }}>Rs.{svc.amount}</span>}
              </button>
            ))}
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'8px' }}>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} id="receipt-upload" />
            <button className="btn" onClick={() => fileInputRef.current?.click()} style={{ background: 'rgba(255,255,255,0.06)', color:'var(--text)', border:'1px solid rgba(255,255,255,0.1)' }} disabled={extracting}>
              {extracting ? '📸 Analyzing Receipt...' : '📸 Upload Receipt / Screenshot'}
            </button>
            <button className="btn btn-ghost" onClick={() => setMode('manual')}>Enter Manually Instead</button>
          </div>
        </div>
      ) : (
        <div className="px" style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {/* AI Banner */}
          {extractedData && (
            <div className="anim-down" style={{ background: 'rgba(16, 217, 160, 0.1)', border: '1px solid rgba(16, 217, 160, 0.3)', borderRadius: '12px', padding: '12px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ fontSize: '20px' }}>✨</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '13px', color: '#10D9A0', fontWeight: '600', marginBottom: '2px' }}>AI Extracted Successfully</p>
                <p style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.4' }}>Please review the extracted details and edit if necessary before saving.</p>
              </div>
            </div>
          )}

          {/* Name + Icon row */}
          <div style={{ display:'flex', gap:'10px' }}>
            <div style={{ flexShrink:0 }}>
              <label className="input-label">Icon</label>
              <input id="icon-input" className="input" type="text" value={form.icon} onChange={e=>F('icon',e.target.value)}
                style={{ width:'60px', textAlign:'center', fontSize:'22px', padding:'10px 8px' }}/>
            </div>
            <div style={{ flex:1 }}>
              <label className="input-label">Service Name *</label>
              <input id="name-input" className="input" type="text" placeholder="e.g. YouTube, Udemy, ISP…"
                value={form.name} onChange={e=>F('name',e.target.value)}/>
            </div>
          </div>

          {/* AI Pre-purchase Advice */}
          {loadingAdvice && (
            <div style={{ background: 'rgba(var(--theme-rgb), 0.03)', border: '1px dashed rgba(var(--theme-rgb), 0.15)', borderRadius: '14px', padding: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🤖</span>
              <span style={{ fontSize: '13px', color: 'var(--text2)' }}>Retrieving community advice...</span>
            </div>
          )}
          {!loadingAdvice && advice && (
            <div className="anim-up" style={{ 
              background: advice.recommendation === 'buy' ? 'rgba(16, 217, 160, 0.06)' : advice.recommendation === 'avoid' ? 'rgba(255, 77, 109, 0.06)' : 'rgba(255, 184, 77, 0.06)', 
              border: `1px solid ${advice.recommendation === 'buy' ? 'rgba(16, 217, 160, 0.2)' : advice.recommendation === 'avoid' ? 'rgba(255, 77, 109, 0.2)' : 'rgba(255, 184, 77, 0.2)'}`, 
              borderRadius: '14px', padding: '16px' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <p style={{ 
                  fontSize: '14px', fontWeight: '800', 
                  color: advice.recommendation === 'buy' ? '#10D9A0' : advice.recommendation === 'avoid' ? '#FF4D6D' : '#FFB84D' 
                }}>
                  ✨ AI Advice: {advice.title}
                </p>
                <span style={{ 
                  fontSize: '10px', fontWeight: '800', padding: '2px 8px', borderRadius: '99px',
                  background: advice.recommendation === 'buy' ? 'rgba(16, 217, 160, 0.15)' : advice.recommendation === 'avoid' ? 'rgba(255, 77, 109, 0.15)' : 'rgba(255, 184, 77, 0.15)',
                  color: advice.recommendation === 'buy' ? '#10D9A0' : advice.recommendation === 'avoid' ? '#FF4D6D' : '#FFB84D' 
                }}>
                  {advice.recommendation.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: '1.4', marginBottom: '8px' }}>
                {advice.text}
              </p>
              {advice.tips && (
                <p style={{ fontSize: '12px', color: 'var(--text2)', fontStyle: 'italic', borderTop: '1px solid rgba(var(--theme-rgb), 0.05)', paddingTop: '6px' }}>
                  💡 <strong>Tip:</strong> {advice.tips}
                </p>
              )}
            </div>
          )}

          {/* Amount + Cycle */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label className="input-label">Amount (Rs.) *</label>
              <input id="amount-input" className="input" type="number" placeholder="1500"
                value={form.amount} onChange={e=>F('amount',e.target.value)}/>
            </div>
            <div>
              <label className="input-label">Billing Cycle</label>
              <select id="cycle-select" className="input" value={form.billingCycle} onChange={e=>F('billingCycle',e.target.value)} style={{ appearance:'none' }}>
                {CYCLES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
              </select>
            </div>
          </div>

          {/* Renewal Date + Category */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <div>
              <label className="input-label">Next Renewal</label>
              <input id="renewal-input" className="input" type="date" value={form.nextRenewal} onChange={e=>F('nextRenewal',e.target.value)}
                style={{ colorScheme:'dark' }}/>
            </div>
            <div>
              <label className="input-label">Category</label>
              <select id="category-select" className="input" value={form.category} onChange={e=>F('category',e.target.value)} style={{ appearance:'none' }}>
                {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="input-label">Payment Method</label>
            <select id="payment-select" className="input" value={form.paymentMethod} onChange={e=>F('paymentMethod',e.target.value)} style={{ appearance:'none' }}>
              {PAYMENT_METHODS.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* Cancel Difficulty */}
          <div>
            <label className="input-label">Cancellation Difficulty</label>
            <div style={{ display:'flex', gap:'8px' }}>
              {DIFFICULTIES.map(d => (
                <button key={d.val} id={`diff-${d.val}`} onClick={() => F('cancelDifficulty',d.val)}
                  style={{ flex:1, padding:'10px 4px', borderRadius:'12px', cursor:'pointer', fontFamily:'Inter,sans-serif', fontSize:'11px', fontWeight:'600', transition:'all 0.2s', border:`1px solid ${form.cancelDifficulty===d.val?d.color+'66':'rgba(255,255,255,0.08)'}`,
                    background: form.cancelDifficulty===d.val ? `${d.color}18` : 'rgba(255,255,255,0.03)',
                    color: form.cancelDifficulty===d.val ? d.color : 'var(--text3)',
                  }}>{d.label.split(' (')[0]}</button>
              ))}
            </div>
          </div>

          {/* Free Trial Toggle */}
          <div className="glass" style={{ padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: form.isTrial?'12px':'0' }}>
              <div>
                <p style={{ fontSize:'14px', fontWeight:'600' }}>🎁 This is a Free Trial</p>
                <p style={{ fontSize:'12px', color:'var(--text3)' }}>Track end date and get reminded</p>
              </div>
              <label className="toggle">
                <input id="trial-toggle" type="checkbox" checked={form.isTrial} onChange={e=>F('isTrial',e.target.checked)}/>
                <span className="slider"/>
              </label>
            </div>
            {form.isTrial && (
              <div className="anim-up" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
                <div>
                  <label className="input-label">Trial End Date</label>
                  <input id="trial-end-input" className="input" type="date" value={form.trialEndDate} onChange={e=>F('trialEndDate',e.target.value)}
                    style={{ colorScheme:'dark' }}/>
                </div>
                <div>
                  <label className="input-label">Amount after trial (Rs.)</label>
                  <input id="post-trial-amount" className="input" type="number" placeholder="1500"
                    value={form.postTrialAmount} onChange={e=>F('postTrialAmount',e.target.value)}/>
                </div>
              </div>
            )}
          </div>

          {/* Shared Subscription */}
          <div className="glass" style={{ padding:'16px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: form.isShared?'12px':'0' }}>
              <div>
                <p style={{ fontSize:'14px', fontWeight:'600' }}>🤝 Shared Subscription</p>
                <p style={{ fontSize:'12px', color:'var(--text3)' }}>Split cost with family/friends</p>
              </div>
              <label className="toggle">
                <input id="shared-toggle" type="checkbox" checked={form.isShared} onChange={e=>F('isShared',e.target.checked)}/>
                <span className="slider"/>
              </label>
            </div>
            {form.isShared && (
              <div className="anim-up">
                <label className="input-label">Shared with (comma separated)</label>
                <input id="shared-with-input" className="input" type="text" placeholder="Ali, Sara, Ahmed"
                  value={form.sharedWith} onChange={e=>F('sharedWith',e.target.value)}/>
                {form.sharedWith && (
                  <p style={{ fontSize:'12px', color:'#A78BFA', marginTop:'8px' }}>
                    Your share: Rs. {form.amount ? Math.round(parseFloat(form.amount)/(form.sharedWith.split(',').length+1)).toLocaleString() : '—'}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="input-label">Notes (optional)</label>
            <textarea id="notes-input" className="input" rows={2} placeholder="e.g. shared family plan, student discount…"
              value={form.notes} onChange={e=>F('notes',e.target.value)} style={{ resize:'none', lineHeight:'1.5' }}/>
          </div>

          {/* CTA */}
          <button id="save-sub-btn" className="btn btn-primary" onClick={handleSave}
            style={{ marginBottom:'8px', opacity: loading ? 0.7 : 1 }} disabled={!form.name || (form.amount === '' && !form.isTrial) || loading}>
            {loading ? '💾 Saving…' : '💾 Save Subscription'}
          </button>
          <button className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
        </div>
      )}
    </div>
  )
}