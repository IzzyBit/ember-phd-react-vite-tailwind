import React from 'react';
import {useEmber} from '../App';
import {ancestors,children,nodeProgress,taskDone} from '../lib/model';
import {Button,Icon,IconButton,KIND_ICON,MiniProgress} from '../components/UI';

function ModuleCard({module,node}){
  const {app,currentWs,toggleTask,setModal,deleteModule}=useEmber();
  const tasks=module.items||[],done=tasks.filter(t=>taskDone(app.progress,currentWs.id,node.id,t.id)).length;
  const type=module.type||'text';
  const icon={checklist:'Target',links:'Link2',callout:'Sparkles',text:'BookOpen'}[type]||'FileText';
  return <article className={`module-card module-${type}`}>
    <div className="module-head"><div className="module-title"><Icon name={icon} size={19}/><h3>{module.title||'Untitled module'}</h3></div><div className="module-actions"><IconButton icon="Pencil" title="Edit module" className="small" onClick={()=>setModal({type:'module',id:module.id,nodeId:node.id})}/><IconButton icon="Trash2" title="Delete module" className="small" onClick={()=>deleteModule(node.id,module.id)}/></div></div>
    {type==='checklist'?<>
      <div className="module-progress-label">{done} of {tasks.length} complete <span>{tasks.length?Math.round(done/tasks.length*100):0}%</span></div>
      <MiniProgress value={tasks.length?done/tasks.length*100:0}/>
      <div className="checklist-items">{tasks.map(t=>{
        const checked=taskDone(app.progress,currentWs.id,node.id,t.id);
        return <label key={t.id} className={`quest-check ${checked?'is-complete':''}`}>
          <input type="checkbox" checked={checked} onChange={e=>toggleTask(node.id,t.id,e.target.checked)}/>
          <span className="checkbox-visual"><Icon name="Check" size={13}/></span>
          <span className="quest-description">{t.text}</span><span className="quest-xp">+{t.xp||50} XP</span>
        </label>;
      })}</div>
    </>:type==='links'?<div className="link-list">{tasks.length?tasks.map((item,i)=><a href={/^https?:\/\//i.test(item.url||'')?item.url:undefined} key={item.id||i} target="_blank" rel="noopener noreferrer"><Icon name="Link2" size={15}/>{item.text||'Resource'} <Icon name="ArrowRight" size={13}/></a>):<p className="empty-module">Add useful resource links to this module.</p>}</div>:<p className="module-paragraph" style={{whiteSpace:'pre-line'}}>{module.body||'Add a description to this module.'}</p>}
  </article>;
}
export default function GoalPage(){
  const {app,patch,currentWs,node,navigate,openNode,setModal,deleteNode}=useEmber();
  const path=ancestors(currentWs,node),parent=path.at(-2),kids=children(currentWs,node.id);
  const stats=nodeProgress(currentWs,node,app.progress,true),notesKey=`${currentWs.id}/${node.id}`;
  return <div className="detail-page">
    <div className="back-line"><button className="back-button" onClick={()=>navigate('map')}><Icon name="ArrowLeft" size={16}/> Back to quest map</button><span className="back-sep">/</span><span>{path.slice(1).map(n=>n.title).join(' / ')}</span></div>
    <div className="detail-banner"><div className="detail-badge"><Icon name={KIND_ICON[node.kind]||'Flag'} size={28}/></div><div className="detail-banner-copy"><div className="eyebrow">{path.slice(1,-1).map(n=>n.title).join('  ·  ')||'MAIN QUEST'}</div><h1>{node.title}</h1><p>{node.description||'A goal on your quest map.'}</p><div className="detail-banner-tags"><span><Icon name="Flag" size={14}/>{node.kind||'quest'}</span><span><Icon name="Target" size={14}/>{stats.done}/{stats.total} achievements</span></div></div><div className="detail-banner-actions"><Button icon="Pencil" variant="soft" onClick={()=>setModal({type:'node',id:node.id})}>Edit goal</Button>{node.parentId&&<Button icon="Trash2" variant="soft" onClick={()=>deleteNode(node.id)}>Delete</Button>}</div></div>
    <div className="detail-layout">
      <div className="detail-content"><div className="section-line"><h2>Your goal modules</h2><Button icon="Plus" onClick={()=>setModal({type:'module',nodeId:node.id})}>Add module</Button></div>
        {node.modules?.length?node.modules.map(m=><ModuleCard key={m.id} module={m} node={node}/>):<div className="empty-detail">No modules yet. Add a text, checklist, links or highlighted note module.</div>}
        {kids.length>0&&<><div className="section-line connected-head"><h2>Connected goals <span>{kids.length}</span></h2></div><div className="child-goals">{kids.map(child=>{const progress=nodeProgress(currentWs,child,app.progress,true);return <button key={child.id} className="child-card" onClick={()=>openNode(child.id)}><span className="child-icon"><Icon name={KIND_ICON[child.kind]||'Flag'} size={18}/></span><span><b>{child.title}</b><small>{progress.done}/{progress.total} completed</small></span><Icon name="ArrowRight" size={16}/></button>})}</div></>}
      </div>
      <aside className="detail-rail"><div className="rail-card"><div className="rail-heading"><Icon name="Activity" size={16}/> GOAL PROGRESS</div><div className="big-percent">{stats.pct}<span>%</span></div><MiniProgress value={stats.pct} className="big"/><p>{stats.done} of {stats.total} associated achievements completed.</p></div>
      <div className="rail-card notes-rail"><div className="rail-heading"><Icon name="FileText" size={16}/> YOUR NOTES</div><p>Ideas, links and reminders for this goal. Saved automatically.</p><textarea aria-label="Goal notes" className="personal-notes" rows={7} placeholder="Research ideas, next steps…" value={app.progress.notes[notesKey]||''} onChange={e=>patch(s=>{s.progress.notes[notesKey]=e.target.value})}/><div className="saved-line"><Icon name="Check" size={13}/> Saved locally</div></div>
      {parent&&<button className="rail-parent" onClick={()=>openNode(parent.id)}><Icon name="ArrowLeft" size={15}/> Parent goal: {parent.title}</button>}</aside>
    </div>
  </div>;
}
