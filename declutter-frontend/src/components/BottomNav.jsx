import { useLocation, useNavigate } from 'react-router-dom'

const TABS = [
  { path:'/dashboard', label:'Home',     icon: HomeIcon },
  { path:'/vault',     label:'Vault',    icon: VaultIcon },
  { path:'/declutter', label:'AI Hub',   icon: SparkIcon },
  { path:'/insights',  label:'Insights', icon: ChartIcon },
  { path:'/settings',  label:'Profile',  icon: UserIcon },
]

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9.5L12 3L21 9.5V20C21 20.6 20.6 21 20 21H15V15H9V21H4C3.4 21 3 20.6 3 20V9.5Z"
        fill={active ? 'url(#gp)' : 'none'} stroke={active ? 'url(#gp)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" strokeLinejoin="round"/>
      <defs><linearGradient id="gp" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
    </svg>
  )
}
function VaultIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="6" width="18" height="14" rx="2.5" stroke={active ? 'url(#gp2)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" fill={active ? 'rgba(124,58,237,0.15)' : 'none'}/>
      <circle cx="12" cy="13" r="2.5" stroke={active ? 'url(#gp2)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7"/>
      <path d="M8 6V4.5C8 3.67 8.67 3 9.5 3H14.5C15.33 3 16 3.67 16 4.5V6" stroke={active ? 'url(#gp2)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" strokeLinecap="round"/>
      <defs><linearGradient id="gp2" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
    </svg>
  )
}
function SparkIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L14.5 9.5H22L16 14.5L18.5 22L12 17.5L5.5 22L8 14.5L2 9.5H9.5L12 2Z"
        fill={active ? 'url(#gp3)' : 'none'} stroke={active ? 'url(#gp3)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" strokeLinejoin="round"/>
      <defs><linearGradient id="gp3" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#10D9A0"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
    </svg>
  )
}
function ChartIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 20H21" stroke={active ? 'url(#gp4)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" strokeLinecap="round"/>
      <rect x="5" y="12" width="3" height="8" rx="1.5" fill={active ? 'url(#gp4)' : 'rgba(255,255,255,0.2)'}/>
      <rect x="10.5" y="8" width="3" height="12" rx="1.5" fill={active ? 'url(#gp4)' : 'rgba(255,255,255,0.2)'}/>
      <rect x="16" y="4" width="3" height="16" rx="1.5" fill={active ? 'url(#gp4)' : 'rgba(255,255,255,0.2)'}/>
      <defs><linearGradient id="gp4" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
    </svg>
  )
}
function UserIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="4" stroke={active ? 'url(#gp5)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7"/>
      <path d="M4 20C4 17.8 7.6 16 12 16C16.4 16 20 17.8 20 20" stroke={active ? 'url(#gp5)' : 'rgba(255,255,255,0.35)'} strokeWidth="1.7" strokeLinecap="round"/>
      <defs><linearGradient id="gp5" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#A78BFA"/><stop offset="1" stopColor="#60A5FA"/></linearGradient></defs>
    </svg>
  )
}

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const AUTH_ROUTES = ['/login', '/register', '/onboarding']
  if (AUTH_ROUTES.includes(location.pathname)) return null

  return (
    <nav className="bottom-nav" id="bottom-nav">
      <div style={{ display:'flex', justifyContent:'space-around', alignItems:'center' }}>
        {TABS.map(tab => {
          const active = location.pathname === tab.path
          const Icon = tab.icon
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              id={`nav-${tab.label.toLowerCase().replace(' ','-')}`}
              style={{
                background:'none', border:'none', cursor:'pointer',
                display:'flex', flexDirection:'column', alignItems:'center', gap:'4px',
                padding:'4px 12px', transition:'all 0.2s',
                transform: active ? 'translateY(-2px)' : 'none',
              }}
            >
              <Icon active={active} />
              <span style={{
                fontSize:'10px', fontWeight: active ? '600' : '400',
                color: active ? '#A78BFA' : 'rgba(255,255,255,0.35)',
                fontFamily:'Inter,sans-serif',
                transition:'color 0.2s',
              }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
