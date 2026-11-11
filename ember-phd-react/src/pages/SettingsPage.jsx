import React,{useRef} from 'react';
import {useEmber} from '../App';
import {Button,Icon,PageHero} from '../components/UI';

export default function SettingsPage(){
  const {app,currentWs,setModal,duplicateWorkspace,deleteWorkspace,exportJson,applyJson,reset,worldTasks}=useEmber();
  const input=useRef(null);
  const importFile=async e=>{
    const file=e.target.files?.[0];if(!file)return;
    try{applyJson(await file.text());}catch(err){alert(err.message);}e.target.value='';
  };
  return <>
    <PageHero eyebrow="CUSTOMIZE YOUR WORLD" title="Settings & data" description="Your worlds are JSON-powered and stored in this browser. Export a backup to keep a safe copy."/>
    <div className="settings-grid">
      <article className="module-card"><div className="module-title"><Icon name="Layers" size={20}/><h3>Current workspace</h3></div><p>{currentWs.title} — {currentWs.nodes.length} nodes, {worldTasks.filter(t=>t.done).length} completed quests.</p><div className="settings-action-list"><Button icon="Pencil" onClick={()=>setModal({type:'workspace',edit:true})}>Edit workspace details</Button><Button icon="Copy" onClick={duplicateWorkspace}>Duplicate hierarchy</Button><Button icon="Trash2" variant="danger" onClick={deleteWorkspace}>Delete current workspace</Button></div></article>
      <article className="module-card"><div className="module-title"><Icon name="Folder" size={20}/><h3>JSON and backups</h3></div><p>Edit the hierarchy visually, or export and edit the JSON files yourself.</p><div className="settings-action-list"><Button icon="Code2" onClick={()=>setModal({type:'json'})}>Open JSON editor</Button><Button icon="Download" onClick={()=>exportJson(false)}>Export hierarchy</Button><Button icon="Download" onClick={()=>exportJson(true)}>Export full progress backup</Button><Button icon="Upload" onClick={()=>input.current?.click()}>Import JSON / backup</Button><input ref={input} type="file" hidden accept=".json,application/json" onChange={importFile}/></div></article>
      <article className="module-card"><div className="module-title"><Icon name="Heart" size={20}/><h3>Wellbeing</h3></div><p>Vitality and mood are voluntary personal check-ins. They never penalize your achievements or level.</p><p>The data remains in your browser unless you export it.</p></article>
      <article className="module-card"><div className="module-title"><Icon name="RotateCcw" size={20}/><h3>Start over</h3></div><p>Restore the original sample workspaces. This also clears the saved achievements, notes and check-ins.</p><div className="settings-action-list"><Button icon="RotateCcw" variant="danger" onClick={reset}>Reset to starter data</Button></div></article>
    </div>
  </>;
}
