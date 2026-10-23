"use client";
import {useId,useMemo,useState,type ReactNode} from "react";
import type {AnalysisReport,QuantResearch} from "@/lib/api/analysis";
import {factorNames,number,record} from "@/lib/quant-reader";
import type {ScenarioScene} from "@/lib/quant-scenario-data";
import {SceneCanvas} from "./quant-scenario-3d";
const finite=(v:unknown):v is number=>typeof v==="number"&&Number.isFinite(v);
const button="rounded border px-3 py-2 text-xs";
function Switch({name,view,onChange,labels=["2D","3D"]}:{name:string;view:number;onChange:(n:number)=>void;labels?:string[]}) {return <div role="group" aria-label={name} className="mb-4 flex flex-wrap gap-2">{labels.map((label,i)=><button key={label} type="button" aria-pressed={view===i} onClick={()=>onChange(i)} className={`${button} ${view===i?"border-[var(--accent)] text-[var(--accent)]":"border-[var(--border)] text-[var(--muted)]"}`}>{label}</button>)}</div>;}
export function garchResponseScene(report:AnalysisReport):ScenarioScene|null {
 const section=report.sections.garch,outer=record(section?.metrics.garch),garch=record(outer.garch),params=record(garch.simulation_params);
 const omega=params.omega_pct2,alpha=params.alpha,beta=params.beta,sigma=garch.current_vol_pct;
 if(!section||section.status==="DISABLED"||[outer,garch].some(v=>v.error||v.disabled===true||v.available===false)||![omega,alpha,beta,sigma].every(finite)||Number(omega)<0||Number(alpha)<0||Number(beta)<0||Number(sigma)<=0)return null;
 const rows=Array.from({length:13},(_,i)=>{const previous=Number(sigma)**2*(.25+i/12*1.75);return {name:`Phương sai trước ${number(previous)}`,color:i===6?"accent" as const:"positive" as const,points:Array.from({length:17},(_,j)=>{const shock=Number(sigma)*(-3+j/16*6);return {x:shock,y:previous,z:Number(omega)+Number(alpha)*shock**2+Number(beta)*previous,label:"Phản ứng phương sai"};})};});
 const series=[...rows,...Array.from({length:17},(_,j)=>({name:`Cú sốc ${j}`,color:"positive" as const,points:rows.map(row=>row.points[j])}))],points=series.flatMap(s=>s.points);
 if(points.some(p=>![p.x,p.y,p.z].every(finite)))return null;
 return {series,labels:[],axes:["Cú sốc ε (%)","Phương sai trước (%²)","Phương sai tiếp theo (%²)"],domains:[[Math.min(...points.map(p=>p.x)),Math.max(...points.map(p=>p.x))],[Math.min(...points.map(p=>p.y)),Math.max(...points.map(p=>p.y))],[Math.min(...points.map(p=>p.z)),Math.max(...points.map(p=>p.z))]]};
}
export function QuantGarchView({report,children}:{report:AnalysisReport;children:ReactNode}) {
 const [view,setView]=useState(0),scene=useMemo(()=>garchResponseScene(report),[report]);
 return <><Switch name="Góc nhìn biến động GARCH" view={view} onChange={setView}/>{view===0?children:scene?<><SceneCanvas scene={scene} frame={16} title={`Mặt phản ứng GARCH 3D ${report.symbol}`}/><p className="mt-3 text-xs leading-6 text-[var(--muted)]">Mặt phản ứng h = ω + αε² + βh trước, dùng tham số công bố. Khoảng trục minh hoạ quanh biến động hiện tại; đây không phải phân phối hoặc một dự báo mới.</p></>:<p className="py-8 text-xs leading-6 text-[var(--muted)]">Báo cáo chưa có đủ ω, α, β và biến động hiện tại để vẽ mặt phản ứng 3D. Biểu đồ biến động 2D vẫn giữ nguyên.</p>}</>;
}
export function QuantFactorViews({data,children}:{data:QuantResearch["factors"];children:ReactNode}) {
 const [view,setView]=useState(0),[angle,setAngle]=useState(-25),[selected,setSelected]=useState(0),angleId=useId();
 const factors=data.filter(p=>[p.value,p.min,p.max].every(finite)&&p.max>p.min),current=factors[Math.min(selected,factors.length-1)];
 return <><Switch name="Góc nhìn hồ sơ nhân tố" labels={["Radar","3D"]} view={view} onChange={setView}/>{view===0?children:!factors.length?<p className="py-8 text-xs text-[var(--muted)]">Chưa có dữ liệu nhân tố hợp lệ để hiển thị 3D.</p>:<>
 <div role="img" aria-label="Hồ sơ nhân tố 3D từ báo cáo" className="flex h-72 items-center overflow-x-auto [perspective:800px]"><div className="mx-auto flex min-w-max items-end gap-4 border-b border-[var(--border)] p-6 [transform-style:preserve-3d]" style={{transform:`rotateX(24deg) rotateY(${angle}deg)`}}>{factors.map((p,i)=>{const fraction=Math.max(0,Math.min(1,(p.value-p.min)/(p.max-p.min)));return <button type="button" key={p.id} aria-label={`Nhân tố ${factorNames[p.id]||p.label}: ${number(p.value)}`} aria-pressed={selected===i} onClick={()=>setSelected(i)} className="relative w-7 shrink-0 border border-[var(--surface)] [transform-style:preserve-3d]" style={{height:`${Math.max(1,fraction*160)}px`,background:selected===i?"var(--accent)":"var(--positive)"}}><span className="absolute inset-y-0 right-0 w-3 bg-inherit opacity-50 [transform:rotateY(90deg)_translateZ(6px)]"/><span className="absolute left-0 right-0 top-0 h-3 bg-inherit [transform:rotateX(90deg)_translateZ(6px)]"/><span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text)]">{number(fraction*100)}</span><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-[var(--muted)]">{i+1}</span></button>;})}</div></div>
 <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-[var(--muted)]"><label htmlFor={angleId}>Xoay góc nhân tố</label><input id={angleId} aria-label="Xoay góc nhân tố" type="range" min="-55" max="55" value={angle} onChange={event=>setAngle(Number(event.target.value))} className="w-28 accent-[var(--accent)]"/><button type="button" className="rounded border border-[var(--border)] px-3 py-2" onClick={()=>setAngle(-25)}>Đặt lại góc nhân tố</button></div>
 <div className="mt-4 grid grid-cols-2 gap-2 text-xs">{factors.map((p,i)=><button type="button" key={p.id} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`min-w-0 rounded border p-2 text-left ${selected===i?"border-[var(--accent)]":"border-[var(--border)]"}`}><span className="mr-2 text-[var(--accent)]">{i+1}</span>{factorNames[p.id]||p.label}</button>)}</div>
 {current&&<p className="mt-3 text-xs leading-6 text-[var(--muted)]">{factorNames[current.id]||current.label}: giá trị gốc {number(current.value)} · miền {number(current.min)} đến {number(current.max)}. Chiều cao 0–100 là quy đổi trong miền của từng nhân tố, không phải xác suất hay điểm mua.</p>}</>}</>;
}
