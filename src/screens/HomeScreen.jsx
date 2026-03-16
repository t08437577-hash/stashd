import { useEffect, useState } from 'react'
import { getCollections, getAllUserItems } from '../lib/api.js'
import { ProgressBar, SectionHeader, Card, Badge, EmptyState, Spinner } from '../components/UI.jsx'

export default function HomeScreen({ user, profile, onCollectionTap, onGoCollections }) {
  const [collections, setCollections] = useState([])
  const [userItems,   setUserItems]   = useState([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      getCollections(),
      getAllUserItems(user.id),
    ]).then(([c, ui]) => {
      setCollections(c.data || [])
      setUserItems(ui.data || [])
      setLoading(false)
    })
  }, [user.id])

  const ownedSet  = new Set(userItems.filter(x => x.owned).map(x => x.item_id))
  const totalOwned = ownedSet.size
  const totalItems = collections.reduce((s, c) => s + c.total, 0)
  const pctGlobal  = totalItems > 0 ? Math.round((totalOwned / totalItems) * 100) : 0

  const getColProgress = (col) => {
    const colItems = userItems.filter(ui => ui.item?.collection_id === col.id && ui.owned)
    return { count: colItems.length, pct: col.total > 0 ? Math.round((colItems.length / col.total) * 100) : 0 }
  }

  const recentOwned = userItems
    .filter(x => x.owned && x.item)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 6)

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <Spinner size={28}/>
    </div>
  )

  return (
    <div>
      {/* Hero */}
      <div style={{ margin: '12px 16px 0', background: 'linear-gradient(135deg, var(--bg3) 0%, var(--bg2) 100%)', borderRadius: 'var(--r-xl)', padding: '24px 22px', border: '1px solid var(--line)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'var(--gold)', opacity: .04, borderRadius: '50%' }}/>
        <div style={{ position: 'absolute', bottom: -50, left: -10, width: 130, height: 130, background: 'var(--rust)', opacity: .04, borderRadius: '50%' }}/>
        <div style={{ fontSize: 10, letterSpacing: 2.5, color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8 }}>
          {profile?.handle ? `@${profile.handle}` : 'Your Stash'}
        </div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.05, marginBottom: 20 }}>
          Track your <em style={{ color: 'var(--gold)', fontStyle: 'italic' }}>stash.</em><br/>Show the world.
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 1, background: 'var(--line)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
          {[['Owned', totalOwned], ['Missing', totalItems - totalOwned], ['Complete', `${pctGlobal}%`]].map(([l, v]) => (
            <div key={l} style={{ background: 'var(--bg3)', padding: '12px 8px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 22, color: 'var(--heading)', fontWeight: 500 }}>{v}</div>
              <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>

        {profile?.location && (
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>📍</span> {profile.location}
          </div>
        )}
      </div>

      {/* Collections */}
      <SectionHeader title="Collections" action={onGoCollections} actionLabel="View all"/>
      <div style={{ display: 'flex', gap: 12, padding: '0 16px', overflowX: 'auto' }}>
        {collections.map(col => {
          const { count, pct } = getColProgress(col)
          return (
            <div key={col.id} onClick={() => onCollectionTap(col)}
              style={{ minWidth: 170, background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 16, cursor: 'pointer', flexShrink: 0, transition: 'border-color .15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--line2)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--line)'}
            >
              {col.cover_url
                ? <img src={col.cover_url} alt={col.title} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 'var(--r-sm)', marginBottom: 10 }}/>
                : <div style={{ width: '100%', height: 80, background: 'var(--bg4)', borderRadius: 'var(--r-sm)', marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 24, fontWeight: 900, color: 'var(--line2)' }}>{col.abbr}</div>
              }
              <Badge style={{ marginBottom: 8 }}>{col.abbr}</Badge>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.3, marginBottom: 4 }}>{col.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 10 }}>{col.year} · {col.total} items</div>
              <ProgressBar pct={pct}/>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 11, color: 'var(--gold)', marginTop: 6 }}>{count}/{col.total} — {pct}%</div>
            </div>
          )
        })}
        {collections.length === 0 && <div style={{ padding: '16px 0', color: 'var(--muted)', fontSize: 13 }}>No collections yet.</div>}
      </div>

      {/* Recently added */}
      <SectionHeader title="Recently Added"/>
      {recentOwned.length === 0
        ? <EmptyState icon="📦" title="Your stash is empty" body="Tap a collection above, then tap any item to mark it owned."/>
        : (
          <div style={{ padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {recentOwned.map(ui => (
              <div key={ui.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '12px 14px' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>#{ui.item?.number}</div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)', lineHeight: 1.3 }}>{ui.item?.name}</div>
                {ui.condition && <div style={{ marginTop: 6 }}><Badge variant="green" style={{ fontSize: 10 }}>{ui.condition}</Badge></div>}
              </div>
            ))}
          </div>
        )
      }
      <div style={{ height: 16 }}/>
    </div>
  )
}
