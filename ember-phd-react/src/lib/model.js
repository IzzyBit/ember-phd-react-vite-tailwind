export const STORE_KEY = 'ember-questboard-v1';
export const DEFAULT_PROGRESS = {completed:{}, health:78, moodEntries:{}, notes:{}, visited:[], recent:[], hasCreatedNode:false};
export const MOODS = [
  {id:'low',label:'Low',mark:'◔'}, {id:'tired',label:'Tired',mark:'☾'},
  {id:'okay',label:'Okay',mark:'◡'}, {id:'good',label:'Good',mark:'✿'}, {id:'great',label:'Great',mark:'✦'}
];
export const today = () => new Date().toLocaleDateString('sv-SE');
export const uid = (prefix='id') => `${prefix}-${crypto.randomUUID().slice(0,8)}`;
export const slug = (t='goal') => String(t).toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,45)||'goal';
export const clone = value => structuredClone(value);
export const children = (ws,id) => ws.nodes.filter(n=>n.parentId===id);
export const nodeById = (ws,id) => ws.nodes.find(n=>n.id===id);
export const roots = ws => ws.nodes.filter(n=>!n.parentId);
export function ancestors(ws,node) {
  const arr=[],seen=new Set();let current=node;
  while(current && !seen.has(current.id)) { arr.unshift(current);seen.add(current.id);current=nodeById(ws,current.parentId); }
  return arr;
}
export function isDescendant(ws,node,ancestorId) {return ancestors(ws,node).some(n=>n.id===ancestorId) && node.id!==ancestorId;}
export const nodeTasks = node => (node?.modules||[]).filter(m=>m.type==='checklist').flatMap(m=>m.items||[]);
export const taskKey = (wsId,nodeId,taskId) => `${wsId}:${nodeId}:${taskId}`;
export const taskDone = (progress,wsId,nodeId,taskId) => Boolean(progress.completed[taskKey(wsId,nodeId,taskId)]);
export function allTasks(data,progress,wsId=null) {
  return data.workspaces.filter(w=>!wsId||w.id===wsId).flatMap(ws=>ws.nodes.flatMap(n=>nodeTasks(n).map(t=>({ws,n,t,done:taskDone(progress,ws.id,n.id,t.id)}))));
}
export function nodeProgress(ws,node,progress,includeDescendants=false){
  const ids=new Set([node.id]);
  if(includeDescendants){const queue=[node.id];while(queue.length){const id=queue.shift();for(const c of children(ws,id))if(!ids.has(c.id)){ids.add(c.id);queue.push(c.id);}}}
  const tasks=ws.nodes.filter(n=>ids.has(n.id)).flatMap(n=>nodeTasks(n).map(t=>({n,t})));
  const done=tasks.filter(({n,t})=>taskDone(progress,ws.id,n.id,t.id)).length;
  return {done,total:tasks.length,pct:tasks.length?Math.round(done/tasks.length*100):0};
}
export function achievements(data,progress){
  const checked=allTasks(data,progress).filter(t=>t.done);
  const branches=new Set(checked.map(({ws,n})=>`${ws.id}/${ancestors(ws,n)[1]?.id||n.id}`));
  const xp=checked.reduce((sum,v)=>sum+(Number(v.t.xp)||50),0);
  return [
    {id:'first',name:'First Spark',description:'Complete your first quest.',icon:'Sparkles',unlocked:checked.length>=1},
    {id:'five',name:'Steady Steps',description:'Complete 5 quests.',icon:'Map',unlocked:checked.length>=5},
    {id:'fifteen',name:'Forest Wanderer',description:'Complete 15 quests.',icon:'Leaf',unlocked:checked.length>=15},
    {id:'branches',name:'Many Paths',description:'Make progress in 3 branches.',icon:'Layers',unlocked:branches.size>=3},
    {id:'mood',name:'Mindful Moment',description:'Record a mood check-in.',icon:'Heart',unlocked:Object.values(progress.moodEntries).some(v=>v?.mood)},
    {id:'builder',name:'Architect',description:'Create your own quest node.',icon:'Plus',unlocked:progress.hasCreatedNode},
    {id:'explorer',name:'Explorer',description:'Open 8 different goal pages.',icon:'Compass',unlocked:progress.visited.length>=8},
    {id:'century',name:'Quest Keeper',description:'Earn 1,500 XP.',icon:'Trophy',unlocked:xp>=1500},
  ];
}
export function validateData(obj){
  if(!obj||!Array.isArray(obj.workspaces)||obj.workspaces.length===0)throw Error('JSON requires a non-empty workspaces array.');
  const wid=new Set();
  for(const ws of obj.workspaces){
    if(!ws.id||typeof ws.id!=='string'||wid.has(ws.id))throw Error('Workspace IDs must be unique strings.');
    wid.add(ws.id);
    if(!Array.isArray(ws.nodes)||!ws.nodes.length)throw Error(`Workspace ${ws.id} needs at least one node.`);
    const ids=new Set();
    for(const n of ws.nodes){
      if(!n.id||typeof n.id!=='string'||ids.has(n.id)||typeof n.title!=='string'||!Array.isArray(n.modules))throw Error(`Invalid node or duplicate ID in ${ws.id}.`);
      ids.add(n.id);
      for(const m of n.modules)if(!m.id||typeof m.type!=='string'||(m.type==='checklist'&&!Array.isArray(m.items)))throw Error(`Invalid module in ${n.id}.`);
    }
    for(const n of ws.nodes){
      if(n.parentId && !ids.has(n.parentId))throw Error(`Missing parent for ${n.id}.`);
      const seen=new Set([n.id]);let p=n.parentId;
      while(p){if(seen.has(p))throw Error(`Hierarchy cycle at ${n.id}.`);seen.add(p);p=ws.nodes.find(x=>x.id===p)?.parentId;}
    }
  }
  return true;
}
export function makeNode(ws,title,parentId,description='',kind='quest'){
  let id=slug(title),num=2;while(ws.nodes.some(n=>n.id===id))id=`${slug(title)}-${num++}`;
  return {id,parentId:parentId||null,title,description,kind,offsetX:0,offsetY:0,modules:[
    {id:uid('m'),title:'About this goal',type:'text',body:description||'Describe why this goal matters.'},
    {id:uid('m'),title:'Achievement checklist',type:'checklist',items:[{id:uid('q'),text:'Define the first concrete step',xp:50}]}
  ]};
}
export function makeWorkspace(title,subtitle=''){
  const id=uid(slug(title));return {id,title,subtitle,accent:'#b36a3a',nodes:[makeNode({nodes:[]},'My Main Quest',null,subtitle||'Your main quest.','root')]};
}
export function exportFile(payload,filename){
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=filename;document.body.append(anchor);anchor.click();anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
