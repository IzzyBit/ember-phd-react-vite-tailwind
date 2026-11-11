import React from 'react';
import {useEmber} from '../App';
import {Icon,PageHero} from '../components/UI';

export default function AchievementsPage(){
  const {medals,xp}=useEmber();const total=medals.filter(x=>x.unlocked).length;
  const level=Math.floor(xp/400)+1;
  return <>
    <PageHero eyebrow="MILESTONES & MOMENTS" title="Your achievements" description="A record of progress across all your worlds. Every meaningful step counts."/>
    <div className="achievement-summary">
      {[{icon:'Trophy',value:`${total} / ${medals.length}`,label:'Achievements unlocked'},{icon:'Sparkles',value:`${xp.toLocaleString()} XP`,label:'Earned from completed quests'},{icon:'Leaf',value:`Level ${level}`,label:'Current explorer level'}].map(x=><div key={x.label} className="achievement-large"><Icon name={x.icon} size={28}/><span><strong>{x.value}</strong><small>{x.label}</small></span></div>)}
    </div>
    <div className="section-line badge-section"><h2>Achievement gallery</h2><p>{total} unlocked, {medals.length-total} still growing</p></div>
    <div className="achievement-grid">{medals.map(a=><article key={a.id} className={`achievement-card ${a.unlocked?'earned':'locked'}`}><div className="achievement-icon"><Icon name={a.icon} size={26}/></div><span className="achievement-state">{a.unlocked&&<Icon name="Check" size={13}/>} {a.unlocked?'UNLOCKED':'LOCKED'}</span><h3>{a.name}</h3><p>{a.description}</p></article>)}</div>
  </>;
}
