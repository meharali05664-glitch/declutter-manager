import { useState, useRef, useEffect } from 'react'
import { useApp } from '../context/AppContext'

export default function NotificationBell() {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, fetchNotifications } = useApp()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleOpen = () => {
    if (!isOpen) fetchNotifications()
    setIsOpen(!isOpen)
  }

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <div 
        onClick={toggleOpen}
        id="notification-bell"
        style={{ 
          width: '38px', height: '38px', borderRadius: '12px', 
          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: '16px', cursor: 'pointer', position: 'relative' 
        }}>
        🔔
        {unreadCount > 0 && (
          <div style={{ 
            position: 'absolute', top: '-4px', right: '-4px', 
            background: '#FF4D6D', color: 'white', borderRadius: '50%', 
            width: '18px', height: '18px', fontSize: '10px', fontWeight: 'bold',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(255,77,109,0.4)', border: '2px solid #0F172A'
          }}>
            {unreadCount}
          </div>
        )}
      </div>

      {isOpen && (
        <div className="glass" style={{ 
          position: 'absolute', top: '48px', right: '0', width: '280px', 
          maxHeight: '400px', overflowY: 'auto', zIndex: 1000,
          background: 'rgba(30, 41, 59, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
          padding: '12px 0'
        }}>
          <div style={{ padding: '0 16px 12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>Notifications</h3>
            {unreadCount > 0 && (
              <span 
                onClick={markAllNotificationsAsRead}
                style={{ fontSize: '11px', color: '#A78BFA', cursor: 'pointer' }}>
                Mark all read
              </span>
            )}
          </div>
          
          <div style={{ padding: '8px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => (
                <div 
                  key={n.id}
                  onClick={() => {
                    markNotificationAsRead(n.id)
                    setIsOpen(false)
                  }}
                  style={{ 
                    padding: '12px 16px', 
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                    background: n.isRead ? 'transparent' : 'rgba(124,58,237,0.05)',
                    cursor: 'pointer',
                    transition: 'background 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = n.isRead ? 'transparent' : 'rgba(124,58,237,0.05)'}
                >
                  <p style={{ fontSize: '13px', fontWeight: n.isRead ? '500' : '700', color: 'white', marginBottom: '4px' }}>{n.title}</p>
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', lineHeight: '1.4' }}>{n.message}</p>
                  <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
