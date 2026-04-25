import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import { X, Play, Pause, RotateCcw, Timer, Flame, GripHorizontal, ChevronUp, ChevronDown, Coffee } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const ORB_SIZE = 58;
const MARGIN   = 20;
const BOT_NAV  = 110;
const BREAK_SECS = 5 * 60; // 5-min break

const calcBreaks = (mins) => Math.floor(mins / 30);
const segSecs    = (mins, breaks) => Math.floor((mins * 60) / (breaks + 1));

const getVibe = () => {
  const h = new Date().getHours();
  // Mirrors the exact IST greeting timeline
  if (h >= 0  && h < 5)  return { icon: '💎', ring: '#C8A951', label: 'ELITE HOURS' };   // 12AM-5AM
  if (h >= 5  && h < 9)  return { icon: '☀️', ring: '#F59E0B', label: 'MORNING'     };   // 5AM-9AM
  if (h >= 9  && h < 12) return { icon: '⚙️', ring: '#F97316', label: 'GRINDING'    };   // 9AM-12PM
  if (h >= 12 && h < 17) return { icon: '☕', ring: '#6366F1', label: 'AFTERNOON'  };   // 12PM-5PM
  if (h >= 17 && h < 21) return { icon: '🌆', ring: '#8B5CF6', label: 'EVENING'    };   // 5PM-9PM
  return                         { icon: '🔥', ring: '#EF4444', label: 'GRINDING'    };   // 9PM-12AM
};

// Full per-phase design tokens
const THEMES = {
  'ELITE HOURS': {
    panelBg: 'linear-gradient(160deg,#0d0d0d 0%,#1a1400 100%)',
    panelBorder: 'rgba(200,169,81,0.3)',
    accent: '#C8A951',
    accentSoft: 'rgba(200,169,81,0.15)',
    text: '#f5f0e0',
    textMuted: '#9a8a60',
    orbBg: 'rgba(200,169,81,0.18)',
    orbBorder: '#C8A951',
    orbGlow: '0 0 18px rgba(200,169,81,0.45)',
    headerText: '#C8A951',
    spinnerBg: 'rgba(255,255,255,0.06)',
    chipActive: '#C8A951', chipActiveTxt: '#000',
    startBg: 'linear-gradient(135deg,#C8A951,#a07830)',
    startColor: '#000',
  },
  'MORNING': {
    panelBg: 'linear-gradient(160deg,#fffbf0 0%,#fff8e1 100%)',
    panelBorder: 'rgba(245,158,11,0.2)',
    accent: '#F59E0B',
    accentSoft: 'rgba(245,158,11,0.12)',
    text: '#1a1200',
    textMuted: '#92762a',
    orbBg: 'rgba(245,158,11,0.15)',
    orbBorder: '#F59E0B',
    orbGlow: '0 0 18px rgba(245,158,11,0.4)',
    headerText: '#b45309',
    spinnerBg: '#fef3c7',
    chipActive: '#F59E0B', chipActiveTxt: '#000',
    startBg: 'linear-gradient(135deg,#F59E0B,#d97706)',
    startColor: '#fff',
  },
  'GRINDING': {
    panelBg: 'linear-gradient(160deg,#fff7f0 0%,#fff0e6 100%)',
    panelBorder: 'rgba(249,115,22,0.2)',
    accent: '#F97316',
    accentSoft: 'rgba(249,115,22,0.12)',
    text: '#1a0800',
    textMuted: '#9a4a10',
    orbBg: 'rgba(249,115,22,0.15)',
    orbBorder: '#F97316',
    orbGlow: '0 0 18px rgba(249,115,22,0.4)',
    headerText: '#ea6510',
    spinnerBg: '#ffedd5',
    chipActive: '#F97316', chipActiveTxt: '#fff',
    startBg: 'linear-gradient(135deg,#F97316,#ea580c)',
    startColor: '#fff',
  },
  'AFTERNOON': {
    panelBg: 'linear-gradient(160deg,#f5f3ff 0%,#ede9fe 100%)',
    panelBorder: 'rgba(99,102,241,0.2)',
    accent: '#6366F1',
    accentSoft: 'rgba(99,102,241,0.12)',
    text: '#1e1b4b',
    textMuted: '#6366f1',
    orbBg: 'rgba(99,102,241,0.15)',
    orbBorder: '#6366F1',
    orbGlow: '0 0 18px rgba(99,102,241,0.4)',
    headerText: '#4f46e5',
    spinnerBg: '#ede9fe',
    chipActive: '#6366F1', chipActiveTxt: '#fff',
    startBg: 'linear-gradient(135deg,#6366F1,#4f46e5)',
    startColor: '#fff',
  },
  'EVENING': {
    panelBg: 'linear-gradient(160deg,#faf5ff 0%,#f3e8ff 100%)',
    panelBorder: 'rgba(139,92,246,0.2)',
    accent: '#8B5CF6',
    accentSoft: 'rgba(139,92,246,0.12)',
    text: '#2e1065',
    textMuted: '#7c3aed',
    orbBg: 'rgba(139,92,246,0.15)',
    orbBorder: '#8B5CF6',
    orbGlow: '0 0 18px rgba(139,92,246,0.4)',
    headerText: '#7c3aed',
    spinnerBg: '#f3e8ff',
    chipActive: '#8B5CF6', chipActiveTxt: '#fff',
    startBg: 'linear-gradient(135deg,#8B5CF6,#7c3aed)',
    startColor: '#fff',
  },
};
const getTheme = (label) => THEMES[label] || THEMES['GRINDING'];

const playClick = () => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const n   = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random()*2-1) * Math.pow(1-i/n, 6);
    const src = ctx.createBufferSource(), g = ctx.createGain();
    src.buffer = buf; src.connect(g); g.connect(ctx.destination);
    g.gain.value = 0.5; src.start();
  } catch (_) {}
};

const fmt = s =>
  `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
const fmtTotal = m => {
  if (m < 60) return `${m}m`;
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
};

const QUICK = [25, 50, 90];

// ── PHASE IDs ──
const P = { SETUP:'setup', FOCUS:'focus', BREAK:'break', DONE:'done' };

const GrindOrb = () => {
  const { isLoggedIn, focusMinutes = 0, addFocusMinutes } = useAppContext();

  // ── Config state (setup screen) ──
  const [focusMins,  setFocusMins]  = useState(25);
  const [skipBreaks, setSkipBreaks] = useState(false);

  // ── Timer runtime state ──
  const [phase,      setPhase]      = useState(P.SETUP);
  const [timeLeft,   setTimeLeft]   = useState(0);
  const [segIdx,     setSegIdx]     = useState(0);  // which focus segment
  const [mission,    setMission]    = useState(null);
  const [open,       setOpen]       = useState(false);
  const [panelDir,   setPanelDir]   = useState({ x:'right', y:'down' });
  const [vibe,       setVibe]       = useState(getVibe);
  const [orbIdle,    setOrbIdle]    = useState(false);

  const intervalRef    = useRef(null);
  const runtimeRef     = useRef({});
  const idleTimeoutRef = useRef(null);

  const goIdle = () => {
    idleTimeoutRef.current = setTimeout(() => setOrbIdle(true), 3000);
  };
  const cancelIdle = () => {
    clearTimeout(idleTimeoutRef.current);
    setOrbIdle(false);
  };

  // ── Drag position ──
  const posX = useMotionValue(typeof window!=='undefined' ? window.innerWidth-ORB_SIZE-MARGIN : 300);
  const posY = useMotionValue(typeof window!=='undefined' ? window.innerHeight-ORB_SIZE-BOT_NAV : 500);

  const snapToEdge = useCallback(() => {
    const w=window.innerWidth, h=window.innerHeight;
    const snapX = posX.get()+ORB_SIZE/2 < w/2 ? MARGIN : w-ORB_SIZE-MARGIN;
    const clampY = Math.max(60, Math.min(h-ORB_SIZE-BOT_NAV, posY.get()));
    animate(posX, snapX, { type:'spring', stiffness:500, damping:35 });
    animate(posY, clampY, { type:'spring', stiffness:500, damping:35 });
  }, [posX, posY]);

  const openPanel = () => {
    cancelIdle();
    const w=window.innerWidth, h=window.innerHeight;
    const x=posX.get(), y=posY.get();
    setPanelDir({
      x: x+ORB_SIZE/2 > w/2 ? 'left' : 'right',
      y: y+ORB_SIZE+500+MARGIN > h  ? 'up'   : 'down',
    });
    setOpen(true);
  };

  useEffect(() => {
    setVibe(getVibe()); // Always sync on mount / HMR reload
    const id = setInterval(() => setVibe(getVibe()), 60_000);
    // Start idle fade-out on first render (orb starts idle)
    goIdle();
    return () => { clearInterval(id); clearTimeout(idleTimeoutRef.current); };
  }, []);

  // ── Computed break info ──
  const rawBreaks      = calcBreaks(focusMins);          // always reflects duration
  const effectiveBreaks = skipBreaks ? 0 : rawBreaks;    // used for actual timer
  const focusSegDur    = segSecs(focusMins, effectiveBreaks);

  // ── Start session ──
  const startSession = () => {
    runtimeRef.current = {
      breaksTotal: effectiveBreaks,
      focusSegDur,
      breaksLeft: effectiveBreaks,
      totalFocusMins: focusMins,
    };
    setSegIdx(0);
    setPhase(P.FOCUS);
    setTimeLeft(focusSegDur);
  };

  // ── Tick ──
  const tick = useCallback(() => {
    setTimeLeft(prev => {
      if (prev > 1) return prev - 1;

      // Segment ended
      const { breaksLeft, breaksTotal: bt, focusSegDur: fsd, totalFocusMins } = runtimeRef.current;

      clearInterval(intervalRef.current);

      if (phase === P.FOCUS) {
        if (breaksLeft > 0) {
          // Start a break
          runtimeRef.current.breaksLeft = breaksLeft - 1;
          setPhase(P.BREAK);
          return BREAK_SECS;
        } else {
          // All focus segments done
          playClick();
          if (addFocusMinutes) addFocusMinutes(totalFocusMins);
          setMission({ label: `${totalFocusMins}m` });
          setPhase(P.DONE);
          return 0;
        }
      } else if (phase === P.BREAK) {
        // Break ended → next focus segment
        setSegIdx(i => i + 1);
        setPhase(P.FOCUS);
        return fsd;
      }
      return 0;
    });
  }, [phase, addFocusMinutes]);

  useEffect(() => {
    if (phase === P.FOCUS || phase === P.BREAK) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [phase, tick]);

  // ── Controls ──
  const handlePause = () => {
    clearInterval(intervalRef.current);
    setPhase(P.SETUP); // returns to setup with time preserved
  };
  const handleReset = () => {
    clearInterval(intervalRef.current);
    setPhase(P.SETUP);
    setMission(null);
  };
  const skipBreak = () => {
    clearInterval(intervalRef.current);
    setSegIdx(i => i+1);
    setPhase(P.FOCUS);
    setTimeLeft(runtimeRef.current.focusSegDur);
  };
  const handleDone    = () => { setMission(null); setPhase(P.SETUP); };
  const handleGoAgain = () => { setMission(null); setPhase(P.SETUP); };

  const changeMins = (delta) => {
    setFocusMins(prev => Math.min(300, Math.max(5, prev + delta)));
  };

  // ── Progress ──
  const totalSegDur   = phase === P.BREAK ? BREAK_SECS : focusSegDur;
  const progress      = phase !== P.SETUP && totalSegDur > 0
    ? 1 - timeLeft / totalSegDur : 0;
  const circ = 2 * Math.PI * 50;

  // ── Panel position ──
  const panelPos = {
    position:'absolute', width:272,
    ...(panelDir.x==='left' ? { right:0 } : { left:0 }),
    ...(panelDir.y==='up'   ? { bottom: ORB_SIZE+8 } : { top: ORB_SIZE+8 }),
  };

  if (!isLoggedIn) return null;

  const isRunning = phase===P.FOCUS || phase===P.BREAK;
  const T = getTheme(vibe.label);
  // Orb is always visible while running or panel is open
  const orbOpacity = (isRunning || open) ? 1 : orbIdle ? 0.18 : 1;

  return (
    <>
      {/* ── Mission Banner ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mission && (
          <motion.div
            key="mission"
            initial={{ opacity:0, y:-80, x:'-50%' }}
            animate={{ opacity:1, y:0,   x:'-50%' }}
            exit={{    opacity:0, y:-80, x:'-50%' }}
            transition={{ type:'spring', stiffness:420, damping:32 }}
            style={{
              position:'fixed', top:'1.5rem', left:'50%',
              zIndex:10001, width:'min(92vw, 360px)',
              background:'#0a0a0a', color:'#fff',
              borderRadius:'20px', boxShadow:'0 12px 48px rgba(0,0,0,0.28)',
              overflow:'hidden',
            }}
          >
            <div style={{ height:3, background:'linear-gradient(90deg,#C8A951,#fff8dc)' }} />
            <div style={{ padding:'18px 20px 16px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                <span style={{ fontSize:22 }}>⚔️</span>
                <div>
                  <p style={{ margin:0, fontWeight:900, fontSize:16, letterSpacing:'-0.02em', lineHeight:1.2 }}>Mission Accomplished.</p>
                  <p style={{ margin:0, fontWeight:900, fontSize:16, letterSpacing:'-0.02em', lineHeight:1.2, color:'#C8A951' }}>Grind Logged.</p>
                </div>
              </div>
              <p style={{ margin:'8px 0 14px', fontSize:12, color:'#aaa', fontWeight:600, letterSpacing:'0.04em' }}>
                +{mission.label} SESSION LOGGED · ACTIVITY MARKED
              </p>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={handleGoAgain} style={mBtn('#fff','#000')}>↺ Go Again</button>
                <button onClick={handleDone}    style={mBtn('transparent','#777','#333')}>Done</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Draggable Orb ──────────────────────────────────────────────── */}
      <motion.div
        drag dragMomentum={false} dragElastic={0.06} onDragEnd={snapToEdge}
        style={{ x:posX, y:posY, position:'fixed', top:0, left:0, zIndex:9998, touchAction:'none' }}
      >
        <div style={{ position:'relative' }}>

          {/* ── ORB BUTTON ─────────────────────────────────────────────── */}
          <motion.div
            animate={{ opacity: orbOpacity }}
            transition={{ opacity: { duration: 1.2, ease: 'easeInOut' } }}
            whileHover={{ scale: 1.08, opacity: 1 }}
            whileTap={{ scale: 0.94, opacity: 1 }}
            onClick={() => {
              if (open) {
                setOpen(false);
                if (!isRunning) goIdle();
              } else {
                openPanel();
              }
            }}
            style={{
              width:ORB_SIZE, height:ORB_SIZE, borderRadius:'50%',
              background: isRunning ? T.orbBg : 'rgba(255,255,255,0.85)',
              backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
              border:`2.5px solid ${T.orbBorder}`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:'22px', userSelect:'none', cursor:'grab',
              boxShadow: isRunning ? T.orbGlow : '0 4px 12px rgba(0,0,0,0.08)',
            }}
          >
            {isRunning
              ? <span style={{ color: T.accent, fontSize:11, fontWeight:900, letterSpacing:'-0.5px' }}>{fmt(timeLeft)}</span>
              : phase===P.BREAK ? '☕' : vibe.icon}
          </motion.div>

          {/* ── PANEL ──────────────────────────────────────────────────── */}
          <AnimatePresence>
            {open && (
              <motion.div
                key="panel"
                initial={{ opacity:0, scale:0.9 }}
                animate={{ opacity:1, scale:1   }}
                exit={{    opacity:0, scale:0.9 }}
                transition={{ type:'spring', stiffness:380, damping:30 }}
                style={{
                  ...panelPos,
                  background: T.panelBg,
                  backdropFilter:'blur(24px)', WebkitBackdropFilter:'blur(24px)',
                  border:`1.5px solid ${T.panelBorder}`,
                  borderRadius:'22px', boxShadow:`0 16px 48px rgba(0,0,0,0.14), 0 0 0 1px ${T.panelBorder}`,
                  overflow:'hidden',
                }}
              >
                {/* Drag handle */}
                <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 2px', cursor:'grab' }}>
                  <GripHorizontal size={16} color="#ccc" />
                </div>

                <div style={{ padding:'4px 18px 18px', display:'flex', flexDirection:'column', gap:13 }}>
                  {/* Header */}
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                      <Timer size={14} strokeWidth={2.5} color={T.accent} />
                      <span style={{ fontWeight:900, fontSize:11, letterSpacing:'0.06em', color:T.headerText }}>
                        {phase===P.BREAK ? '☕ BREAK TIME' : `${vibe.icon} ${vibe.label}`}
                      </span>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setOpen(false); }}
                      style={{ background:'none', border:'none', cursor:'pointer', display:'flex', padding:2 }}>
                      <X size={16} color="#aaa" />
                    </button>
                  </div>

                  {/* ── SETUP SCREEN ── */}
                  {phase === P.SETUP && (
                    <>
                      <p style={{ margin:0, textAlign:'center', fontWeight:800, fontSize:13, color:T.text }}>
                        {vibe.icon} Get ready to focus
                      </p>

                      {/* Quick picks */}
                      <div style={{ display:'flex', gap:6, justifyContent:'center' }}>
                        {QUICK.map(q => (
                          <button key={q} onClick={() => setFocusMins(q)} style={{
                            padding:'4px 12px', borderRadius:999,
                            border:`2px solid ${focusMins===q ? T.chipActive : T.panelBorder}`,
                            background: focusMins===q ? T.chipActive : T.accentSoft,
                            color: focusMins===q ? T.chipActiveTxt : T.textMuted,
                            fontWeight:800, fontSize:11, cursor:'pointer', transition:'all 0.15s',
                          }}>{q}m</button>
                        ))}
                      </div>

                      {/* Spinner */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12 }}>
                        <div style={{
                          display:'flex', flexDirection:'column', alignItems:'center',
                          background: T.spinnerBg, borderRadius:16, padding:'10px 24px',
                          minWidth:100, border:`1px solid ${T.panelBorder}`,
                        }}>
                          <button onClick={() => changeMins(5)} style={spinBtn}>
                            <ChevronUp size={20} color={T.accent} />
                          </button>
                          <span style={{ fontSize:36, fontWeight:900, color:T.text, letterSpacing:'-0.04em', lineHeight:1.1 }}>
                            {focusMins >= 60 ? `${Math.floor(focusMins/60)}h${focusMins%60>0?` ${focusMins%60}m`:''}` : focusMins}
                          </span>
                          <span style={{ fontSize:11, color:T.textMuted, fontWeight:700, marginTop:2 }}>
                            {focusMins >= 60 ? 'hours' : 'mins'}
                          </span>
                          <button onClick={() => changeMins(-5)} style={spinBtn}>
                            <ChevronDown size={20} color={T.accent} />
                          </button>
                        </div>
                      </div>

                      {/* Break info */}
                      <div style={{ textAlign:'center' }}>
                        <p style={{ margin:'0 0 8px', fontSize:13, color:T.textMuted, fontWeight:600 }}>
                          {rawBreaks > 0
                            ? skipBreaks
                              ? `Breaks skipped (${rawBreaks} available)`
                              : `You'll have ${rawBreaks} break${rawBreaks>1?'s':''}.`
                            : 'No breaks for this session.'}
                        </p>
                        {rawBreaks > 0 && (
                          <label style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, cursor:'pointer' }}>
                            <input
                              type="checkbox"
                              checked={skipBreaks}
                              onChange={e => setSkipBreaks(e.target.checked)}
                              style={{ width:16, height:16, cursor:'pointer', accentColor:'#111' }}
                            />
                            <span style={{ fontSize:13, color:T.textMuted, fontWeight:600 }}>Skip breaks</span>
                          </label>
                        )}
                      </div>

                      {/* Total grind */}
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', background:T.accentSoft, borderRadius:12, padding:'8px 14px', border:`1px solid ${T.panelBorder}` }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <Flame size={13} color={T.accent} />
                          <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, letterSpacing:'0.05em' }}>TOTAL GRIND</span>
                        </div>
                        <span style={{ fontSize:13, fontWeight:900, color:T.text }}>{fmtTotal(focusMinutes)}</span>
                      </div>

                      {/* Start button */}
                      <button onClick={startSession} style={{
                        padding:'12px 0', borderRadius:'13px',
                        background: T.startBg, color: T.startColor,
                        border:'none', fontWeight:900, fontSize:14,
                        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                        boxShadow:`0 4px 16px ${T.accentSoft}`,
                      }}>
                        <Play size={14} fill={T.startColor} strokeWidth={0} /> Start focus session
                      </button>
                    </>
                  )}

                  {/* ── FOCUS / BREAK RUNNING SCREEN ── */}
                  {(phase === P.FOCUS || phase === P.BREAK) && (
                    <>
                      {/* Segment label */}
                      <p style={{ margin:0, textAlign:'center', fontSize:11, fontWeight:700, color: phase===P.BREAK ? T.accent : T.textMuted, letterSpacing:'0.06em' }}>
                        {phase===P.BREAK
                          ? `☕ BREAK ${runtimeRef.current.breaksTotal - runtimeRef.current.breaksLeft} OF ${runtimeRef.current.breaksTotal}`
                          : `${vibe.icon} FOCUS ${segIdx+1} / ${(runtimeRef.current.breaksTotal||0)+1}`}
                      </p>

                      {/* Ring */}
                      <div style={{ display:'flex', flexDirection:'column', alignItems:'center' }}>
                        <div style={{ position:'relative', width:116, height:116 }}>
                          <svg width="116" height="116" style={{ transform:'rotate(-90deg)' }}>
                            <circle cx="58" cy="58" r="50" fill="none" stroke={T.accentSoft} strokeWidth="5" />
                            <circle cx="58" cy="58" r="50"
                              fill="none"
                              stroke={phase===P.BREAK ? '#C8A951' : vibe.ring}
                              strokeWidth="5" strokeLinecap="round"
                              strokeDasharray={circ}
                              strokeDashoffset={circ*(1-progress)}
                              style={{ transition:'stroke-dashoffset 1s linear, stroke 0.4s' }}
                            />
                          </svg>
                          <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
                            <span style={{ fontSize:26, fontWeight:900, letterSpacing:'-0.04em', color:T.text }}>{fmt(timeLeft)}</span>
                            <span style={{ fontSize:10, color:T.textMuted, fontWeight:700, marginTop:2, letterSpacing:'0.07em' }}>
                              {phase===P.BREAK ? 'RECHARGE' : 'IN FOCUS'}
                            </span>
                          </div>
                        </div>
                        <div style={{ width:'100%', height:3.5, background:T.accentSoft, borderRadius:99, overflow:'hidden', marginTop:10 }}>
                          <motion.div animate={{ width:`${progress*100}%` }} transition={{ duration:1, ease:'linear' }}
                            style={{ height:'100%', background: phase===P.BREAK ? '#C8A951' : vibe.ring, borderRadius:99 }} />
                        </div>
                      </div>

                      {/* Controls */}
                      <div style={{ display:'flex', gap:8 }}>
                        <button onClick={handlePause} style={btn(T.accent, T.startColor)}>
                          <Pause size={12} fill={T.startColor} strokeWidth={0}/> Pause
                        </button>
                        {phase===P.BREAK && (
                          <button onClick={skipBreak} style={btn(T.accentSoft, T.text, T.panelBorder)}>
                            <Coffee size={12}/> Skip
                          </button>
                        )}
                        <button onClick={handleReset} style={btn(T.accentSoft, T.text, T.panelBorder)}>
                          <RotateCcw size={12}/> Reset
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};

const spinBtn = {
  background:'none', border:'none', cursor:'pointer',
  padding:'2px 8px', display:'flex', alignItems:'center',
};
const btn = (bg, color, border) => ({
  flex:1, display:'flex', alignItems:'center', justifyContent:'center',
  gap:6, padding:'9px 0', borderRadius:'11px',
  background:bg, color, border:`1.5px solid ${border||bg}`,
  fontWeight:800, fontSize:13, cursor:'pointer',
});
const mBtn = (bg, color, border) => ({
  flex:1, padding:'10px 0', borderRadius:'12px',
  background:bg, color, border:border?`1.5px solid ${border}`:'none',
  fontWeight:900, fontSize:13, cursor:'pointer',
});

export default GrindOrb;
