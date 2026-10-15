"use client";
import {useEffect, useId, useMemo, useRef, useState, type CSSProperties, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import katex from 'katex';
import {getTerm, glossary, type TermDefinition} from '@/content/legacy/glossary';
import {usePreferences} from './preferences';

export function Formula({latex}: {latex: string}) {
  const html = useMemo(() => katex.renderToString(latex || String.raw`\text{Chưa xác định}`, {
    throwOnError: false, trust: false, displayMode: true, output: 'htmlAndMathml',
  }), [latex]);
  return <div className="term-formula" dangerouslySetInnerHTML={{__html: html}} />;
}

// The five sections and every content field retain the old TermHint text.
export function TermContent({term}: {term: TermDefinition}) {
  return <>
    <div className="term-title"><strong>{term.en}</strong></div><small>{term.vi}</small>
    <h4>01 · Lý thuyết</h4><p>{term.short}</p>
    <h4>02 · Công thức</h4><Formula latex={term.formulaLatex}/><p className="term-note preserve-lines">{term.variables}</p>
    <p className="term-note preserve-lines"><b>Tham số:</b> {term.parameters}</p>
    <h4>03 · Ví dụ minh họa</h4><p>{term.example}</p>
    <h4>04 · Ngưỡng và điều kiện</h4><p className="term-note preserve-lines">{term.conditions || term.interpretation || 'Không có ngưỡng chung. Đối chiếu cửa sổ, đơn vị và cấu hình của mô hình đang dùng.'}</p><small>Ngưỡng tài liệu là tham khảo; cấu hình pipeline và mục tiêu kiểm định quyết định ngưỡng thực.</small>
    <h4>05 · Cách sử dụng</h4><p className="term-note">{term.usage}</p><p className="term-note">{term.limitations}</p>
  </>;
}

export default function TermHint({id, children}: {id: string; children?: ReactNode}) {
  const term = getTerm(id);
  const {theme} = usePreferences();
  const anchor = useRef<HTMLButtonElement>(null), popup = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mode, setMode] = useState<'hover' | 'pinned' | null>(null);
  const [position, setPosition] = useState<CSSProperties>({left: 12, top: 12});
  const [host, setHost] = useState<Element | null>(null);
  const uid = useId();
  const cancel = () => {if (timer.current) clearTimeout(timer.current);};
  const close = () => {cancel(); setMode(null);};
  const hide = () => {cancel(); timer.current = setTimeout(() => setMode(m => m === 'pinned' ? m : null), 180);};
  const show = () => {cancel(); timer.current = setTimeout(() => setMode(m => m === 'pinned' ? m : 'hover'), 250);};
  useEffect(() => () => {if (timer.current) clearTimeout(timer.current);}, []);
  useEffect(() => {
    if (!mode) return;
    // A tooltip opened in a modal must remain in that modal's top layer.
    setHost(anchor.current?.closest('dialog[open]') ?? document.body);
    const place = () => {
      const r = anchor.current?.getBoundingClientRect(); if (!r) return;
      const width = Math.min(390, window.innerWidth - 24);
      const height = popup.current?.offsetHeight ?? 220;
      setPosition({left: Math.max(12, Math.min(r.left, window.innerWidth - width - 12)), top: Math.max(12, Math.min(r.bottom + 8, window.innerHeight - height - 12)), width, maxHeight: window.innerHeight - 24});
    };
    place(); const frame = requestAnimationFrame(place);
    window.addEventListener('resize', place); document.addEventListener('scroll', place, true);
    const dismiss = (e: KeyboardEvent) => {if (e.key === 'Escape') {e.preventDefault(); e.stopPropagation(); close();}};
    const outside = (e: PointerEvent) => {if (!popup.current?.contains(e.target as Node) && !anchor.current?.contains(e.target as Node)) close();};
    document.addEventListener('keydown', dismiss, true); document.addEventListener('pointerdown', outside);
    return () => {cancelAnimationFrame(frame); window.removeEventListener('resize', place); document.removeEventListener('scroll', place, true); document.removeEventListener('keydown', dismiss, true); document.removeEventListener('pointerdown', outside);};
  }, [mode]);
  if (!term) return <>{children || id}</>;
  return <><button ref={anchor} type="button" className="term-trigger" aria-describedby={mode ? uid : undefined}
    onPointerEnter={show} onPointerLeave={hide} onFocus={show} onBlur={hide}
    onClick={e => {e.preventDefault(); e.stopPropagation(); cancel(); setMode(m => m === 'pinned' ? null : 'pinned');}}
    >{children || term.en}</button>
    {mode && host && createPortal(<div ref={popup} id={uid} className="term-popover" data-theme={theme} style={position} role="tooltip" onPointerEnter={cancel} onPointerLeave={hide} onClick={e => e.stopPropagation()}>
      <TermContent term={term}/>
    </div>, host)}
  </>;
}

const aliases = glossary.map(term => ({text: term.en, id: term.id}));
aliases.push(...[['HMM','hmm'],['AnnRet','annual_return'],['MaxDD','max_drawdown'],['Max drawdown','max_drawdown'],['Monte Carlo','monte_carlo'],['MC','monte_carlo'],['Quant Factor','quant_factor'],['Quant Factors','quant_factor'],['Quant','quant_score'],['RR','risk_reward']].map(([text,id]) => ({text,id})));
const unique = [...new Map(aliases.map(a => [a.text.toLowerCase(),a])).values()].sort((a,b) => b.text.length-a.text.length);
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
const pattern = new RegExp(`(?<![a-z0-9_])(${unique.map(a => escape(a.text)).join('|')})(?![a-z0-9_])`,'gi');
const lookup = new Map(unique.map(a => [a.text.toLowerCase(),a.id]));
export function AnnotatedText({text}: {text: string}) {
  const chunks: ReactNode[] = []; let cursor = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > cursor) chunks.push(text.slice(cursor, match.index));
    chunks.push(<TermHint key={match.index} id={lookup.get(match[0].toLowerCase())!}>{match[0]}</TermHint>);
    cursor = match.index + match[0].length;
  }
  if (cursor < text.length) chunks.push(text.slice(cursor));
  return <>{chunks}</>;
}
