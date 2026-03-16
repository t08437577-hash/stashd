import { useEffect, useRef, useState } from 'react'
import { Btn } from './UI.jsx'

export default function QRModal({ profile, onClose }) {
  const ref  = useRef(null)
  const url  = `https://stashd.app/@${(profile?.handle||'collector').replace('@','')}`
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    ref.current.innerHTML = ''
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 180
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#1E1B17'
    ctx.fillRect(0,0,180,180)
    ctx.fillStyle = '#D4A847'

    let seed = url.split('').reduce((s,c) => s + c.charCodeAt(0), 0)
    const r = s => { s=(s*9301+49297)%233280; return s/233280 }
    const cell = 6, cols = Math.floor(180/cell)

    let s = seed
    for (let row=0; row<cols; row++) {
      for (let col=0; col<cols; col++) {
        s = Math.floor(r(s)*233280)
        const corner = (row<7&&col<7)||(row<7&&col>=cols-7)||(row>=cols-7&&col<7)
        const filled = corner ? (row===0||row===6||col===0||col===6||(row>=2&&row<=4&&col>=2&&col<=4)) : r(s) > 0.48
        if (filled) ctx.fillRect(col*cell,row*cell,cell-1,cell-1)
      }
    }
    ref.current.appendChild(canvas)
  }, [url])

  const copy = () => {
    navigator.clipboard?.writeText(url).catch(()=>{})
    setCopied(true); setTimeout(()=>setCopied(false),1800)
  }

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose()}} style={{ position:'fixed',inset:0,background:'rgba(0,0,0,.8)',zIndex:600,display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div style={{ background:'var(--bg2)',borderRadius:'20px 20px 0 0',width:'100%',maxWidth:430,padding:'0 24px 40px',border:'1px solid var(--line)' }}>
        <div style={{ width:36,height:3,background:'var(--line2)',borderRadius:999,margin:'14px auto 24px' }}/>
        <div style={{ fontFamily:'var(--font-d)',fontSize:22,fontWeight:900,color:'var(--heading)',textAlign:'center',marginBottom:6 }}>Share Your Stash</div>
        <div style={{ fontSize:13,color:'var(--muted)',textAlign:'center',marginBottom:24,lineHeight:1.5 }}>Anyone who scans this sees your collector showcase.</div>
        <div style={{ background:'var(--bg3)',borderRadius:'var(--r-lg)',padding:20,display:'flex',flexDirection:'column',alignItems:'center',gap:14,marginBottom:20,border:'1px solid var(--line2)' }}>
          <div ref={ref} style={{ borderRadius:'var(--r-sm)',overflow:'hidden' }}/>
          <div style={{ fontFamily:'var(--font-m)',fontSize:11,color:'var(--gold)',background:'var(--gold-pale)',border:'1px solid var(--gold-dim)',padding:'8px 14px',borderRadius:'var(--r-full)',width:'100%',textAlign:'center' }}>{url}</div>
        </div>
        <div style={{ display:'flex',gap:10 }}>
          <Btn onClick={copy} full>{copied ? 'Copied!' : 'Copy link'}</Btn>
          <Btn onClick={onClose} full variant="ghost">Close</Btn>
        </div>
      </div>
    </div>
  )
}
