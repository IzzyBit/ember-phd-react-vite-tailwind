import React,{useEffect,useMemo,useRef,useState} from 'react';
import {useEmber} from '../App';
import {allTasks,children,nodeProgress,roots} from '../lib/model';
import {Button,Icon,KIND_ICON,PageHero} from './UI';

const NODE_W=208,NODE_H=82,V_GAP=170,LEAF_W=248;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function layoutGraph(ws,collapsed){
  const visible=[],positions=new Map(),memo=new Map(),active=new Set();
  const folded=(node,depth)=>collapsed[node.id]??depth>=2;
  const span=(node,depth)=>{
    if(memo.has(node.id))return memo.get(node.id);
    if(active.has(node.id))return LEAF_W;
    active.add(node.id);
    const ch=folded(node,depth)?[]:children(ws,node.id);
    const width=ch.length?Math.max(LEAF_W,ch.reduce((total,c)=>total+span(c,depth+1),0)):LEAF_W;
    memo.set(node.id,width);active.delete(node.id);return width;
  };
  let maxDepth=0;
  const walk=(node,left,depth)=>{
    if(positions.has(node.id))return;
    maxDepth=Math.max(maxDepth,depth);
    const x=left+span(node,depth)/2-NODE_W/2+(Number(node.offsetX)||0);
    const y=135+depth*V_GAP+(Number(node.offsetY)||0);
    const row={node,x,y,depth};positions.set(node.id,row);visible.push(row);
    let cursor=left;
    if(!folded(node,depth))for(const c of children(ws,node.id)){walk(c,cursor,depth+1);cursor+=span(c,depth+1);}
  };
  let cursor=70;
  for(const root of roots(ws)){walk(root,cursor,0);cursor+=span(root,0)+70;}
  return {visible,positions,width:Math.max(700,cursor+70),height:Math.max(580,320+(maxDepth+1)*V_GAP)};
}
export default function TreeCanvas(){
  const {app,currentWs,openNode,updateNode,collapsed,setCollapsed,setModal}=useEmber();
  const [view,setView]=useState({x:0,y:0,zoom:.74});
  const [drag,setDrag]=useState(null);
  const [panning,setPanning]=useState(false);
  const canvas=useRef(null),gesture=useRef(null),suppress=useRef(0),viewRef=useRef(view);
  viewRef.current=view;
  const branchStates=collapsed[currentWs.id]||{};
  const graph=useMemo(()=>layoutGraph(currentWs,branchStates),[currentWs,branchStates]);
  const positions=useMemo(()=>{
    const copy=new Map(graph.positions);
    if(drag&&copy.has(drag.id))copy.set(drag.id,{...copy.get(drag.id),x:drag.x,y:drag.y});
    return copy;
  },[graph,drag]);
  const fit=()=>{
    const el=canvas.current;if(!el||graph.visible.length===0)return;
    const w=el.clientWidth,h=el.clientHeight;
    const xs=graph.visible.map(r=>r.x),ys=graph.visible.map(r=>r.y);
    const minX=Math.min(...xs)-80,maxX=Math.max(...xs)+NODE_W+80;
    const minY=Math.min(...ys)-90,maxY=Math.max(...ys)+NODE_H+90;
    const zoom=clamp(Math.min((w-80)/(maxX-minX),(h-90)/(maxY-minY),1.02),.22,1.55);
    setView({zoom,x:(w-(minX+maxX)*zoom)/2,y:(h-(minY+maxY)*zoom)/2});
  };
  const centerRoot=()=>{
    const el=canvas.current;if(!el)return;
    const root=graph.visible.find(r=>!r.node.parentId)||graph.visible[0];if(!root)return;
    const zoom=.8;setView({zoom,x:el.clientWidth/2-(root.x+NODE_W/2)*zoom,y:95-root.y*zoom});
  };
  const zoomAt=(factor,x=null,y=null)=>{
    const el=canvas.current;if(!el)return;
    setView(prev=>{
      const cx=x??el.clientWidth/2,cy=y??el.clientHeight/2,z=clamp(prev.zoom*factor,.22,1.55);
      return {zoom:z,x:cx-(cx-prev.x)/prev.zoom*z,y:cy-(cy-prev.y)/prev.zoom*z};
    });
  };
  useEffect(()=>{
    const el=canvas.current;if(!el)return;
    const wheel=e=>{e.preventDefault();const b=el.getBoundingClientRect();zoomAt(e.deltaY<0?1.12:1/1.12,e.clientX-b.left,e.clientY-b.top);};
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel);
  },[]);
  useEffect(()=>{
    const timer=requestAnimationFrame(()=>{
      const el=canvas.current;if(!el)return;
      const xs=graph.visible.map(r=>r.x),ys=graph.visible.map(r=>r.y);
      if(!xs.length)return;
      const spanX=Math.max(...xs)-Math.min(...xs)+NODE_W+160;
      const spanY=Math.max(...ys)-Math.min(...ys)+NODE_H+180;
      const fitZoom=clamp(Math.min((el.clientWidth-80)/spanX,(el.clientHeight-90)/spanY,1.02),.22,1.55);
      if(graph.visible.length>8 && fitZoom<.58){
        const root=graph.visible.find(r=>!r.node.parentId)||graph.visible[0],zoom=.68;
        setView({zoom,x:el.clientWidth/2-(root.x+NODE_W/2)*zoom,y:95-root.y*zoom});
      } else fit();
    });return()=>cancelAnimationFrame(timer);
  },[currentWs.id]);
  const handleDown=e=>{
    if(e.button!==0||e.target.closest('.map-overlay')||e.target.closest('.node-toggle'))return;
    const target=e.target.closest('[data-node-id]'),record=target&&positions.get(target.dataset.nodeId);
    gesture.current=record?{type:'node',id:record.node.id,startX:e.clientX,startY:e.clientY,baseX:record.x,baseY:record.y,moved:false,zoom:viewRef.current.zoom}
      :{type:'pan',startX:e.clientX,startY:e.clientY,baseX:viewRef.current.x,baseY:viewRef.current.y};
  };
  useEffect(()=>{
    const onMove=e=>{
      const g=gesture.current;if(!g)return;
      const dx=e.clientX-g.startX,dy=e.clientY-g.startY;
      if(g.type==='pan'){setView(p=>({...p,x:g.baseX+dx,y:g.baseY+dy}));setPanning(true);}
      else if(Math.hypot(dx,dy)>5){g.moved=true;setDrag({id:g.id,x:g.baseX+dx/g.zoom,y:g.baseY+dy/g.zoom});}
    };
    const onUp=e=>{
      const g=gesture.current;if(!g)return;
      if(g.type==='node'&&g.moved){
        updateNode(g.id,n=>{n.offsetX=(Number(n.offsetX)||0)+(e.clientX-g.startX)/g.zoom;n.offsetY=(Number(n.offsetY)||0)+(e.clientY-g.startY)/g.zoom;});
        suppress.current=Date.now()+300;
      }
      gesture.current=null;setDrag(null);setPanning(false);
    };
    window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',onUp);
    return()=>{window.removeEventListener('pointermove',onMove);window.removeEventListener('pointerup',onUp);window.removeEventListener('pointercancel',onUp)};
  },[updateNode]);
  const expandAll=()=>setCollapsed(s=>({...s,[currentWs.id]:Object.fromEntries(currentWs.nodes.map(n=>[n.id,false]))}));
  const collapseAll=()=>setCollapsed(s=>({...s,[currentWs.id]:Object.fromEntries(currentWs.nodes.map(n=>[n.id,n.parentId!==null]))}));
  const toggle=(record)=>{
    setCollapsed(s=>({...s,[currentWs.id]:{...s[currentWs.id],[record.node.id]:!(s[currentWs.id]?.[record.node.id]??record.depth>=2)}}));
  };
  const tasks=allTasks(app.data,app.progress,currentWs.id);
  return <>
    <PageHero eyebrow="YOUR GROWING WORLD" title={currentWs.title} description={currentWs.subtitle} actions={<><Button icon="Code2" onClick={()=>setModal({type:'json'})}>Edit JSON</Button><Button icon="Plus" variant="primary" onClick={()=>setModal({type:'node'})}>Add goal</Button></>}/>
    <div className="map-stats"><span><Icon name="Leaf" size={16}/><b>{currentWs.nodes.length}</b> goals in your world</span><span><Icon name="Check" size={15}/><b>{tasks.filter(t=>t.done).length}</b> / {tasks.length} quests completed</span><span><Icon name="Sparkles" size={15}/> Drag to explore your map</span></div>
    <section className="map-frame" aria-label="Interactive hierarchy map">
      <div ref={canvas} className={`map-canvas ${panning?'panning':''}`} onPointerDown={handleDown}>
        <div className="map-grid" style={{backgroundPosition:`${view.x}px ${view.y}px`,backgroundSize:`${Math.max(7,Math.round(24*view.zoom))}px ${Math.max(7,Math.round(24*view.zoom))}px`}}/>
        <div className="map-scene" style={{width:graph.width,height:graph.height,transform:`translate(${view.x}px, ${view.y}px) scale(${view.zoom})`}}>
          <svg className="edge-layer" viewBox={`0 0 ${graph.width} ${graph.height}`} aria-hidden="true">
            {graph.visible.filter(r=>r.node.parentId&&positions.has(r.node.parentId)).map(r=>{
              const from=positions.get(r.node.parentId),to=positions.get(r.node.id);
              const x1=from.x+NODE_W/2,y1=from.y+NODE_H-2,x2=to.x+NODE_W/2,y2=to.y+2,mid=(y1+y2)/2;
              return <g key={r.node.id}><path d={`M ${x1} ${y1} C ${x1} ${mid}, ${x2} ${mid}, ${x2} ${y2}`} fill="none" stroke="#bc825c" strokeWidth="2" strokeOpacity=".68"/><circle cx={x2} cy={y2} r="3.5" fill="#bf7950"/></g>;
            })}
          </svg>
          {graph.visible.map(record=>{
            const {node,depth}=record,position=positions.get(node.id),ch=children(currentWs,node.id),prog=nodeProgress(currentWs,node,app.progress,true),folded=branchStates[node.id]??depth>=2;
            return <div key={node.id} data-node-id={node.id} className={`graph-node kind-${node.kind||'quest'} ${prog.total&&prog.pct===100?'completed':''}`} style={{left:position.x,top:position.y}}>
              <button className="graph-node-main" onClick={()=>{if(Date.now()>=suppress.current)openNode(node.id)}} title={`Open ${node.title} page`}>
                <span className="node-icon"><Icon name={KIND_ICON[node.kind]||'Flag'} size={18}/></span>
                <span className="node-text"><b>{node.title}</b>{node.kind==='root'&&<small>{currentWs.subtitle}</small>}</span>
                {prog.total>0&&prog.pct===100&&<span className="node-check"><Icon name="Check" size={14}/></span>}
              </button>
              <div className="node-bottom"><span className="node-progress-track"><span style={{width:`${prog.pct}%`}}/></span><span className="node-fraction">{prog.done}/{prog.total}</span>
              {ch.length?<button className="node-toggle" title={folded?'Expand children':'Collapse children'} aria-label={`${folded?'Expand':'Collapse'} ${node.title}`} onClick={()=>toggle(record)}><Icon name={folded?'Plus':'Minus'} size={15}/></button>:<span className="toggle-spacer"/>}</div>
            </div>;
          })}
        </div>
        <div className="map-overlay top-left"><div className="map-label"><Icon name="Compass" size={14}/> QUEST WORLD</div><p>Click a goal to open its page.<br/>Use + to reveal connected goals.</p></div>
        <div className="map-overlay map-controls"><button aria-label="Zoom in" title="Zoom in" onClick={()=>zoomAt(1.2)}><Icon name="Plus"/></button><button aria-label="Zoom out" title="Zoom out" onClick={()=>zoomAt(1/1.2)}><Icon name="Minus"/></button><button title="Fit hierarchy" aria-label="Fit hierarchy" onClick={fit}><Icon name="Maximize2"/></button><button title="Center root" aria-label="Center root" onClick={centerRoot}><Icon name="Target"/></button></div>
        <div className="map-overlay bottom-left"><Icon name="Map" size={16}/> Pan to move <span className="dot-sep">·</span> Scroll to zoom <span className="dot-sep">·</span> Drag nodes</div>
        <div className="map-overlay bottom-right"><button onClick={collapseAll}>Collapse</button><span>/</span><button onClick={expandAll}>Expand all</button></div>
      </div>
    </section>
  </>;
}
