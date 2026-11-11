import React from 'react';
import {
  Leaf, Map, Sparkles, Trophy, Plus, Minus, Compass, BookOpen, BrainCircuit,
  BriefcaseBusiness, Folder, Settings, Download, Upload, ChevronDown, ArrowLeft,
  ArrowRight, Trash2, Target, Activity, Heart, Smile, Check, Circle, Maximize2,
  RotateCcw, Menu, Pencil, CalendarDays, Copy, X, Link2, Layers3, FileText,
  Moon, Flame, Flag, ListChecks, Code2, Eye, CheckCircle2, GraduationCap,
  Search, PanelRight, PanelLeft, Book, MapPinned, Send
} from 'lucide-react';
const icons = {
  Leaf,Map,Sparkles,Trophy,Plus,Minus,Compass,BookOpen,BrainCircuit,BriefcaseBusiness,
  Folder,Settings,Download,Upload,ChevronDown,ArrowLeft,ArrowRight,Trash2,Target,Activity,
  Heart,Smile,Check,Circle,Maximize2,RotateCcw,Menu,Pencil,CalendarDays,Copy,X,Link2,
  Layers:Layers3,Layers3,FileText,Moon,Flame,Flag,ListChecks,Code2,Eye,CheckCircle2,
  GraduationCap,Search,PanelRight,PanelLeft,Book,MapPinned,Send
};
export function Icon({name,size=18,className='',...props}){const C=icons[name]||Circle;return <C size={size} strokeWidth={1.8} className={className} aria-hidden="true" {...props}/>;}
export const KIND_ICON = {root:'Trophy',category:'Layers',group:'Folder',quest:'Flag'};
export function Button({icon,children,variant='subtle',className='',...props}){
  return <button type="button" className={`btn btn-${variant} ${className}`} {...props}>{icon&&<Icon name={icon} size={16}/>} {children}</button>;
}
export function PageHero({eyebrow,title,description,actions}){
  return <div className="page-hero"><div className="hero-copy"><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{actions&&<div className="hero-tools">{actions}</div>}</div>;
}
export function IconButton({icon,title,onClick,className=''}){
  return <button type="button" aria-label={title} title={title} className={`icon-btn ${className}`} onClick={onClick}><Icon name={icon} size={16}/></button>;
}
export function MiniProgress({value=0,className=''}){return <div className={`module-mini-progress ${className}`}><span style={{width:`${value}%`}}/></div>;}
