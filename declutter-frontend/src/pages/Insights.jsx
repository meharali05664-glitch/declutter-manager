import { useApp } from '../context/AppContext'

const COLORS = ['#A78BFA','#10D9A0','#FFB84D','#FF4D6D','#60A5FA','#F472B6']

function BarChart({ data }) {
  const max = Math.max(...data.map(d => d.spend))
  return (
    <div style={{ display:'flex', alignItems:'flex-end', gap:'8px', height:'120px', padding:'0 4px' }}>
      {data.map((d, i) => {
        const h = Math.max(8, (d.spend / max) * 100)
        const isLast = i === data.length - 1
        return (
          <div key={d.month} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'6px' }}>
            <p style={{ fontSize:'11px', color: isLast?'#A78BFA':'var(--text3)', fontWeight: isLast?'700':'400' }}>
              Rs.{Math.round(d.spend/1000)}k
            </p>
            <div style={{
              width:'100%', height:`${h}%`, borderRadius:'6px 6px 0 0',
              background: isLast ? 'linear-gradient(180deg,#A78BFA,#4F46E5)' : 'rgba(255,255,255,0.08)',
              transition:'height 1s ease', position:'relative', minHeight:'8px',
            }}>
              {isLast && <div style={{ position:'absolute', inset:0, borderRadius:'6px 6px 0 0', background:'rgba(167,139,250,0.2)', animation:'pulseGlow 2s infinite' }}/>}
            </div>
            <p style={{ fontSize:'10px', color: isLast?'#A78BFA':'var(--text3)', fontWeight: isLast?'600':'400' }}>{d.month}</p>
          </div>
        )
      })}
    </div>
  )
}

function DonutChart({ data, total }) {
  const r = 52, c = 2 * Math.PI * r
  let offset = 0
  const segments = data.map((d, i) => {
    const pct = d.amount / total
    const dash = pct * c
    const seg = { ...d, dash, offset, color: COLORS[i % COLORS.length] }
    offset += dash
    return seg
  })

  return (
    <div style={{ position:'relative', width:'130px', height:'130px' }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        {segments.map((seg, i) => (
          <circle key={i} cx="65" cy="65" r={r}
            fill="none" stroke={seg.color} strokeWidth="14"
            strokeDasharray={`${seg.dash} ${c - seg.dash}`}
            strokeDashoffset={-seg.offset + c * 0.25}
            style={{ transition:'stroke-dasharray 1s ease', opacity:0.9 }}
          />
        ))}
        <circle cx="65" cy="65" r="38" fill="var(--bg2)"/>
        <text x="65" y="60" textAnchor="middle" fill="white" fontSize="13" fontWeight="700" fontFamily="Sora,sans-serif">Total</text>
        <text x="65" y="76" textAnchor="middle" fill="#A78BFA" fontSize="11" fontFamily="Inter,sans-serif">Rs.{Math.round(total/1000)}k</text>
      </svg>
    </div>
  )
}

export default function Insights() {
  const { categoryBreakdown, spendHistory, monthlySpend, activeSubs, savedAmount } = useApp()
  const total = categoryBreakdown.reduce((a, c) => a + c.amount, 0)

  const trend = spendHistory.length >= 2
    ? spendHistory[spendHistory.length-1].spend - spendHistory[spendHistory.length-2].spend
    : 0
  const trendPct = spendHistory.length >= 2
    ? Math.abs(Math.round((trend / spendHistory[spendHistory.length-2].spend) * 100))
    : 0

  return (
    <div className="page">
      {/* Header */}
      <div style={{ background:'linear-gradient(180deg, rgba(96,165,250,0.1) 0%, transparent 100%)', padding:'52px 20px 20px' }}>
        <h1 style={{ fontFamily:'Sora,sans-serif', fontSize:'24px', fontWeight:'800', marginBottom:'4px' }} className="anim-up">
          Insights 📊
        </h1>
        <p style={{ color:'var(--text2)', fontSize:'13px' }} className="anim-up d1">Your spending patterns at a glance</p>
      </div>

      {/* KPI Row */}
      <div className="px" style={{ marginBottom:'24px' }}>
        <div className="grid-responsive">
          {[
            { label:'Monthly Spend', value:`Rs. ${monthlySpend.toLocaleString()}`, sub: trend>=0?`▲ ${trendPct}% vs last month`:`▼ ${trendPct}% vs last month`, subColor: trend>=0?'#FF4D6D':'#10D9A0', icon:'💸' },
            { label:'Saved This Year', value:`Rs. ${savedAmount.toLocaleString()}`, sub:'by decluttering', subColor:'#10D9A0', icon:'🏆' },
            { label:'Avg per Sub',    value:`Rs. ${activeSubs.length ? Math.round(monthlySpend/activeSubs.length).toLocaleString() : 0}`, sub:'monthly', subColor:'var(--text3)', icon:'📦' },
            { label:'Active Subs',   value: activeSubs.length, sub:`across ${[...new Set(activeSubs.map(s=>s.category))].length} categories`, subColor:'var(--text3)', icon:'📋' },
          ].map((k, i) => (
            <div key={k.label} className={`glass anim-up d${i+1}`} style={{ padding:'20px' }}>
              <p style={{ fontSize:'24px', marginBottom:'8px' }}>{k.icon}</p>
              <p style={{ fontSize:'20px', fontWeight:'800', fontFamily:'Sora,sans-serif', marginBottom:'4px' }}>{k.value}</p>
              <p style={{ fontSize:'12px', color:'var(--text3)', marginBottom:'4px' }}>{k.label}</p>
              <p style={{ fontSize:'12px', color:k.subColor, fontWeight:'600' }}>{k.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="px grid-responsive" style={{ marginBottom:'24px', gridTemplateColumns:'repeat(auto-fit, minmax(400px, 1fr))' }}>
        {/* Spend Trend */}
        <div className="glass anim-up d2" style={{ padding:'24px' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'24px' }}>
            <h2 style={{ fontSize:'16px', fontWeight:'700' }}>Spend Trend</h2>
            <span style={{ fontSize:'12px', color: trend>=0?'#FF4D6D':'#10D9A0', fontWeight:'600', background: trend>=0?'rgba(255,77,109,0.1)':'rgba(16,217,160,0.1)', padding:'6px 12px', borderRadius:'99px' }}>
              {trend>=0?'▲':'▼'} {trendPct}% MoM
            </span>
          </div>
          <BarChart data={spendHistory} />
        </div>

        {/* Category Breakdown */}
        <div className="glass anim-up d3" style={{ padding:'24px' }}>
          <h2 style={{ fontSize:'16px', fontWeight:'700', marginBottom:'24px' }}>Category Breakdown</h2>
          <div style={{ display:'flex', alignItems:'center', gap:'32px', marginBottom:'24px', flexWrap:'wrap' }}>
            <DonutChart data={categoryBreakdown} total={total} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:'12px', minWidth:'150px' }}>
              {categoryBreakdown.slice(0,5).map((cat, i) => (
                <div key={cat.name} style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:COLORS[i%COLORS.length], flexShrink:0 }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'13px', fontWeight:'500', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{cat.name}</p>
                  </div>
                  <p style={{ fontSize:'13px', color:'var(--text2)', fontWeight:'700', flexShrink:0 }}>
                    {Math.round((cat.amount/total)*100)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px' }}>
            {categoryBreakdown.map((cat, i) => (
              <div key={cat.name} style={{ marginBottom:'4px' }} id={`cat-bar-${cat.name.toLowerCase().replace(/\s/,'-')}`}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                  <span style={{ fontSize:'12px', color:'var(--text2)', fontWeight:'500' }}>{cat.name}</span>
                  <span style={{ fontSize:'12px', fontWeight:'700' }}>Rs. {cat.amount.toLocaleString()}</span>
                </div>
                <div className="progress" style={{ height:'4px' }}>
                  <div className="progress-fill" style={{ width:`${(cat.amount/total)*100}%`, background: COLORS[i%COLORS.length] }}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Yearly Projection */}
      <div className="px" style={{ marginBottom:'8px' }}>
        <div className="glass anim-up d4" style={{ padding:'20px', background:'linear-gradient(135deg, rgba(124,58,237,0.1), rgba(79,70,229,0.05))' }}>
          <h2 style={{ fontSize:'15px', fontWeight:'700', marginBottom:'12px' }}>📅 Yearly Projection</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'12px', textAlign:'center' }}>
            {[
              { label:'Projected Spend', value:`Rs. ${(monthlySpend*12).toLocaleString()}`, color:'#FF4D6D' },
              { label:'Potential Savings', value:`Rs. ${Math.round(monthlySpend*0.25*12).toLocaleString()}`, color:'#10D9A0' },
              { label:'Net Cost', value:`Rs. ${Math.round(monthlySpend*0.75*12).toLocaleString()}`, color:'#A78BFA' },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize:'15px', fontWeight:'700', color:s.color, marginBottom:'3px', fontFamily:'Sora,sans-serif' }}>{s.value}</p>
                <p style={{ fontSize:'10px', color:'var(--text3)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
