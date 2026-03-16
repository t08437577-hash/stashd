import { useEffect, useState, useRef } from 'react'
import {
  getAllCollectionsAdmin, upsertCollection, deleteCollection, uploadCollectionCover,
  getItems, upsertItem, deleteItem, uploadItemPhoto, deleteItemPhoto,
  getAllUsers, setAdminRole, getAllPosts, moderatePost,
} from '../lib/api.js'
import { Btn, Badge, Spinner, Divider, EmptyState } from '../components/UI.jsx'

// ── TABS ──────────────────────────────────────────────────────────────────────
const TABS = ['Collections', 'Items', 'Users', 'Posts']

export default function AdminPanel({ user, onBack }) {
  const [tab, setTab] = useState('Collections')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin top bar */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--line)', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 13, cursor: 'pointer', padding: 0 }}>← App</button>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, color: 'var(--heading)', flex: 1 }}>Admin</div>
        <Badge variant="rust">ADMIN</Badge>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', background: 'var(--bg2)', borderBottom: '1px solid var(--line)', padding: '0 16px', gap: 0, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '12px 16px', background: 'none', border: 'none', borderBottom: `2px solid ${tab===t ? 'var(--gold)' : 'transparent'}`,
            color: tab===t ? 'var(--gold)' : 'var(--muted)', fontSize: 13, fontWeight: tab===t ? 600 : 400, whiteSpace: 'nowrap', cursor: 'pointer',
          }}>{t}</button>
        ))}
      </div>

      <div style={{ padding: 16, maxWidth: 800, margin: '0 auto' }}>
        {tab === 'Collections' && <CollectionsAdmin/>}
        {tab === 'Items'       && <ItemsAdmin/>}
        {tab === 'Users'       && <UsersAdmin/>}
        {tab === 'Posts'       && <PostsAdmin/>}
      </div>
    </div>
  )
}

// ── COLLECTIONS ADMIN ─────────────────────────────────────────────────────────
function CollectionsAdmin() {
  const [cols,    setCols]    = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const coverRef = useRef(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await getAllCollectionsAdmin()
    setCols(data || [])
    setLoading(false)
  }

  const startNew = () => {
    setForm({ slug:'', title:'', abbr:'', year:'', description:'', total:0, sort_order:0, published:true })
    setEditing('new')
  }

  const startEdit = (col) => {
    setForm({ ...col })
    setEditing(col.id)
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, total: parseInt(form.total)||0, sort_order: parseInt(form.sort_order)||0 }
    if (editing === 'new') delete payload.id
    const { error } = await upsertCollection(payload)
    if (!error) { await load(); setEditing(null) }
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Delete this collection and all its items?')) return
    await deleteCollection(id)
    await load()
  }

  const uploadCover = async (e, colId) => {
    const file = e.target.files?.[0]; if (!file) return
    const { url } = await uploadCollectionCover(colId, file)
    if (url) { await upsertCollection({ id: colId, cover_url: url }); await load() }
  }

  if (loading) return <div style={{ padding: 40, display: 'flex', justifyContent: 'center' }}><Spinner size={24}/></div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--heading)' }}>Collections ({cols.length})</div>
        <Btn onClick={startNew} size="sm">+ New Collection</Btn>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--gold)40', borderRadius: 'var(--r-lg)', padding: 18, marginBottom: 18 }}>
          <div style={{ fontFamily: 'var(--font-d)', fontSize: 16, fontWeight: 700, color: 'var(--heading)', marginBottom: 14 }}>
            {editing === 'new' ? 'New Collection' : 'Edit Collection'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
            <div><label style={lbl}>Title</label><input value={form.title||''} onChange={e=>setForm(p=>({...p,title:e.target.value}))}/></div>
            <div><label style={lbl}>Slug</label><input value={form.slug||''} onChange={e=>setForm(p=>({...p,slug:e.target.value}))} placeholder="yugioh-metal-tazo"/></div>
            <div><label style={lbl}>Abbr</label><input value={form.abbr||''} onChange={e=>setForm(p=>({...p,abbr:e.target.value}))} placeholder="MT"/></div>
            <div><label style={lbl}>Year</label><input value={form.year||''} onChange={e=>setForm(p=>({...p,year:e.target.value}))} placeholder="2000"/></div>
            <div><label style={lbl}>Total Items</label><input type="number" value={form.total||0} onChange={e=>setForm(p=>({...p,total:e.target.value}))}/></div>
            <div><label style={lbl}>Sort Order</label><input type="number" value={form.sort_order||0} onChange={e=>setForm(p=>({...p,sort_order:e.target.value}))}/></div>
          </div>
          <div style={{ marginBottom: 10 }}><label style={lbl}>Description</label><textarea rows={2} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'none' }}/></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <input type="checkbox" id="pub" checked={!!form.published} onChange={e=>setForm(p=>({...p,published:e.target.checked}))} style={{ width:'auto' }}/>
            <label htmlFor="pub" style={{ fontSize: 13, color: 'var(--body)', cursor: 'pointer' }}>Published (visible to users)</label>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={save} size="sm" disabled={saving}>{saving ? <Spinner size={13}/> : 'Save'}</Btn>
            <Btn onClick={() => setEditing(null)} size="sm" variant="ghost">Cancel</Btn>
          </div>
        </div>
      )}

      {/* List */}
      {cols.map(col => (
        <div key={col.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: 'var(--bg4)', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-d)', fontSize: 14, fontWeight: 900, color: 'var(--muted)', border: '1px solid var(--line2)', cursor: 'pointer', position: 'relative' }}
              onClick={() => coverRef.current?.click()}>
              {col.cover_url ? <img src={col.cover_url} style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : col.abbr}
              <input ref={coverRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e=>uploadCover(e,col.id)}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>{col.title}</div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{col.year} · {col.total} items · #{col.sort_order}</div>
            </div>
            {!col.published && <Badge variant="muted">Draft</Badge>}
            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              <Btn onClick={() => startEdit(col)} size="sm" variant="ghost">Edit</Btn>
              <Btn onClick={() => del(col.id)} size="sm" variant="danger">Del</Btn>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── ITEMS ADMIN ───────────────────────────────────────────────────────────────
function ItemsAdmin() {
  const [cols,    setCols]    = useState([])
  const [selCol,  setSelCol]  = useState(null)
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form,    setForm]    = useState({})
  const [saving,  setSaving]  = useState(false)
  const photoRef = useRef(null)
  const [photoItem, setPhotoItem] = useState(null)
  const [photoSide, setPhotoSide] = useState('front')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    getAllCollectionsAdmin().then(({ data }) => setCols(data || []))
  }, [])

  const loadItems = async (colId) => {
    setLoading(true)
    setSelCol(colId)
    const { data } = await getItems(colId)
    setItems(data || [])
    setLoading(false)
  }

  const startEdit = (item) => {
    setForm({ ...item, collection_id: selCol })
    setEditing(item?.id || 'new')
  }

  const save = async () => {
    setSaving(true)
    const payload = { ...form, number: parseInt(form.number)||0, collection_id: selCol }
    if (editing === 'new') delete payload.id
    await upsertItem(payload)
    await loadItems(selCol)
    setEditing(null)
    setSaving(false)
  }

  const del = async (id) => {
    if (!confirm('Delete this item?')) return
    await deleteItem(id)
    await loadItems(selCol)
  }

  const openPhotoUpload = (item, side) => {
    setPhotoItem(item); setPhotoSide(side)
    photoRef.current?.click()
  }

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file || !photoItem) return
    setUploading(true)
    await uploadItemPhoto(photoItem.id, file, photoSide)
    await loadItems(selCol)
    setUploading(false)
    e.target.value = ''
  }

  const delPhoto = async (photo) => {
    await deleteItemPhoto(photo.id, '')
    await loadItems(selCol)
  }

  return (
    <div>
      <input ref={photoRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handlePhotoUpload}/>

      <div style={{ marginBottom: 14 }}>
        <label style={lbl}>Select Collection</label>
        <select value={selCol||''} onChange={e => e.target.value && loadItems(e.target.value)}
          style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--line2)', borderRadius:'var(--r-sm)', padding:'10px 14px', color:'var(--heading)', fontSize:14 }}>
          <option value="">— choose a collection —</option>
          {cols.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </div>

      {selCol && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)' }}>Items ({items.length})</div>
            <Btn onClick={() => { setForm({ collection_id: selCol, number:'', name:'', description:'' }); setEditing('new') }} size="sm">+ New Item</Btn>
          </div>

          {editing && (
            <div style={{ background: 'var(--bg2)', border: '1px solid var(--gold)40', borderRadius: 'var(--r-lg)', padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: 10, marginBottom: 10 }}>
                <div><label style={lbl}>Number</label><input type="number" value={form.number||''} onChange={e=>setForm(p=>({...p,number:e.target.value}))}/></div>
                <div><label style={lbl}>Name</label><input value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))}/></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={lbl}>Description</label><textarea rows={2} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} style={{ resize:'none' }}/></div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={save} size="sm" disabled={saving}>{saving ? <Spinner size={13}/> : 'Save'}</Btn>
                <Btn onClick={() => setEditing(null)} size="sm" variant="ghost">Cancel</Btn>
              </div>
            </div>
          )}

          {loading ? <div style={{ padding:32,display:'flex',justifyContent:'center' }}><Spinner size={22}/></div>
          : items.map(item => (
            <div key={item.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)', padding: '12px 14px', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                {/* Photos */}
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {(item.item_photos || []).slice(0,3).map(p => (
                    <div key={p.id} style={{ position: 'relative' }}>
                      <img src={p.url} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 'var(--r-xs)', border: '1px solid var(--line2)' }}/>
                      <button onClick={() => delPhoto(p)} style={{ position:'absolute',top:-4,right:-4,width:16,height:16,borderRadius:'50%',background:'var(--rust)',border:'none',color:'#fff',fontSize:10,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
                      <Badge variant="muted" style={{ position:'absolute',bottom:1,left:1,fontSize:7,padding:'1px 3px' }}>{p.side}</Badge>
                    </div>
                  ))}
                  {(item.item_photos||[]).length === 0 && (
                    <div style={{ width:48,height:48,background:'var(--bg4)',borderRadius:'var(--r-xs)',border:'1px dashed var(--line2)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--muted)',fontSize:10 }}>no img</div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>#{item.number} — {item.name}</div>
                  {item.description && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{item.description}</div>}
                </div>
                <div style={{ display: 'flex', gap: 5, flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  <Btn onClick={() => openPhotoUpload(item,'front')} size="sm" variant="dark" style={{ fontSize:10 }}>+ Front</Btn>
                  <Btn onClick={() => openPhotoUpload(item,'back')} size="sm" variant="dark" style={{ fontSize:10 }}>+ Back</Btn>
                  <Btn onClick={() => openPhotoUpload(item,'extra')} size="sm" variant="dark" style={{ fontSize:10 }}>+ Extra</Btn>
                  <Btn onClick={() => startEdit(item)} size="sm" variant="ghost">Edit</Btn>
                  <Btn onClick={() => del(item.id)} size="sm" variant="danger">Del</Btn>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}

// ── USERS ADMIN ───────────────────────────────────────────────────────────────
function UsersAdmin() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllUsers().then(({ data }) => { setUsers(data||[]); setLoading(false) })
  }, [])

  const toggleAdmin = async (u) => {
    await setAdminRole(u.id, !u.is_admin)
    setUsers(p => p.map(x => x.id===u.id ? {...x,is_admin:!u.is_admin} : x))
  }

  if (loading) return <div style={{ padding:40,display:'flex',justifyContent:'center' }}><Spinner size={22}/></div>

  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--heading)', marginBottom: 14 }}>Users ({users.length})</div>
      {users.map(u => (
        <div key={u.id} style={{ background:'var(--bg2)',border:'1px solid var(--line)',borderRadius:'var(--r-md)',padding:'12px 14px',marginBottom:8,display:'flex',alignItems:'center',gap:12 }}>
          <div style={{ width:36,height:36,borderRadius:'50%',background:'var(--bg4)',flexShrink:0,overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-m)',fontSize:11,color:'var(--muted)' }}>
            {u.avatar_url ? <img src={u.avatar_url} style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : (u.handle||'?').slice(0,2).toUpperCase()}
          </div>
          <div style={{ flex:1,minWidth:0 }}>
            <div style={{ fontSize:13,fontWeight:600,color:'var(--heading)' }}>@{u.handle||'(no handle)'}</div>
            <div style={{ fontSize:11,color:'var(--muted)' }}>{u.location||'—'} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
          </div>
          {u.is_admin && <Badge variant="rust">Admin</Badge>}
          <Btn onClick={() => toggleAdmin(u)} size="sm" variant="ghost" style={{ fontSize:11 }}>{u.is_admin ? 'Remove admin' : 'Make admin'}</Btn>
        </div>
      ))}
    </div>
  )
}

// ── POSTS ADMIN ───────────────────────────────────────────────────────────────
function PostsAdmin() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllPosts().then(({ data }) => { setPosts(data||[]); setLoading(false) })
  }, [])

  const toggle = async (post) => {
    await moderatePost(post.id, !post.visible)
    setPosts(p => p.map(x => x.id===post.id ? {...x,visible:!post.visible} : x))
  }

  if (loading) return <div style={{ padding:40,display:'flex',justifyContent:'center' }}><Spinner size={22}/></div>

  return (
    <div>
      <div style={{ fontSize:14,fontWeight:600,color:'var(--heading)',marginBottom:14 }}>All Posts ({posts.length})</div>
      {posts.map(p => (
        <div key={p.id} style={{ background:'var(--bg2)',border:`1px solid ${p.visible?'var(--line)':'var(--rust)30'}`,borderRadius:'var(--r-md)',padding:'12px 14px',marginBottom:8 }}>
          <div style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:12,color:'var(--muted)',marginBottom:4 }}>@{p.profile?.handle||'?'} · {new Date(p.created_at).toLocaleString()}</div>
              <div style={{ fontSize:13,color:'var(--body)',lineHeight:1.5 }}>{p.body}</div>
            </div>
            <div style={{ display:'flex',gap:6,flexShrink:0,alignItems:'center' }}>
              {!p.visible && <Badge variant="red">Hidden</Badge>}
              <Btn onClick={() => toggle(p)} size="sm" variant={p.visible?'danger':'ghost'} style={{ fontSize:11 }}>
                {p.visible ? 'Hide' : 'Show'}
              </Btn>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// shared label style
const lbl = { fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: '.5px', textTransform: 'uppercase' }
