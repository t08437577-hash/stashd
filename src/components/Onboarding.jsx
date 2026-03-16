import { useState } from 'react'
import { upsertProfile } from '../lib/api.js'
import { Btn, Spinner } from './UI.jsx'

const INTERESTS = ['Yu-Gi-Oh Tazos','Pokémon Tazos','Dragon Ball Tazos','Stickers','Panini Albums','Trading Cards','Pogs','Metal Figures']

export default function Onboarding({ userId, onDone }) {
  const [step,      setStep]      = useState(0)
  const [handle,    setHandle]    = useState('')
  const [location,  setLocation]  = useState('')
  const [interests, setInterests] = useState([])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')

  const toggle = t => setInterests(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  const finish = async () => {
    setLoading(true)
    const { error: err } = await upsertProfile(userId, {
      handle: handle.replace('@','').trim() || null,
      location: location.trim() || null,
      interests,
      onboarded: true,
    })
    setLoading(false)
    if (err) return setError(err.message)
    onDone()
  }

  const steps = [
    {
      eyebrow: 'Welcome to STASHD',
      title: 'Your collector identity starts here.',
      body: 'The platform for nostalgic 90s–2000s collectibles. Track what you own, showcase your stash, trade with collectors near you.',
    },
    { eyebrow: 'Step 1 of 2', title: 'Set your collector profile.', body: 'Your handle is how the community finds you.' },
    { eyebrow: 'Step 2 of 2', title: 'What do you collect?', body: 'We use this to personalise your feed and trade matches.' },
  ]
  const s = steps[step]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', padding: '0 0 52px', position: 'relative', overflow: 'hidden' }}>
      {/* BG art */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', overflow: 'hidden', userSelect: 'none' }}>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 120, fontWeight: 900, color: 'rgba(212,168,71,0.04)', letterSpacing: -6 }}>STASHD</div>
      </div>

      <div style={{ width: '100%', maxWidth: 430, padding: '0 28px', position: 'relative', zIndex: 2 }}>
        {/* Step dots */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {steps.map((_, i) => <div key={i} style={{ height: 3, borderRadius: 999, transition: 'all .3s', background: i === step ? 'var(--gold)' : 'var(--line2)', width: i === step ? 24 : 8 }}/>)}
        </div>

        <div style={{ fontSize: 11, letterSpacing: 2, color: 'var(--gold)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>{s.eyebrow}</div>
        <div style={{ fontFamily: 'var(--font-d)', fontSize: 32, fontWeight: 900, color: 'var(--heading)', lineHeight: 1.1, marginBottom: 12 }}>{s.title}</div>
        <div style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 28 }}>{s.body}</div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
            <input placeholder="@your_handle" value={handle} onChange={e => setHandle(e.target.value)} maxLength={24}/>
            <input placeholder="City, Country" value={location} onChange={e => setLocation(e.target.value)} maxLength={40}/>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
            {INTERESTS.map(t => (
              <button key={t} onClick={() => toggle(t)} style={{
                padding: '8px 16px', borderRadius: 'var(--r-full)', fontSize: 13, fontWeight: 500,
                border: `1px solid ${interests.includes(t) ? 'var(--gold2)' : 'var(--line2)'}`,
                background: interests.includes(t) ? 'var(--gold-dim)' : 'transparent',
                color: interests.includes(t) ? 'var(--gold)' : 'var(--muted)',
                transition: 'all .15s',
              }}>{t}</button>
            ))}
          </div>
        )}

        {error && <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{error}</div>}

        <Btn onClick={step < 2 ? () => setStep(s => s + 1) : finish} full size="lg" disabled={loading}>
          {loading ? <Spinner size={16}/> : step < 2 ? 'Continue' : 'Enter STASHD →'}
        </Btn>
        {step === 0 && (
          <button onClick={finish} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, marginTop: 14, display: 'block', width: '100%', textAlign: 'center', cursor: 'pointer' }}>
            Skip for now
          </button>
        )}
      </div>
    </div>
  )
}
