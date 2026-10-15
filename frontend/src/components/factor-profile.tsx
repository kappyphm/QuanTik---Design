"use client";
import {useState} from 'react';
import {RotateCcw} from 'lucide-react';
import {factorProfile, drawdownSeries} from '@/lib/factor-profile';
import {format, type AnalysisVisuals, type ScanResult} from '@/lib/mock-data';

export function FactorProfile({result,report}:{result:ScanResult;report:AnalysisVisuals}) {
  const factors=factorProfile(result,report), [view,setView]=useState('radar'), [selected,setSelected]=useState(0), [angle,setAngle]=useState(-25);
  const point=(i:number,r:number)=>{const a=-Math.PI/2+i*Math.PI/3;return [270+Math.cos(a)*r,210+Math.sin(a)*r];};
  const polygon=(r:number)=>factors.map((_,i)=>point(i,r).join(',')).join(' ');
  const best=[...factors].filter(f=>f.score!=null).sort((a,b)=>b.score!-a.score!)[0];
  return <div className="factor-profile">
    <div className="factor-layout"><div className="factor-chart-panel">
      <div className="quant-chart-views" role="group" aria-label="Góc nhìn hồ sơ nhân tố">{[['radar','Radar 2D'],['3d','Cột 3D']].map(([id,label])=><button key={id} className="button secondary" aria-pressed={view===id} onClick={()=>setView(id)}>{label}</button>)}</div>
      {view==='radar'?<svg viewBox="0 0 540 430" className="factor-radar" role="img" aria-label={`Hồ sơ nhân tố ${result.symbol}, thang quy đổi 0 đến 100`}>
        {[.25,.5,.75,1].map(r=><g key={r}><polygon points={polygon(145*r)} fill="none" stroke="var(--border)"/><text x={276} y={210-145*r-4} fill="var(--muted)" fontSize="11">{r*100}</text></g>)}
        {factors.map((f,i)=>{const p=point(i,145), l=point(i,181);return <g key={f.label}><line x1="270" y1="210" x2={p[0]} y2={p[1]} stroke="var(--border)"/><text x={l[0]} y={l[1]} fill="var(--muted)" fontSize="12" textAnchor="middle" dominantBaseline="middle">{f.label}</text></g>;})}
        <polygon points={factors.map((f,i)=>point(i,(f.score??0)*1.45).join(',')).join(' ')} fill="var(--accent)" fillOpacity=".16" stroke="var(--accent)" strokeWidth="2.5"/>
        {factors.map((f,i)=>{const p=point(i,(f.score??0)*1.45);return <circle key={f.label} cx={p[0]} cy={p[1]} r={selected===i?6:4} fill="var(--accent)"><title>{f.label}: {f.score??'thiếu dữ liệu'}/100 · {f.raw}</title></circle>;})}
      </svg>:<div className="factor-three">
        <div className="factor-three-scene" role="img" aria-label={`Cột nhân tố 3D ${result.symbol}`}><div className="factor-three-world" style={{transform:`rotateX(24deg) rotateY(${angle}deg)`}}>{factors.map((f,i)=><button className={`factor-column ${selected===i?'selected':''}`} key={f.label} onClick={()=>setSelected(i)} style={{height:`${Math.max(2,f.score??0)*1.7}px`}} aria-label={`${f.label}: ${f.score??'thiếu dữ liệu'} điểm`}><span className="factor-column-front"/><span className="factor-column-side"/><span className="factor-column-top"/><strong>{f.score??'—'}</strong><small>{i+1}</small></button>)}</div></div>
        <div className="factor-rotation"><label htmlFor={`rotate-${result.symbol}`}>Xoay góc nhìn</label><input id={`rotate-${result.symbol}`} type="range" min="-55" max="55" value={angle} onChange={e=>setAngle(Number(e.target.value))}/><button className="icon-button" aria-label="Đặt lại góc nhân tố" onClick={()=>setAngle(-25)}><RotateCcw size={16}/></button></div>
      </div>}
      <p className="factor-caption">0–100 · thang quy đổi để đọc hồ sơ; không phải xác suất thắng hay thứ hạng toàn thị trường.</p>
    </div><div className="factor-matrix"><div className="factor-score"><span>ĐIỂM QUANT MẪU</span><strong>{result.score}<small>/100</small></strong><p>Điểm từ bộ dữ liệu mẫu, độc lập với sáu trục bên trái.</p></div>
      {factors.map((f,i)=><button className="factor-row" aria-pressed={selected===i} key={f.label} onClick={()=>setSelected(i)}><span className="factor-index">0{i+1}</span><span>{f.label}<small>{f.raw}</small><i><b style={{width:`${f.score??0}%`}}/></i></span><strong>{f.score??'—'}<small>/100</small></strong></button>)}
    </div></div>
    <div className="factor-interpretation" aria-live="polite"><span>ĐỌC KẾT QUẢ · {result.symbol}</span><h4>{factors[selected].label}: {factors[selected].raw}</h4><p>{factors[selected].reading} {best?`Trục có điểm quy đổi cao nhất là ${best.label.toLowerCase()} (${best.score}/100); các trục dùng thang khác nhau nên cần đọc cả số liệu gốc.`:''}</p><p className="factor-caption">Cách quy đổi: {factors[selected].rule} Bộ dữ liệu chưa có RSI; hồ sơ dùng Hurst và ER thay cho việc tự tạo chỉ số momentum.</p></div>
  </div>;
}
export function DrawdownProfile({report}:{report:AnalysisVisuals}) {
  const values=drawdownSeries(report.hmm.history.map(p=>p.price)), min=Math.min(0,...values), floor=Math.min(-1,min), x=(i:number)=>40+i/Math.max(1,values.length-1)*660, y=(v:number)=>40+v/floor*170;
  const line=values.map((v,i)=>`${x(i)},${y(v)}`).join(' '), current=values.at(-1)??0;
  return <div className="drawdown-profile"><svg className="quant-plot-svg" viewBox="0 0 740 260" role="img" aria-label={`Drawdown từ chuỗi giá mẫu ${report.symbol}`}>{[0,.5,1].map(t=><g key={t}><line x1="40" x2="700" y1={40+t*170} y2={40+t*170} stroke="var(--border)"/><text x="2" y={44+t*170} fill="var(--muted)" fontSize="11">{format(floor*t,1)}%</text></g>)}<polygon points={`40,40 ${line} 700,40`} fill="var(--negative)" fillOpacity=".14"/><polyline points={line} fill="none" stroke="var(--negative)" strokeWidth="2"/><text x="40" y="245" fill="var(--muted)" fontSize="12">Phiên 1</text><text x="700" y="245" textAnchor="end" fill="var(--muted)" fontSize="12">Phiên {values.length}</text></svg><div className="quant-section-reading"><p>Giá cuối mẫu đang thấp hơn đỉnh của cửa sổ <strong>{format(Math.abs(current))}%</strong>. Mức giảm sâu nhất trong {values.length} phiên trên biểu đồ là <strong>{format(Math.abs(min))}%</strong>.</p><p>Drawdown đo khoảng cách so với đỉnh đã xuất hiện. Cửa sổ biểu đồ ngắn có thể khác chỉ số giảm từ đỉnh của báo cáo; không đồng nghĩa giới hạn lỗ tương lai.</p></div></div>;
}
