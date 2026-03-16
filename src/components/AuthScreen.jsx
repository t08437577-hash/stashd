import { useState } from 'react'
import { signIn, signUp } from '../lib/api.js'
import { Btn, Spinner } from './UI.jsx'

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')

  const submit = async () => {
    if (!email || !password) return setError('Please fill in both fields.')
    setLoading(true); setError('')
    const { data, error: err } = mode === 'signin'
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)
    if (err) return setError(err.message)
    if (mode === 'signup') {
      setError('')
      setMode('confirm')
    } else {
      onAuth(data.session)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Logo */}
      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 42, fontWeight: 900, color: 'var(--heading)', letterSpacing: -1 }}>
          ST<em style={{ color: 'var(--gold)', fontStyle: 'normal' }}>A</em>SHD
        </div>
        <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4, letterSpacing: 1 }}>COLLECTOR PLATFORM</div>
      </div>

      {mode === 'confirm' ? (
        <div style={{ maxWidth: 380, width: '100%', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 16 }}>📬</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--heading)', marginBottom: 8 }}>Check your email</div>
          <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 24 }}>
            We sent a confirmation link to <strong style={{ color: 'var(--body)' }}>{email}</strong>. Click it to activate your account, then come back and sign in.
          </div>
          <Btn onClick={() => setMode('signin')} full>Sign in</Btn>
        </div>
      ) : (
        <div style={{ maxWidth: 380, width: '100%' }}>
          <div style={{ background: 'var(--bg2)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: 28 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--heading)', marginBottom: 20 }}>
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: '.5px' }}>EMAIL</label>
                <input type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}/>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 6, letterSpacing: '.5px' }}>PASSWORD</label>
                <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && submit()}/>
              </div>
            </div>

            {error && <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14, padding: '8px 12px', background: 'rgba(217,79,79,0.1)', borderRadius: 'var(--r-sm)' }}>{error}</div>}

            <Btn onClick={submit} full disabled={loading}>
              {loading ? <Spinner size={16}/> : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Btn>

            <div style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--muted)' }}>
              {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError('') }}
                style={{ color: 'var(--gold)', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>
                {mode === 'signin' ? 'Sign up' : 'Sign in'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
