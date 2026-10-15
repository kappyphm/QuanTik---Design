"use client";
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { type AnalysisVisuals } from "@/lib/mock-data";
export function QuantModelVisual({ report, kind }: {
    report: AnalysisVisuals;
    kind: "monte" | "garch";
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const rotation = useRef({ yaw: -.58, pitch: .32 });
    const drag = useRef<{
        x: number;
        y: number;
    } | null>(null);
    const redraw = useRef<() => void>(() => { });
    const [playing, setPlaying] = useState(false);
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas)
            return;
        const ctx = canvas.getContext("2d");
        if (!ctx)
            return;
        const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
        const terminal = canvas.closest(".terminal");
        let width = 0, height = 0, frame: number | null = null, visible = false, disposed = false, last = 0, time = 0;
        let palette = { grid: "", text: "", muted: "", accent: "", positive: "" };
        const all = report.monteCarlo.paths.flat(), minimum = Math.min(...all), maximum = Math.max(...all);
        function readColors() {
            if (!canvas)
                return;
            const style = getComputedStyle(canvas);
            palette = { grid: style.getPropertyValue("--border").trim(), text: style.getPropertyValue("--text").trim(), muted: style.getPropertyValue("--muted").trim(), accent: style.getPropertyValue("--accent").trim(), positive: style.getPropertyValue("--positive").trim() };
        }
        function draw() {
            if (!ctx || !width || disposed)
                return;
            ctx.clearRect(0, 0, width, height);
            const yaw = rotation.current.yaw + (playing && !motion.matches && !drag.current ? Math.sin(time * .32) * .13 : 0);
            const pitch = rotation.current.pitch;
            const project = (x: number, y: number, z: number): [
                number,
                number
            ] => {
                const a = x * Math.cos(yaw) - y * Math.sin(yaw), b = x * Math.sin(yaw) + y * Math.cos(yaw);
                return [width * .5 + a * width * .28, height * .61 + b * height * .14 - z * height * .22 + Math.sin(pitch) * b * height * .14];
            };
            const line = (points: [
                number,
                number
            ][], color: string, alpha = 1, weight = 1) => {
                ctx.strokeStyle = color;
                ctx.globalAlpha = alpha;
                ctx.lineWidth = weight;
                ctx.beginPath();
                points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y));
                ctx.stroke();
                ctx.globalAlpha = 1;
            };
            for (let i = 0; i <= 8; i++) {
                const v = -1 + i / 4;
                line([project(v, -1, 0), project(v, 1, 0)], palette.grid);
                line([project(-1, v, 0), project(1, v, 0)], palette.grid);
            }
            line([project(-1, -1, 0), project(-1, -1, 1.8)], palette.muted);
            if (kind === "monte") {
                report.monteCarlo.paths.forEach((path, j) => {
                    const points = path.map((value, i) => project(-1 + i / (path.length - 1) * 2, -1 + j / (report.monteCarlo.paths.length - 1) * 2, .2 + (value - minimum) / (maximum - minimum || 1) * 1.45));
                    line(points, j === 15 ? palette.accent : palette.positive, j === 15 ? 1 : .32, j === 15 ? 2 : 1);
                });
            }
            else {
                const surface = report.garch.surface;
                const point = (row: number, col: number) => {
                    const p = surface[row][col];
                    return project(p.shock / 2, (p.previous - .4) / 1.6 * 2 - 1, p.next / 2.2 * 1.6);
                };
                for (let i = 0; i < surface.length; i++) {
                    line(surface[i].map((_, j) => point(i, j)), i === 8 ? palette.accent : palette.positive, i === 8 ? 1 : .6, i === 8 ? 2 : 1);
                    line(surface.map((_, j) => point(j, i)), palette.positive, .24);
                }
            }
            ctx.font = '13px "IBM Plex Mono", monospace';
            ctx.fillStyle = palette.muted;
            ctx.textAlign = "left";
            ctx.fillText(kind === "monte" ? "Giá (nghìn ₫)" : "Phương sai tiếp theo", 12, 20);
            ctx.fillText(kind === "monte" ? "Kịch bản" : "Phương sai trước", 12, height - 12);
            ctx.textAlign = "right";
            ctx.fillText(kind === "monte" ? "+20 phiên" : "Cú sốc ε", width - 12, height - 12);
        }
        function cancel() {
            if (frame != null)
                cancelAnimationFrame(frame);
            frame = null;
        }
        function canAnimate() { return playing && !motion.matches && visible && !document.hidden && !disposed; }
        function tick(now: number) {
            frame = null;
            if (!canAnimate())
                return;
            if (now - last >= 1000 / 30) {
                time += Math.min((now - last) / 1000, .05);
                last = now;
                draw();
            }
            frame = requestAnimationFrame(tick);
        }
        function sync() {
            cancel();
            draw();
            last = performance.now();
            if (canAnimate())
                frame = requestAnimationFrame(tick);
        }
        function resize() {
            if (!canvas || !ctx)
                return;
            const rect = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
            width = rect.width;
            height = rect.height;
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
            readColors();
            draw();
        }
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(canvas);
        const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
        intersection.observe(canvas);
        const theme = new MutationObserver(() => { readColors(); draw(); });
        if (terminal)
            theme.observe(terminal, { attributes: true, attributeFilter: ["data-theme"] });
        const preference = () => {
            setReduced(motion.matches);
            if (motion.matches)
                setPlaying(false);
            sync();
        };
        motion.addEventListener("change", preference);
        document.addEventListener("visibilitychange", sync);
        redraw.current = draw;
        resize();
        preference();
        document.fonts.ready.then(() => {
            if (!disposed)
                draw();
        });
        return () => { disposed = true; cancel(); resizeObserver.disconnect(); intersection.disconnect(); theme.disconnect(); motion.removeEventListener("change", preference); document.removeEventListener("visibilitychange", sync); redraw.current = () => { }; };
    }, [report, kind, playing]);
    return <div className="quant-model-view">
    <div className="quant-model-toolbar flex flex-wrap items-center justify-between [gap:12px] [font-size:14px] [color:var(--muted)] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:6px]"><span>3D · kéo để xoay</span><div>
      <button className="button secondary [.auth-stage_.account-login_&]:w-full [.auth-stage_.account-login_&]:justify-center [.auth-stage_.account-login_&]:[min-height:46px] [.account-actions_&]:[white-space:normal] [.account-table_&]:[font-size:11px] inline-flex items-center justify-center [gap:9px] [font-size:14px] [font-weight:500] [border-width:1px] [border-style:solid] [border-color:transparent] [padding:10px_15px] [border-radius:4px] [min-height:42px] whitespace-nowrap [transition:background_0.18s,_transform_0.18s] [.button&]:[background:var(--surface)] [.button&]:[border-color:var(--border)] [.button&]:[color:var(--text)] [.button&:hover]:[background:var(--raised)] [.chart-controls_&]:[font-size:14px] [.chart-controls_&]:[padding:8px_12px] [.quant-panel.compact_.quant-panel-heading_&]:w-full max-[1100px]:[.quant-panel.compact_.quant-panel-heading_&]:[width:auto] max-[700px]:[.selected-actions_&]:[flex:1] max-[700px]:[min-height:42px] [.scan-intro-actions_&]:[min-height:52px] [.scan-intro-actions_&]:[padding:13px_20px] [.scan-intro-actions_&]:[font-size:16px] [.quant-chart-views_&]:[padding:8px_12px] [.quant-chart-views_&]:[font-size:14px] [.quant-chart-views_&[aria-pressed='true']]:[color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[border-color:var(--accent)] [.quant-chart-views_&[aria-pressed='true']]:[background:var(--accent-soft)] [.quant-model-toolbar_&]:[padding:8px_10px] [.quant-model-toolbar_&]:[font-size:14px] max-[700px]:[.scan-intro-actions_&]:justify-center max-[700px]:[.scan-intro-actions_&]:w-full" disabled={reduced} aria-pressed={playing} onClick={() => setPlaying(!playing)}>{playing ? <Pause size={16}/> : <Play size={16}/>}{playing ? "Tạm dừng" : "Phát chuyển động"}</button>
      <button className="icon-button inline-flex items-center justify-center [width:40px] [height:40px] [flex-shrink:0] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-radius:4px] [background:transparent] [color:var(--muted)] [transition:background_0.18s,_color_0.18s] [&:hover]:[background:var(--raised)] [&:hover]:[color:var(--text)]" aria-label="Đặt lại góc nhìn 3D" onClick={() => { rotation.current = { yaw: -.58, pitch: .32 }; redraw.current(); }}><RotateCcw size={18}/></button>
    </div></div>
    <canvas className="quant-model-canvas block w-full [height:300px] [cursor:grab] [touch-action:pan-y] [&:active]:[cursor:grabbing] max-[700px]:[height:270px]" ref={canvasRef} tabIndex={0} role="img" aria-label={`${kind === "monte" ? "Monte Carlo" : "GARCH"} 3D ${report.symbol}, minh họa; kéo hoặc dùng phím mũi tên để xoay`} onKeyDown={e => {
            if (!e.key.startsWith("Arrow"))
                return;
            e.preventDefault();
            rotation.current.yaw += e.key === "ArrowLeft" ? -.1 : e.key === "ArrowRight" ? .1 : 0;
            rotation.current.pitch = Math.max(-.5, Math.min(.7, rotation.current.pitch + (e.key === "ArrowUp" ? .05 : e.key === "ArrowDown" ? -.05 : 0)));
            redraw.current();
        }} onPointerDown={e => { drag.current = { x: e.clientX, y: e.clientY }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => {
            if (!drag.current)
                return;
            rotation.current.yaw += (e.clientX - drag.current.x) * .006;
            if (e.pointerType === "mouse")
                rotation.current.pitch = Math.max(-.5, Math.min(.7, rotation.current.pitch + (e.clientY - drag.current.y) * .003));
            drag.current = { x: e.clientX, y: e.clientY };
            redraw.current();
        }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }} onLostPointerCapture={() => { drag.current = null; }}/>
  </div>;
}
