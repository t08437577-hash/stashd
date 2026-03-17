import { useEffect, useState, useRef } from 'react'
import { getItems, getUserItems, upsertUserItem, uploadUserPhoto, deleteUserPhoto } from '../lib/api.js'
import { ProgressBar, Chip, Badge, CondBadge, Card, EmptyState, Spinner, Btn, Divider, IconToggle, SectionHeader } from '../components/UI.jsx'

// ── COLLECTION SCREEN ─────────────────────────────────────────────────────────
export default function CollectionScreen({ collection, user, onBack, onItemTap }) {
  const [items,     setItems]     = useState([])
  const [userItems, setUserItems] = useState({}) // itemId → userItem row
  const [filter,    setFilter]    = useState('all')
  const [search,    setSearch]    = useState('')
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    load()
  }, [collection.id])

  const load = async () => {
    setLoading(true)
    const [{ data: its }, { data: uis }] = await Promise.all([
      getItems(collection.id),
      getUserItems(user.id, collection.id),
    ])
    setItems(its || [])
    const map = {}
    for (const ui of uis || []) map[ui.item_id] = ui
    setUserItems(map)
    setLoading(false)
  }

  const ownedCount = items.filter(i => userItems[i.id]?.owned).length
  const pct        = items.length > 0 ? Math.round((ownedCount / items.length) * 100) : 0

  const counts = {
    all:      items.length,
    owned:    items.filter(i => userItems[i.id]?.owned).length,
    missing:  items.filter(i => !userItems[i.id]?.owned && !userItems[i.id]?.wishlisted).length,
    wishlist: items.filter(i => userItems[i.id]?.wishlisted).length,
    trade:    items.filter(i => userItems[i.id]?.for_trade).length,
  }

  const filtered = items
    .filter(i => !search || i.name.toLowerCase().includes(search.toLowerCase()) || String(i.number).includes(search))
    .filter(i => {
      const ui = userItems[i.id]
      if (filter === 'owned')    return ui?.owned
      if (filter === 'missing')  return !ui?.owned && !ui?.wishlisted
      if (filter === 'wishlist') return ui?.wishlisted
      if (filter === 'trade')    return ui?.for_trade
      return true
    })

  return (
    <div>
      {/* Header */}
      <div style={{ padding: '14px 16px 16px' }}>
        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, fontWeight: 500, marginBottom: 14, padding: 0, cursor: 'pointer' }}>
          ← Back
        </button>
        {collection.cover_url && (
          <img src={collection.cover_url} alt={collection.title}
            style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 'var(--r-lg)', marginBottom: 14, border: '1px solid var(--line)' }}/>
        )}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1 }}>{collection.title}</div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{collection.year} · {collection.total} items</div>
          </div>
          <Badge style={{ flexShrink: 0, marginTop: 4 }}>{collection.abbr}</Badge>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
          <div style={{ flex: 1 }}><ProgressBar pct={pct} h={4}/></div>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 12, color: 'var(--gold)', whiteSpace: 'nowrap' }}>{ownedCount}/{collection.total}</div>
        </div>
        {collection.description && <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10, lineHeight: 1.6 }}>{collection.description}</div>}
      </div>

      {/* Search */}
      <div style={{ padding: '0 16px 12px' }}>
        <input placeholder="Search by name or number…" value={search} onChange={e => setSearch(e.target.value)}/>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 14px', overflowX: 'auto' }}>
        {[['all','All'],['owned','Owned'],['missing','Missing'],['wishlist','Wishlist'],['trade','Trading']].map(([f,l]) => (
          <Chip key={f} active={filter === f} onClick={() => setFilter(f)} count={counts[f]}>{l}</Chip>
        ))}
      </div>

      {/* Grid */}
      {loading
        ? <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spinner size={28}/></div>
        : filtered.length === 0
          ? <EmptyState icon="🔍" title="Nothing here" body="Try a different filter or search term."/>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '0 16px' }}>
              {filtered.map(item => {
                const ui = userItems[item.id]
                const photo = item.item_photos?.[0]?.url || ui?.user_item_photos?.[0]?.url
                const owned = ui?.owned
                const wish  = ui?.wishlisted
                const trade = ui?.for_trade
                const cond  = ui?.condition
                const dups  = ui?.duplicates || 0
                const statusColor = owned ? 'var(--gold)' : wish ? 'var(--sage)' : 'var(--line2)'

                return (
                  <div key={item.id} onClick={() => onItemTap(item, ui, load)}
                    style={{
                      background: 'var(--bg2)', border: `1px solid ${statusColor}40`,
                      borderRadius: 'var(--r-md)', overflow: 'hidden', cursor: 'pointer',
                      opacity: !owned && !wish ? .5 : 1, transition: 'all .12s',
                    }}
                  >
                    {photo
                      ? <img src={photo} alt={item.name} style={{ width: '100%', height: 80, objectFit: 'cover' }}/>
                      : <div style={{ width: '100%', height: 80, background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 900, color: 'var(--line2)' }}>
                          {item.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                        </div>
                    }
                    <div style={{ padding: '10px 10px 8px' }}>
                      <div style={{ fontFamily: 'var(--font-m)', fontSize: 9, color: 'var(--muted)', marginBottom: 2 }}>#{item.number}</div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--heading)', lineHeight: 1.3, marginBottom: 6 }}>{item.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, flexShrink: 0 }}/>
                        {cond && <CondBadge cond={cond}/>}
                        {trade && <Badge variant="rust" style={{ fontSize: 9, padding: '1px 5px' }}>TRADE</Badge>}
                        {dups > 0 && <Badge variant="muted" style={{ fontSize: 9, padding: '1px 5px' }}>×{dups+1}</Badge>}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )
      }
      <div style={{ height: 16 }}/>
    </div>
  )
}

// ── ITEM MODAL ────────────────────────────────────────────────────────────────
export function ItemModal({ item, collection, userItem: initialUI, user, isAdmin, onClose, onSaved, showToast }) {
  const [ui,       setUi]       = useState(initialUI || {})
  const [saving,   setSaving]   = useState(false)
  const [imgSide,  setImgSide]  = useState('front')
  const [uploading,setUploading]= useState(false)
  const fileRef = useRef(null)

  const allPhotos = [
    ...(item.item_photos || []).map(p => ({ ...p, isOfficial: true })),
    ...(ui.user_item_photos || []).map(p => ({ ...p, isOfficial: false })),
  ]
  const frontPhotos = allPhotos.filter(p => p.side === 'front')
  const backPhotos  = allPhotos.filter(p => p.side === 'back')
  const curPhotos   = imgSide === 'front' ? frontPhotos : backPhotos

  const save = async (patch) => {
    setSaving(true)
    const merged = { ...ui, ...patch }
    setUi(merged)
    await upsertUserItem(user.id, item.id, {
      owned:      merged.owned      || false,
      wishlisted: merged.wishlisted || false,
      pinned:     merged.pinned     || false,
      for_trade:  merged.for_trade  || false,
      duplicates: merged.duplicates || 0,
      condition:  merged.condition  || null,
    })
    setSaving(false)
    onSaved()
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    const { data, error } = await uploadUserPhoto(user.id, item.id, file, imgSide)
    if (error) showToast('Upload failed: ' + error.message)
    else {
      setUi(p => ({ ...p, user_item_photos: [...(p.user_item_photos || []), data] }))
      showToast('Photo uploaded')
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeUserPhoto = async (photo) => {
    await deleteUserPhoto(photo.id)
    setUi(p => ({ ...p, user_item_photos: (p.user_item_photos || []).filter(x => x.id !== photo.id) }))
    showToast('Photo removed')
  }

  const initials = item.name.split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ background: 'var(--bg2)', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 430, maxHeight: '92vh', overflowY: 'auto', border: '1px solid var(--line)' }}>
        <div style={{ width: 36, height: 3, background: 'var(--line2)', borderRadius: 999, margin: '14px auto 0' }}/>

        {/* Header */}
        <div style={{ padding: '14px 20px 16px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)', letterSpacing: 1, marginBottom: 4 }}>#{item.number} · {collection.abbr} · {collection.year}</div>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 22, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>{collection.title}</div>
        </div>

        <div style={{ padding: 20 }}>
          {/* Photo toggle */}
          {(frontPhotos.length > 0 || backPhotos.length > 0) && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              {['front','back'].map(s => (
                <button key={s} onClick={() => setImgSide(s)} style={{ flex: 1, padding: '7px', borderRadius: 'var(--r-sm)', border: `1px solid ${imgSide===s ? 'var(--gold2)' : 'var(--line2)'}`, background: imgSide===s ? 'var(--gold-dim)' : 'var(--bg3)', color: imgSide===s ? 'var(--gold)' : 'var(--muted)', fontSize: 12, fontWeight: 500 }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          )}

          {/* Photos */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10, overflowX: 'auto', paddingBottom: 4 }}>
            {curPhotos.map(p => (
              <div key={p.id} style={{ position: 'relative', flexShrink: 0 }}>
                <img src={p.url} alt={item.name} style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 'var(--r-md)', border: '1px solid var(--line)' }}/>
                {!p.isOfficial && (
                  <button onClick={() => removeUserPhoto(p)} style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                )}
                {p.isOfficial && <Badge variant="muted" style={{ position: 'absolute', bottom: 4, left: 4, fontSize: 9 }}>Official</Badge>}
              </div>
            ))}
            {curPhotos.length === 0 && (
              <div style={{ width: 120, height: 120, background: 'var(--bg4)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 28, fontWeight: 900, color: 'var(--line2)' }}>{initials}</div>
            )}
          </div>

          {/* Upload — only admins can upload official photos */}
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload}/>
          {isAdmin && (
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              style={{ width: '100%', padding: '9px', border: '1px dashed var(--line2)', borderRadius: 'var(--r-sm)', background: 'none', color: 'var(--muted)', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 16, cursor: 'pointer' }}>
              {uploading ? <Spinner size={14}/> : '↑'} {uploading ? 'Uploading…' : `Upload ${imgSide} photo`}
            </button>
          )}
          {!isAdmin && <div style={{ marginBottom: 16 }}/>}

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              { key: 'owned',     label: 'Owned',              sub: ui.owned     ? 'In your stash' : 'Not owned',      color: 'gold' },
              { key: 'wishlisted',label: 'Wishlist',            sub: ui.wishlisted? 'On your list'  : 'Not wishlisted', color: 'sage' },
            ].map(row => (
              <div key={row.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)' }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{row.sub}</div>
                </div>
                <IconToggle active={!!ui[row.key]} activeColor={row.color} onClick={() => save({ [row.key]: !ui[row.key] })}>
                  {saving ? <Spinner size={13}/> : ui[row.key] ? '✓' : '+'}
                </IconToggle>
              </div>
            ))}

            {ui.owned && (
              <>
                {/* Condition */}
                <div style={{ padding: '13px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', marginBottom: 6 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)', marginBottom: 8 }}>Condition</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['Mint','Good','Fair','Worn'].map(c => (
                      <button key={c} onClick={() => save({ condition: ui.condition === c ? null : c })}
                        style={{ flex: 1, padding: '7px 4px', borderRadius: 'var(--r-sm)', fontSize: 11, fontWeight: 600,
                          border: `1px solid ${ui.condition===c ? 'var(--gold2)' : 'var(--line2)'}`,
                          background: ui.condition===c ? 'var(--gold-dim)' : 'var(--bg4)',
                          color: ui.condition===c ? 'var(--gold)' : 'var(--muted)', cursor: 'pointer' }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duplicates */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)' }}>Duplicates</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{ui.duplicates||0} extra {(ui.duplicates||0)===1?'copy':'copies'}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={() => save({ duplicates: Math.max(0,(ui.duplicates||0)-1) })} style={{ width:30,height:30,borderRadius:'var(--r-sm)',border:'1px solid var(--line2)',background:'var(--bg4)',color:'var(--body)',cursor:'pointer',fontSize:16 }}>−</button>
                    <span style={{ fontFamily:'var(--font-m)',fontSize:15,color:'var(--heading)',minWidth:20,textAlign:'center' }}>{ui.duplicates||0}</span>
                    <button onClick={() => save({ duplicates: (ui.duplicates||0)+1 })} style={{ width:30,height:30,borderRadius:'var(--r-sm)',border:'1px solid var(--line2)',background:'var(--bg4)',color:'var(--body)',cursor:'pointer',fontSize:16 }}>+</button>
                  </div>
                </div>

                {/* Trade */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)', marginBottom: 6 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)' }}>Available for Trade</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{ui.for_trade ? 'Listed on trade board' : 'Not listed'}</div>
                  </div>
                  <IconToggle active={!!ui.for_trade} activeColor="rust" onClick={() => save({ for_trade: !ui.for_trade })}>
                    ⇄
                  </IconToggle>
                </div>
              </>
            )}

            {/* Pin */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 14px', background: 'var(--bg3)', borderRadius: 'var(--r-sm)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--heading)' }}>Pin to Showcase</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{ui.pinned ? 'Featured on your profile' : 'Not pinned'}</div>
              </div>
              <IconToggle active={!!ui.pinned} activeColor="gold" onClick={() => save({ pinned: !ui.pinned })}>★</IconToggle>
            </div>
          </div>

          <Btn onClick={onClose} full style={{ marginTop: 16 }} variant="ghost">Done</Btn>
        </div>
      </div>
    </div>
  )
}
