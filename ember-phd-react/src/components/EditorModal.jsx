import React,{useEffect,useState} from 'react';
import {useEmber} from '../App';
import {children,isDescendant,nodeById,ancestors} from '../lib/model';
import {Icon,Button} from './UI';

function Field({label,children}){return <label className="field-label"><span>{label}</span>{children}</label>}
const control='field-control';
export default function EditorModal(){
  const {app,currentWs,node,modal,setModal,addNode,editNode,addWorkspace,editWorkspace,saveModule,applyJson,exportJson}=useEmber();
  const edit=modal.type==='node'?nodeById(currentWs,modal.id):modal.type==='module'?nodeById(currentWs,modal.nodeId)?.modules.find(m=>m.id===modal.id):null;
  const [title,setTitle]=useState(edit?.title||((modal.type==='workspace'&&modal.edit)?currentWs.title:''));
  const [description,setDescription]=useState(modal.type==='workspace'&&modal.edit?currentWs.subtitle:(edit?.description||''));
  const [parentId,setParentId]=useState(edit?.kind==='root'?'':(edit?.parentId||currentWs.nodes.find(n=>!n.parentId)?.id||''));
  const [kind,setKind]=useState(edit?.kind||'quest');
  const [moduleType,setModuleType]=useState(edit?.type||'text');
  const initialContent=edit?.type==='checklist'?(edit.items||[]).map(t=>t.text).join('\n'):edit?.type==='links'?(edit.items||[]).map(t=>`${t.text} | ${t.url}`).join('\n'):edit?.body||'';
  const [content,setContent]=useState(initialContent);
  const [json,setJson]=useState(()=>JSON.stringify(app.data,null,2));
  const [error,setError]=useState('');
  useEffect(()=>{const escape=e=>{if(e.key==='Escape')setModal(null)};window.addEventListener('keydown',escape);return()=>window.removeEventListener('keydown',escape)},[setModal]);
  const close=()=>setModal(null);
  const submit=e=>{
    e.preventDefault();if(!title.trim())return setError('Please enter a title.');
    if(modal.type==='node'){
      if(modal.id)editNode(modal.id,{title:title.trim(),description:description.trim(),parentId:edit?.kind==='root'?null:parentId,kind:edit?.kind==='root'?'root':kind});
      else addNode({title:title.trim(),description:description.trim(),parentId,kind});
    } else if(modal.type==='workspace'){
      if(modal.edit)editWorkspace(title.trim(),description.trim());else addWorkspace(title.trim(),description.trim());
    } else if(modal.type==='module')saveModule(modal.nodeId,{title:title.trim(),type:moduleType,content},modal.id);
  };
  const modalTitle=modal.type==='json'?'Edit hierarchy JSON':modal.type==='node'?(modal.id?'Edit goal':'Create goal'):modal.type==='workspace'?(modal.edit?'Edit workspace':'Create a new world'):(modal.id?'Edit page module':'Add a page module');
  const modalDesc=modal.type==='json'?'Change your workspaces and parent-child links directly.':'Build the world you want to explore, one step at a time.';
  return <div className="modal-backdrop" onPointerDown={e=>{if(e.target===e.currentTarget)close()}}>
    <div role="dialog" aria-modal="true" aria-label={modalTitle} className={`modal ${modal.type==='json'?'wide':''}`}>
      <div className="modal-header"><div><h2>{modalTitle}</h2><p>{modalDesc}</p></div><button className="icon-btn" aria-label="Close dialog" onClick={close}><Icon name="X"/></button></div>
      {modal.type==='json'?<>
        <div className="json-info"><Icon name="FileText" size={17}/> Workspaces contain nodes with <code>id</code>, <code>parentId</code>, <code>title</code>, and <code>modules</code>. Progress is stored separately.</div>
        <textarea aria-label="Hierarchy JSON" className="json-input" spellCheck={false} value={json} onChange={e=>setJson(e.target.value)}/>
        {error&&<p className="json-error" role="alert">{error}</p>}
        <div className="modal-actions"><Button icon="Copy" onClick={()=>navigator.clipboard?.writeText(json).catch(()=>setError('Clipboard unavailable. Select and copy the JSON.'))}>Copy</Button><Button icon="Download" onClick={()=>exportJson(false)}>Export</Button><Button icon="Check" variant="primary" onClick={()=>{try{const parsed=JSON.parse(json);if(!applyJson(JSON.stringify(parsed)))setError('Invalid hierarchy. Check node IDs and parents.')}catch(e){setError(e.message)}}}>Apply JSON</Button></div>
      </>:<form onSubmit={submit} className="grid gap-4">
        <Field label={modal.type==='module'?'Module heading':modal.type==='workspace'?'Workspace name':'Goal title'}><input className={control} required value={title} onChange={e=>setTitle(e.target.value)} placeholder={modal.type==='workspace'?'New world':'Give this goal a name'}/></Field>
        {(modal.type==='node'||modal.type==='workspace')&&<Field label={modal.type==='workspace'?'Short description':'Description'}><textarea className={control} rows={3} value={description} onChange={e=>setDescription(e.target.value)} placeholder="What would success look like?"/></Field>}
        {modal.type==='node'&&edit?.kind!=='root'&&<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Parent goal"><select className={control} value={parentId} onChange={e=>setParentId(e.target.value)}>{currentWs.nodes.filter(n=>n.id!==modal.id&&(!modal.id||!isDescendant(currentWs,n,modal.id))).map(n=><option key={n.id} value={n.id}>{'— '.repeat(Math.min(ancestors(currentWs,n).length-1,4))}{n.title}</option>)}</select></Field>
          <Field label="Node type"><select className={control} value={kind} onChange={e=>setKind(e.target.value)}>{['quest','group','category',...(modal.id&&edit?.kind==='root'?['root']:[])].map(v=><option key={v} value={v}>{v[0].toUpperCase()+v.slice(1)}</option>)}</select></Field>
        </div>}
        {modal.type==='module'&&<>
          <Field label="Module type"><select className={control} value={moduleType} onChange={e=>setModuleType(e.target.value)}>{[['text','Text / description'],['checklist','Checklist / achievements'],['links','Resource links'],['callout','Highlighted note']].map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Field>
          <Field label={moduleType==='checklist'?'Checklist items (one per line)':moduleType==='links'?'Links (Title | https://...)':'Module content'}><textarea className={control} value={content} onChange={e=>setContent(e.target.value)} rows={7} placeholder={moduleType==='checklist'?'One achievement per line':moduleType==='links'?'Paper | https://example.com':'Describe this goal…'}/></Field>
          <p className="text-xs text-[#9c816b]">{moduleType==='checklist'?'Each new checklist item earns 50 XP when completed.':'Modules can be added, edited and removed independently.'}</p>
        </>}
        {error&&<p role="alert" className="text-sm text-red-700">{error}</p>}
        <div className="modal-actions"><Button onClick={close}>Cancel</Button><button type="submit" className="btn btn-primary"><Icon name="Check" size={15}/>{modal.id||modal.edit?'Save changes':`Create ${modal.type==='workspace'?'world':modal.type==='node'?'goal':'module'}`}</button></div>
      </form>}
    </div>
  </div>;
}
