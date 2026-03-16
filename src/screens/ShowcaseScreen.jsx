import { useEffect, useState, useRef } from 'react'
import { getAllUserItems, upsertProfile, uploadAvatar, getCollections } from '../lib/api.js'
import { Badge, ProgressBar, EmptyState, Spinner, Btn } from '../components/UI.jsx'

export default function ShowcaseScreen({ user, profile, onProfileUpdated, onQR }) {
  const [cols,      setCols]      = useState([])
  const [userItems, setUserItems] = useState([])
  const [editing,   setEditing]   = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [loading,   setLoading]   = useState(true)
  const [form,      setForm]      = useState({ handle:'', location:'', bio:'', collector_note:'' })
  const fileRef = useRef(null)

  useEffect(() => {
    setForm({
      handle:         profile?.handle         || '',
      location:       profile?.location       || '',
      bio:            profile?.bio            || '',
      collector_note: profile?.collector_note || '',
    })
    Promise.all([getCollections(), getAllUserItems(user.id)]).then(([c, ui]) => {
      setCols(c.data || [])
      setUserItems(ui.data || [])
      setLoading(false)
    })
  }, [profile])

  const pinnedItems = userItems.filter(ui => ui.pinned && ui.item)
  const ownedCount  = userItems.filter(ui => ui.owned).length
  const totalItems  = cols.reduce((s, c) => s + c.total, 0)

  const getColProgress = (col) => {
    const count = userItems.filter(ui => ui.item?.collection_id === col.id && ui.owned).length
    return { count, pct: col.total > 0 ? Math.round((count / col.total) * 100) : 0 }
  }

  const saveProfile = async () => {
    setSaving(true)
    await upsertProfile(user.id, form)
    onProfileUpdated()
    setSaving(false)
    setEditing(false)
  }

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setSaving(true)
    const { url } = await uploadAvatar(user.id, file)
    if (url) { await upsertProfile(user.id, { avatar_url: url }); onProfileUpdated() }
    setSaving(false)
  }

  const handle = profile?.handle || 'collector'

  return (
    <div>
      {/* Profile hero */}
      <div style={{ margin: '12px 16px 0', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '22px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, bottom: -18, fontFamily: 'var(--font-d)', fontSize: 80, fontWeight: 900, color: 'rgba(212,168,71,0.04)', pointerEvents: 'none' }}>STASHD</div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
          <div onClick={() => fileRef.current?.click()} style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload}/>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--line2)' }}/>
              : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg4)', border: '2px solid var(--line2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontSize: 14, color: 'var(--muted)' }}>{handle.slice(0,2).toUpperCase()}</div>
            }
            <div style={{ position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9 }}>✎</div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--gold)', marginBottom: 2 }}>@{handle}</div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1 }}>{handle}</div>
            {profile?.location && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>📍 {profile.location}</div>}
          </div>
          <button onClick={() => setEditing(!editing)} style={{ background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: 'var(--r-sm)', padding: '6px 12px', color: 'var(--subtle)', fontSize: 12, cursor: 'pointer' }}>
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <input placeholder="Handle (no @)" value={form.handle} onChange={e => setForm(p=>({...p,handle:e.target.value}))} style={{ fontSize: 13 }}/>
            <input placeholder="Location" value={form.location} onChange={e => setForm(p=>({...p,location:e.target.value}))} style={{ fontSize: 13 }}/>
            <textarea placeholder="Bio" rows={2} value={form.bio} onChange={e => setForm(p=>({...p,bio:e.target.value}))} style={{ fontSize: 13, resize: 'none' }}/>
            <textarea placeholder="Collector note (shown on your showcase)" rows={2} value={form.collector_note} onChange={e => setForm(p=>({...p,collector_note:e.target.value}))} style={{ fontSize: 13, resize: 'none' }}/>
            <Btn onClick={saveProfile} size="sm" disabled={saving}>{saving ? <Spinner size={13}/> : 'Save profile'}</Btn>
          </div>
        ) : (
          <>
            {profile?.bio && <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 12 }}>{profile.bio}</div>}
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 18, color: 'var(--heading)' }}>{ownedCount}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Owned</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 18, color: 'var(--heading)' }}>{pinnedItems.length}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Pinned</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-m)', fontSize: 18, color: 'var(--heading)' }}>{totalItems > 0 ? Math.round((ownedCount/totalItems)*100) : 0}%</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1, textTransform: 'uppercase' }}>Complete</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Share */}
      <div style={{ padding: '16px 16px 0' }}>
        <button onClick={onQR} style={{ width: '100%', padding: '11px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', color: 'var(--subtle)', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}>
          ▣ Share showcase · Generate QR
        </button>
      </div>

      {/* Collections */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 12 }}>My Collections</div>
        {loading ? <Spinner size={20}/> : cols.map(col => {
          const { count, pct } = getColProgress(col)
          return (
            <div key={col.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 14, display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--r-sm)', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 14, fontWeight: 900, color: 'var(--muted)', flexShrink: 0, border: '1px solid var(--line2)', overflow: 'hidden' }}>
                {col.cover_url ? <img src={col.cover_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : col.abbr}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>{col.title}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, marginBottom: 6 }}>{col.year} · {count}/{col.total}</div>
                <ProgressBar pct={pct}/>
              </div>
              <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--gold)', flexShrink: 0 }}>{pct}%</div>
            </div>
          )
        })}
      </div>

      {/* Pinned */}
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 18, fontWeight: 700, color: 'var(--heading)', marginBottom: 12 }}>Pinned Pieces</div>
        {pinnedItems.length === 0
          ? <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6 }}>Open any item and tap the star to pin it here.</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
              {pinnedItems.map(ui => {
                const photo = ui.item_photos?.[0]?.url || ui.user_item_photos?.[0]?.url
                return (
                  <div key={ui.id} style={{ background: 'var(--bg2)', border: '1px solid var(--gold)30', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
                    {photo
                      ? <img src={photo} style={{ width: '100%', height: 70, objectFit: 'cover' }}/>
                      : <div style={{ width: '100%', height: 70, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 900, color: 'var(--line2)' }}>
                          {ui.item.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                        </div>
                    }
                    <div style={{ padding: '8px 8px 10px' }}>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--muted)' }}>#{ui.item.number}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.2, marginTop: 1 }}>{ui.item.name}</div>
                      <div style={{ color: 'var(--gold)', fontSize: 10, marginTop: 4 }}>★ Pinned</div>
                    </div>
                  </div>
                )
              })}
            </div>
        }
      </div>

      {/* Collector note */}
      {profile?.collector_note && (
        <div style={{ margin: '16px 16px 0', padding: '14px 16px', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)' }}>
          <div style={{ fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>Collector Note</div>
          <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.7, fontStyle: 'italic' }}>"{profile.collector_note}"</div>
        </div>
      )}
      <div style={{ height: 16 }}/>
    </div>
  )
}
