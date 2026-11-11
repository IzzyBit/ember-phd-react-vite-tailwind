import React from 'react';
import {useEmber} from '../App';
import {allTasks} from '../lib/model';
import {Icon} from './UI';

export default function Sidebar(){
  const {app,currentWs,route,navigate,openNode,switchWs,setModal,medals,mobileMenu}=useEmber();
  const recent=(app.progress.recent||[]).map(s=>{
    const idx=s.indexOf('/'),ws=app.data.workspaces.find(w=>w.id===s.slice(0,idx)),node=ws?.nodes.find(n=>n.id===s.slice(idx+1));
    return ws&&node?{ws,node}:null;
  }).filter(Boolean).slice(0,4);
  return <aside className={`sidebar ${mobileMenu?'mobile-open':''}`}>
    <button className="brand" onClick={()=>navigate('map')}><span className="brand-symbol"><Icon name="Leaf" size={23}/></span><span className="brand-text">ember<span className="brand-dot">.</span><small>THE QUEST STUDIO</small></span></button>
    <div className="sidebar-section-label with-action">YOUR WORLDS <button className="icon-btn small" aria-label="Create workspace" title="Create workspace" onClick={()=>setModal({type:'workspace'})}><Icon name="Plus" size={15}/></button></div>
    <div className="workspace-list">
      {app.data.workspaces.map(ws=>{
        const tasks=allTasks(app.data,app.progress,ws.id);
        return <button key={ws.id} className={`workspace-item ${ws.id===currentWs.id?'active':''}`} onClick={()=>switchWs(ws.id)}>
          <span className="ws-glyph"><Icon name={ws.id==='wellbeing'?'Heart':'BookOpen'} size={17}/></span>
          <span className="ws-name"><b>{ws.title}</b><small>{tasks.filter(t=>t.done).length} / {tasks.length} quests</small></span>
          {ws.id===currentWs.id&&<span className="active-dot"/>}
        </button>;
      })}
    </div>
    <div className="sidebar-section-label">EXPLORE</div>
    <nav className="side-nav">
      {[
        {name:'Quest map',icon:'Map',view:'map'},
        {name:'Achievements',icon:'Trophy',view:'achievements'},
        {name:'Settings & data',icon:'Settings',view:'settings'}
      ].map(x=><button key={x.view} className={`nav-link ${route.view===x.view?'active':''}`} onClick={()=>navigate(x.view)}><Icon name={x.icon} size={17}/><span>{x.name}</span>{x.view==='achievements'&&<span className="nav-count">{medals.filter(a=>a.unlocked).length}</span>}</button>)}
    </nav>
    <div className="sidebar-section-label">RECENTLY VISITED</div>
    <div className="recent-list">{recent.length?recent.map(({ws,node})=><button key={`${ws.id}/${node.id}`} className="recent-item" onClick={()=>openNode(node.id,ws.id)}><Icon name="ArrowRight" size={13}/><span>{node.title}</span></button>):<p className="side-muted">Your opened goals will appear here.</p>}</div>
    <div className="sidebar-footer"><div className="footer-art"><Icon name="Leaf" size={23}/><span>Small steps grow<br/><strong>into great things.</strong></span></div><p><Icon name="Heart" size={12}/> Saved privately in this browser</p></div>
  </aside>;
}
