import React,{createContext,useContext,useEffect,useMemo,useState,useCallback} from 'react';
import starterData from './data/workspaces.json';
import {STORE_KEY,DEFAULT_PROGRESS,allTasks,achievements,clone,exportFile,validateData,today,uid,slug,makeNode,makeWorkspace,taskKey,children,nodeById,isDescendant} from './lib/model';
import {Icon} from './components/UI';
import Sidebar from './components/Sidebar';
import Hud from './components/Hud';
import TreeCanvas from './components/TreeCanvas';
import GoalPage from './pages/GoalPage';
import AchievementsPage from './pages/AchievementsPage';
import SettingsPage from './pages/SettingsPage';
import EditorModal from './components/EditorModal';

const Context=createContext(null);
export const useEmber=()=>useContext(Context);
function initialApp(){
  const base={data:clone(starterData),progress:clone(DEFAULT_PROGRESS),activeWorkspace:'phd'};
  try {
    const saved=JSON.parse(localStorage.getItem(STORE_KEY));
    if(saved && typeof saved==='object') {
      const data=saved.data||base.data;
      validateData(data);
      return {data,progress:{...base.progress,...saved.progress,...Object.fromEntries(Object.keys(DEFAULT_PROGRESS).filter(k=>saved[k]!==undefined).map(k=>[k,saved[k]]))},activeWorkspace:saved.activeWorkspace||'phd'};
    }
  } catch(e) {console.warn('Unable to load saved Ember progress:',e);}
  return base;
}
function getHash(){
  const parts=location.hash.replace(/^#\/?/,'').split('/');
  return {wsId:decodeURIComponent(parts[1]||'phd'),view:['map','detail','achievements','settings'].includes(parts[2])?parts[2]:'map',nodeId:decodeURIComponent(parts[3]||'')};
}
export default function App(){
  const [app,setApp]=useState(initialApp);
  const [route,setRoute]=useState(getHash);
  const [modal,setModal]=useState(null);
  const [toast,setToast]=useState('');
  const [mobileMenu,setMobileMenu]=useState(false),[mobileHud,setMobileHud]=useState(false);
  const [collapsed,setCollapsed]=useState({});
  const currentWs=app.data.workspaces.find(w=>w.id===route.wsId)||app.data.workspaces.find(w=>w.id===app.activeWorkspace)||app.data.workspaces[0];
  const node=nodeById(currentWs,route.nodeId);
  const patch=useCallback((updater)=>setApp(prev=>{
    const next=clone(prev);updater(next);return next;
  }),[]);
  const flash=useCallback((message)=>setToast(message),[]);
  useEffect(()=>{if(!toast)return;const t=setTimeout(()=>setToast(''),3500);return()=>clearTimeout(t)},[toast]);
  useEffect(()=>{try{localStorage.setItem(STORE_KEY,JSON.stringify({...app,...app.progress}));}catch(e){console.warn('Local saving unavailable',e);}},[app]);
  useEffect(()=>{const onHash=()=>{setRoute(getHash());setModal(null);setMobileMenu(false)};window.addEventListener('hashchange',onHash);if(!location.hash)location.hash=`#/workspace/${app.activeWorkspace}/map`;else onHash();return()=>window.removeEventListener('hashchange',onHash);},[]);
  useEffect(()=>{document.title=`${route.view==='detail'&&node?`${node.title} · `:''}${currentWs.title} — Ember`;},[route,node?.title,currentWs.title]);
  const navigate=useCallback((view='map',nodeId=null,wsId=currentWs.id)=>{
    const hash=`#/workspace/${encodeURIComponent(wsId)}/${view}${nodeId?'/'+encodeURIComponent(nodeId):''}`;
    if(location.hash===hash){setRoute(getHash());setMobileMenu(false);} else location.hash=hash;
  },[currentWs.id]);
  const openNode=useCallback((id,wsId=currentWs.id)=>{
    patch(s=>{
      const entry=`${wsId}/${id}`;
      s.progress.recent=[entry,...(s.progress.recent||[]).filter(x=>x!==entry)].slice(0,5);
      if(!s.progress.visited.includes(entry))s.progress.visited.push(entry);
    });navigate('detail',id,wsId);
  },[patch,navigate,currentWs.id]);
  const toggleTask=useCallback((nodeId,taskId,checked)=>{
    patch(s=>{s.progress.completed[taskKey(currentWs.id,nodeId,taskId)]=checked;});
    flash(checked?'Achievement completed — XP earned!':'Achievement marked incomplete');
  },[currentWs.id,patch,flash]);
  const updateNode=useCallback((id,updater)=>patch(s=>{
    const w=s.data.workspaces.find(w=>w.id===currentWs.id);const n=w.nodes.find(n=>n.id===id);
    if(n)updater(n,w);
  }),[patch,currentWs.id]);
  const switchWs=id=>{patch(s=>{s.activeWorkspace=id});navigate('map',null,id);};
  const addNode=(value)=>{
    let newId;
    patch(s=>{
      const w=s.data.workspaces.find(w=>w.id===currentWs.id);
      const n=makeNode(w,value.title,value.parentId,value.description,value.kind);newId=n.id;
      w.nodes.push(n);s.progress.hasCreatedNode=true;
    });
    setCollapsed(p=>({...p,[currentWs.id]:{...(p[currentWs.id]||{}),[value.parentId]:false}}));
    setModal(null);flash('New goal added!');
  };
  const editNode=(id,value)=>{
    updateNode(id,n=>Object.assign(n,value));setModal(null);flash('Goal updated');
  };
  const deleteNode=id=>{
    const n=nodeById(currentWs,id);if(!n?.parentId)return flash('The root goal cannot be removed.');
    const affected=currentWs.nodes.filter(x=>x.id===id||isDescendant(currentWs,x,id));
    if(!window.confirm(`Delete “${n.title}” and ${affected.length-1} connected goals?`))return;
    patch(s=>{const w=s.data.workspaces.find(w=>w.id===currentWs.id);const ids=new Set(affected.map(x=>x.id));w.nodes=w.nodes.filter(x=>!ids.has(x.id));});
    setModal(null);navigate('map');flash('Goal deleted');
  };
  const saveModule=(nodeId,value,existingId)=>{
    updateNode(nodeId,n=>{
      const old=n.modules.find(m=>m.id===existingId);
      let item={id:old?.id||uid('m'),title:value.title,type:value.type};
      if(value.type==='checklist'){
        const lookup=new Map((old?.items||[]).map(t=>[t.text,t]));
        item.items=value.content.split('\n').map(v=>v.trim()).filter(Boolean).map(text=>lookup.get(text)||{id:uid('q'),text,xp:50});
      } else if(value.type==='links'){
        item.items=value.content.split('\n').map(v=>v.trim()).filter(Boolean).map(line=>{const [text,...url]=line.split('|');return {id:uid('link'),text:text.trim(),url:url.join('|').trim()};});
      } else item.body=value.content;
      if(old)Object.assign(old,item);else n.modules.push(item);
    });setModal(null);flash('Page module saved');
  };
  const deleteModule=(nodeId,moduleId)=>{
    if(!window.confirm('Delete this page module?'))return;
    updateNode(nodeId,n=>{n.modules=n.modules.filter(m=>m.id!==moduleId)});flash('Module removed');
  };
  const addWorkspace=(title,subtitle)=>{
    const ws=makeWorkspace(title,subtitle);
    patch(s=>{s.data.workspaces.push(ws);s.activeWorkspace=ws.id});
    setModal(null);navigate('map',null,ws.id);flash('New world created');
  };
  const editWorkspace=(title,subtitle)=>{patch(s=>{const w=s.data.workspaces.find(w=>w.id===currentWs.id);w.title=title;w.subtitle=subtitle});setModal(null);flash('Workspace updated');};
  const duplicateWorkspace=()=>{let id;patch(s=>{
    const ws=clone(s.data.workspaces.find(w=>w.id===currentWs.id));id=uid('world');ws.id=id;ws.title+=' Copy';
    ws.nodes.forEach(n=>n.modules.forEach(m=>{m.id=uid('m');m.items?.forEach(item=>item.id=uid('q'))}));s.data.workspaces.push(ws);s.activeWorkspace=id;
  });navigate('map',null,id);flash('Workspace duplicated');};
  const deleteWorkspace=()=>{
    if(app.data.workspaces.length<=1)return flash('Keep at least one world.');
    if(!window.confirm(`Delete “${currentWs.title}” permanently?`))return;
    const nextWs=app.data.workspaces.find(w=>w.id!==currentWs.id);
    patch(s=>{s.data.workspaces=s.data.workspaces.filter(w=>w.id!==currentWs.id);s.activeWorkspace=nextWs.id;});
    navigate('map',null,nextWs.id);flash('Workspace removed');
  };
  const applyJson=text=>{
    try{
      const obj=JSON.parse(text);validateData(obj);
      const nextWs=obj.workspaces.some(w=>w.id===currentWs.id)?currentWs.id:obj.workspaces[0].id;
      patch(s=>{s.data={version:obj.version||1,workspaces:obj.workspaces};s.activeWorkspace=nextWs;if(obj._emberProgress)s.progress={...clone(DEFAULT_PROGRESS),...obj._emberProgress};});
      setModal(null);navigate('map',null,nextWs);flash('JSON hierarchy applied');return true;
    } catch(e){flash(`Invalid JSON: ${e.message}`);return false;}
  };
  const exportJson=full=>{
    exportFile(full?{...app.data,_emberProgress:app.progress}:app.data,full?'ember-full-backup.json':'ember-workspaces.json');
    flash('JSON file exported');
  };
  const reset=()=>{
    if(!window.confirm('Reset all worlds, tasks, mood check-ins, and notes? Export a backup first.'))return;
    setApp({data:clone(starterData),progress:clone(DEFAULT_PROGRESS),activeWorkspace:'phd'});setCollapsed({});navigate('map',null,'phd');flash('Starter worlds restored');
  };
  const worldTasks=useMemo(()=>allTasks(app.data,app.progress,currentWs.id),[app,currentWs.id]);
  const all=useMemo(()=>allTasks(app.data,app.progress),[app]);
  const xp=all.reduce((acc,x)=>acc+(x.done?(Number(x.t.xp)||50):0),0);
  const medals=useMemo(()=>achievements(app.data,app.progress),[app]);
  const api={app,patch,currentWs,node,route,navigate,openNode,toggleTask,updateNode,modal,setModal,
    addNode,editNode,deleteNode,saveModule,deleteModule,addWorkspace,editWorkspace,duplicateWorkspace,
    deleteWorkspace,applyJson,exportJson,reset,collapsed,setCollapsed,switchWs,flash,worldTasks,xp,medals,
    mobileHud,setMobileHud,mobileMenu,setMobileMenu};
  return <Context.Provider value={api}>
    <div className="shell">
      <Sidebar />
      <main className="main"><div className="main-top"><div className="topbar">
        <div className="crumb"><button className="mobile-menu-toggle" onClick={()=>setMobileMenu(v=>!v)} aria-label="Toggle navigation"><Icon name="Menu"/></button><span>{currentWs.title}</span><span className="slash">/</span><strong>{{map:'Quest map',detail:'Goal detail',achievements:'Achievements',settings:'Settings & data'}[route.view]}</strong></div>
        <div className="topbar-right"><span className="today-chip"><Icon name="CalendarDays" size={14}/>{new Date().toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span><span className="xp-chip"><Icon name="Sparkles" size={15}/>{xp.toLocaleString()} XP</span><button className="hud-mobile-toggle" aria-label="Toggle wellness HUD" onClick={()=>setMobileHud(v=>!v)}><Icon name="Heart"/></button></div>
      </div></div>
      <div key={`${currentWs.id}-${route.view}-${route.nodeId}`} className={`main-content ${route.view==='map'?'map-page':''}`}>
        {route.view==='map'?<TreeCanvas/>:route.view==='detail'&&node?<GoalPage/>:route.view==='achievements'?<AchievementsPage/>:route.view==='settings'?<SettingsPage/>:<TreeCanvas/>}
      </div></main>
      <Hud />
    </div>
    {modal&&<EditorModal key={`${modal.type}-${modal.id||''}-${modal.edit||''}`} />}
    {toast&&<div id="toast-region"><div className="toast"><Icon name="Sparkles" size={17}/><span>{toast}</span></div></div>}
  </Context.Provider>;
}
