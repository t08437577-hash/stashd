import { useState } from 'react'
import { signIn, signUp } from '../lib/api.js'
import { Btn, Spinner } from './UI.jsx'
import { supabase } from '../lib/supabase.js'

export default function AuthScreen({ onAuth }) {
  const [mode,     setMode]     = useState('signin')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [gLoading, setGLoading] = useState(false)
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
      setMode('confirm')
    } else {
      onAuth(data.session)
    }
  }

  const signInWithGoogle = async () => {
    setGLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      }
    })
    if (err) { setError(err.message); setGLoading(false) }
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

            {/* Google button */}
            <button
              onClick={signInWithGoogle}
              disabled={gLoading}
              style={{
                width: '100%', padding: '11px 20px', marginBottom: 16,
                background: '#fff', border: '1px solid #E0D8CC',
                borderRadius: 'var(--r-sm)', fontSize: 14, fontWeight: 600,
                color: '#1A1410', cursor: gLoading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 10, opacity: gLoading ? .6 : 1, transition: 'opacity .15s',
              }}
            >
              {gLoading ? <Spinner size={16}/> : (
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                  <path fill="none" d="M0 0h48v48H0z"/>
                </svg>
              )}
              {gLoading ? 'Redirecting...' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>or</span>
              <div style={{ flex: 1, height: 1, background: 'var(--line)' }}/>
            </div>

            {/* Email / password */}
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
