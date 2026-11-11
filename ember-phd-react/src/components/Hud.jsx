import React from 'react';
import {useEmber} from '../App';
import {MOODS,today} from '../lib/model';
import {Icon} from './UI';

export default function Hud(){
  const {app,patch,currentWs,worldTasks,medals,xp,openNode,navigate,mobileHud,setMobileHud}=useEmber();
  const level=Math.floor(xp/400)+1;
  const health=Number(app.progress.health??78);
  const currentDate=today();
  const entry=app.progress.moodEntries[currentDate]||{};
  const chosenMood=entry.mood||'';
  const daysLastWeek=Array.from({length:7},(_,i)=>{const dt=new Date();dt.setDate(dt.getDate()-i);return Boolean(app.progress.moodEntries[dt.toLocaleDateString('sv-SE')]?.mood)}).filter(Boolean).length;
  const pending=worldTasks.find(x=>!x.done&&x.n.kind==='quest')||worldTasks.find(x=>!x.done);
  const unlocked=medals.filter(x=>x.unlocked);
  const changeHealth=diff=>patch(s=>{s.progress.health=Math.min(100,Math.max(0,Number(s.progress.health??78)+diff))});
  const moodChange=update=>patch(s=>{s.progress.moodEntries[currentDate]={...s.progress.moodEntries[currentDate],...update}});
  return <aside className={`hud ${mobileHud?'hud-visible':''}`} aria-label="Wellbeing and achievements">
    <div className="hud-head"><span className="tiny-label">YOUR ADVENTURER HUD</span><button className="icon-btn mobile-close" onClick={()=>setMobileHud(false)} aria-label="Close HUD"><Icon name="X" size={17}/></button></div>
    <div className="player"><div className="player-avatar"><Icon name="Leaf" size={28}/><span className="avatar-star">✦</span></div><div><div className="player-level">Level {String(level).padStart(2,'0')} <span>Explorer</span></div><p>{xp} / {level*400} XP to level {level+1}</p></div></div>
    <div className="xp-track"><span style={{width:`${xp%400/4}%`}}/></div>
    <div className="hud-divider"/>
    <div className="hud-title-row"><h3><Icon name="Heart" size={16}/> Vitality bar</h3><span className="hud-value">{health}%</span></div>
    <div className="health-track"><span style={{width:`${health}%`}}/></div>
    <div className="health-controls"><button className="mini-step" aria-label="Lower vitality" onClick={()=>changeHealth(-10)}><Icon name="Minus" size={15}/></button><span>How is your energy today?</span><button className="mini-step" aria-label="Raise vitality" onClick={()=>changeHealth(10)}><Icon name="Plus" size={15}/></button></div>
    <p className="hud-help">A subjective self-check-in, not a health score. Rest and recovery never reduce your XP.</p>
    <div className="hud-divider"/>
    <div className="hud-title-row"><h3><Icon name="Smile" size={16}/> Mood check-in</h3><span className="mini-count">{daysLastWeek}/7 days</span></div>
    <p className="hud-caption">What does today feel like?</p>
    <div className="mood-options">{MOODS.map(m=><button key={m.id} aria-label={m.label} aria-pressed={chosenMood===m.id} className={`mood ${chosenMood===m.id?'chosen':''}`} onClick={()=>moodChange({mood:m.id})}><span>{m.mark}</span><small>{m.label}</small></button>)}</div>
    <label className="hud-note-label" htmlFor="mood-note">A little note to yourself <span>(optional)</span></label>
    <textarea id="mood-note" className="mood-note" rows={2} value={entry.note||''} onChange={e=>moodChange({note:e.target.value})} placeholder="Today, I'm feeling…"/>
    <div className="hud-divider"/>
    <div className="hud-title-row"><h3><Icon name="Flag" size={16}/> Next small quest</h3></div>
    {pending?<button className="suggestion" onClick={()=>openNode(pending.n.id)}><span className="suggestion-label">{pending.n.title}</span><span className="suggestion-task">{pending.t.text}</span><span className="suggestion-bottom"><span>+{pending.t.xp||50} XP</span><Icon name="ArrowRight" size={15}/></span></button>:<div className="all-done"><Icon name="Trophy" size={19}/> All current quests completed!</div>}
    <div className="hud-divider"/>
    <div className="hud-title-row"><h3><Icon name="Trophy" size={16}/> Achievements</h3><button className="quiet-link" onClick={()=>navigate('achievements')}>View all</button></div>
    <div className="badge-row">{(unlocked.length?unlocked.slice(-4):medals.slice(0,3)).map(a=><span key={a.id} title={`${a.name}: ${a.description}`} className={`small-badge ${a.unlocked?'unlocked':'locked'}`}><Icon name={a.icon} size={19}/></span>)}<span className="badge-count">{unlocked.length}/{medals.length}</span></div>
  </aside>;
}
