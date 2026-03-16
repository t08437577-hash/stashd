import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase.js'
import { getProfile, getCollections } from './lib/api.js'
import AuthScreen    from './components/AuthScreen.jsx'
import Onboarding    from './components/Onboarding.jsx'
import QRModal       from './components/QRModal.jsx'
import { Toast, Spinner, ProgressBar, Badge } from './components/UI.jsx'
import { Icons }     from './components/Icons.jsx'
import HomeScreen    from './screens/HomeScreen.jsx'
import CollectionScreen, { ItemModal } from './screens/CollectionScreen.jsx'
import TradeScreen   from './screens/TradeScreen.jsx'
import ShowcaseScreen from './screens/ShowcaseScreen.jsx'
import AdminPanel    from './admin/AdminPanel.jsx'

// ── Inline collections list ───────────────────────────────────────────────────
function CollectionsList({ onTap }) {
  const [cols, setCols] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCollections().then(({ data }) => { setCols(data || []); setLoading(false) })
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}><Spinner size={28}/></div>
  )

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: 'var(--heading)', marginBottom: 16 }}>
        Collections
      </div>
      {cols.map(col => (
        <div
          key={col.id}
          onClick={() => onTap(col)}
          style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', marginBottom: 10, overflow: 'hidden', cursor: 'pointer', transition: 'border-color .12s' }}
        >
          {col.cover_url && (
            <img src={col.cover_url} alt={col.title} style={{ width: '100%', height: 100, objectFit: 'cover' }}/>
          )}
          <div style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--heading)' }}>{col.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{col.year} · {col.total} items</div>
              </div>
              <Badge style={{ flexShrink: 0 }}>{col.abbr}</Badge>
            </div>
            {col.description && (
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 10 }}>{col.description}</div>
            )}
            <ProgressBar pct={0} h={3}/>
          </div>
        </div>
      ))}
    </div>
  )
}

const NAV = [
  ['home',     'Home',     Icons.home],
  ['collect',  'Collect',  Icons.grid],
  ['trade',    'Trade',    Icons.trade],
  ['showcase', 'Showcase', Icons.showcase],
]

export default function App() {
  const [session,   setSession]   = useState(undefined) // undefined = loading
  const [profile,   setProfile]   = useState(null)
  const [tab,       setTab]       = useState('home')
  const [screen,    setScreen]    = useState('home')
  const [activeCol, setActiveCol] = useState(null)
  const [selItem,   setSelItem]   = useState(null)  // { item, userItem, reload }
  const [showQR,    setShowQR]    = useState(false)
  const [showAdmin, setShowAdmin] = useState(false)
  const [toast,     setToast]     = useState('')

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2000)
  }, [])

  // ── Auth listener ──────────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) loadProfile(data.session.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) loadProfile(s.user.id)
      else   setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await getProfile(userId)
    setProfile(data)
  }

  const refreshProfile = () => {
    if (session?.user?.id) loadProfile(session.user.id)
  }

  // ── Loading state ──────────────────────────────────────────────────────────
  if (session === undefined) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <Spinner size={32}/>
      </div>
    )
  }

  // ── Not logged in ──────────────────────────────────────────────────────────
  if (!session) return <AuthScreen onAuth={() => {}}/>

  // ── Onboarding ─────────────────────────────────────────────────────────────
  if (profile && !profile.onboarded) {
    return <Onboarding userId={session.user.id} onDone={refreshProfile}/>
  }

  // ── Admin panel ─────────────────────────────────────────────────────────────
  if (showAdmin && profile?.is_admin) {
    return <AdminPanel user={session.user} onBack={() => setShowAdmin(false)}/>
  }

  // ── Nav helper ─────────────────────────────────────────────────────────────
  const navTo = (t) => {
    setTab(t)
    setScreen(t)
    setSelItem(null)
  }

  const goCollection = (col) => {
    setActiveCol(col)
    setScreen('collection')
    setTab('collect')
  }

  const initials = (profile?.handle || session.user.email || 'ME')
    .replace('@','').slice(0,2).toUpperCase()

  const navItems = profile?.is_admin
    ? [...NAV, ['admin', 'Admin', Icons.admin]]
    : NAV

  return (
    <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px', background: 'var(--bg)', borderBottom: '1px solid var(--line)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 900, color: 'var(--heading)', letterSpacing: '-.5px' }}>
          ST<em style={{ color: 'var(--gold)', fontStyle: 'normal' }}>A</em>SHD
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {profile?.is_admin && (
            <button
              onClick={() => setShowAdmin(true)}
              style={{ background: 'var(--rust-dim)', border: '1px solid var(--rust)40', borderRadius: 'var(--r-sm)', padding: '5px 10px', color: 'var(--rust)', fontSize: 11, fontWeight: 600, cursor: 'pointer', letterSpacing: '.3px' }}
            >
              ADMIN
            </button>
          )}
          <div
            onClick={() => navTo('showcase')}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg3)', border: '1px solid var(--line2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}
          >
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
              : <span style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)', fontWeight: 500 }}>{initials}</span>
            }
          </div>
        </div>
      </div>

      {/* ── Screens ── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 80 }}>
        {screen === 'home' && (
          <HomeScreen
            user={session.user}
            profile={profile}
            onCollectionTap={goCollection}
            onGoCollections={() => navTo('collect')}
          />
        )}

        {screen === 'collect' && !activeCol && (
          <CollectionsList onTap={goCollection}/>
        )}

        {screen === 'collection' && activeCol && (
          <CollectionScreen
            collection={activeCol}
            user={session.user}
            onBack={() => { setScreen('collect'); setActiveCol(null) }}
            onItemTap={(item, userItem, reload) => setSelItem({ item, userItem, reload })}
          />
        )}

        {screen === 'trade' && (
          <TradeScreen user={session.user} profile={profile}/>
        )}

        {screen === 'showcase' && (
          <ShowcaseScreen
            user={session.user}
            profile={profile}
            onProfileUpdated={refreshProfile}
            onQR={() => setShowQR(true)}
          />
        )}
      </div>

      {/* ── Bottom nav ── */}
      <div style={{ position: 'sticky', bottom: 0, background: 'var(--bg)', borderTop: '1px solid var(--line)', display: 'flex', padding: '6px 0 18px', zIndex: 200 }}>
        {NAV.map(([t, label, icon]) => {
          const active = tab === t
          return (
            <button
              key={t}
              onClick={() => navTo(t)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, background: 'none', border: 'none', padding: '6px 4px', cursor: 'pointer' }}
            >
              <div style={{ color: active ? 'var(--gold)' : 'var(--muted)', display: 'flex', transition: 'color .15s' }}>
                {icon}
              </div>
              <span style={{ fontSize: 10, fontWeight: active ? 600 : 400, color: active ? 'var(--gold)' : 'var(--muted)', letterSpacing: '.3px', transition: 'color .15s' }}>
                {label}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Modals ── */}
      {selItem && (
        <ItemModal
          item={selItem.item}
          collection={activeCol}
          userItem={selItem.userItem}
          user={session.user}
          onClose={() => setSelItem(null)}
          onSaved={() => { selItem.reload(); showToast('Saved') }}
          showToast={showToast}
        />
      )}

      {showQR && <QRModal profile={profile} onClose={() => setShowQR(false)}/>}

      <Toast msg={toast}/>
    </div>
  )
}


