import { useEffect, useState } from 'react'
import { getPosts, createPost, likePost } from '../lib/api.js'
import { Chip, Badge, EmptyState, Spinner, Btn } from '../components/UI.jsx'

export default function TradeScreen({ user, profile }) {
  const [posts,   setPosts]   = useState([])
  const [note,    setNote]    = useState('')
  const [posting, setPosting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  const load = async () => {
    const { data } = await getPosts()
    setPosts(data || [])
    setLoading(false)
  }

  const submit = async () => {
    if (!note.trim()) return
    setPosting(true)
    await createPost(user.id, note.trim())
    setNote('')
    await load()
    setPosting(false)
  }

  const like = async (post) => {
    await likePost(post.id, post.likes)
    setPosts(p => p.map(x => x.id === post.id ? { ...x, likes: x.likes + 1 } : x))
  }

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins  = Math.floor(diff / 60000)
    const hours = Math.floor(mins / 60)
    const days  = Math.floor(hours / 24)
    if (days > 0)  return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (mins > 0)  return `${mins}m ago`
    return 'just now'
  }

  const initials = (h) => (h || '?').replace('@','').slice(0,2).toUpperCase()

  return (
    <div>
      {/* Hero */}
      <div style={{ margin: '12px 16px 0', background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -8, bottom: -14, fontFamily: 'var(--font-d)', fontSize: 60, fontWeight: 900, color: 'rgba(196,82,42,0.06)', pointerEvents: 'none' }}>TRADE</div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'var(--rust)', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>Trade Exchange</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 20, fontWeight: 900, color: 'var(--heading)', marginBottom: 4 }}>Find your match.</div>
        <div style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>Post what you need. Offer what you have. The community will find you.</div>
      </div>

      {/* Post form */}
      <div style={{ padding: '20px 16px 0' }}>
        <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 600, marginBottom: 10 }}>Post a want / offer</div>
          <textarea
            rows={3}
            placeholder="e.g. Looking for #88 Reaper of the Cards. Have Shadow and Metal duplicates to offer. Based in Bucharest."
            value={note}
            onChange={e => setNote(e.target.value)}
            style={{ resize: 'none', fontSize: 13, lineHeight: 1.6, marginBottom: 10 }}
          />
          <Btn onClick={submit} size="sm" disabled={posting || !note.trim()}>
            {posting ? <Spinner size={13}/> : 'Post'}
          </Btn>
        </div>
      </div>

      {/* Feed */}
      <div style={{ padding: '16px 16px 0' }}>
        {loading
          ? <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><Spinner size={24}/></div>
          : posts.length === 0
            ? <EmptyState icon="🤝" title="No posts yet" body="Be the first to post a trade or want."/>
            : posts.map(post => (
              <div key={post.id} style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '14px 16px', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-m)', fontSize: 10, color: 'var(--muted)', flexShrink: 0, border: '1px solid var(--line2)' }}>
                    {post.profile?.avatar_url
                      ? <img src={post.profile.avatar_url} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}/>
                      : initials(post.profile?.handle)
                    }
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--heading)' }}>@{post.profile?.handle || 'collector'}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{post.profile?.location ? `📍 ${post.profile.location} · ` : ''}{timeAgo(post.created_at)}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: 'var(--body)', lineHeight: 1.6, marginBottom: 12 }}>{post.body}</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => like(post)} style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: 'var(--r-full)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                    ♥ {post.likes}
                  </button>
                  <button style={{ padding: '7px 14px', background: 'var(--bg3)', border: '1px solid var(--line2)', borderRadius: 'var(--r-full)', fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                    Reply
                  </button>
                </div>
              </div>
            ))
        }
      </div>
      <div style={{ height: 16 }}/>
    </div>
  )
}
