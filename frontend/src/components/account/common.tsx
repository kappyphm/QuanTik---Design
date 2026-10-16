"use client";
import { accountStyles } from "@/components/account/styles";
import { cloneElement, isValidElement, useCallback, useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from "react";
import { api, raw, ApiError } from "@/lib/api/client";
import type { Page, Role } from "@/lib/api/contracts";
export function useResource<T>(path: string, role: Role | "public" = "user", revision = 0) {
    const [value, setValue] = useState<{
        path: string;
        data?: T;
        error?: Error;
        loading: boolean;
    }>({ path, loading: true });
    const [version, setVersion] = useState(0);
    const epoch = useRef(0);
    const reload = useCallback(() => setVersion(v => v + 1), []);
    useEffect(() => {
        const current = ++epoch.current;
        setValue(old => ({ path, data: old.path === path ? old.data : undefined, error: old.path === path ? old.error : undefined, loading: true }));
        void (role === "public" ? raw<T>(path) : api<T>(role, path)).then(data => {
            if (epoch.current === current)
                setValue({ path, data, loading: false });
        })
            .catch(error => {
            if (epoch.current === current)
                setValue(old => ({ ...old, error, loading: false }));
        });
        return () => { epoch.current++; };
    }, [path, role, version, revision]);
    return { ...(value.path === path ? value : { loading: true, data: undefined, error: undefined }), reload };
}
export function ErrorNotice({ error }: {
    error?: Error | null;
}) {
    return error ? <div className="account-notice negative [padding:16px] [border-width:1px] [border-style:solid] [border-color:var(--border)] [border-left-width:3px] [border-left-style:solid] [border-left-color:var(--accent)] [border-radius:4px] [line-height:1.7] [margin:16px_0] [overflow-wrap:anywhere] [&_small]:block [&_small]:[font-size:11px] [.terminal_&]:[color:var(--negative)]" role="alert">{error.message}{error instanceof ApiError && error.requestId && <small>Mã hỗ trợ: {error.requestId}</small>}</div> : null;
}
export function ResourceState({ loading, data, error, retry }: {
    loading: boolean;
    data?: unknown;
    error?: Error;
    retry: () => void;
}) {
    return <>{loading && !data && <p role="status">Đang tải…</p>}<ErrorNotice error={error}/>{error && <button className={accountStyles.buttonSecondary} onClick={retry}>Tải lại</button>}</>;
}
export function Field({ label, children }: {
    label: string;
    children: ReactNode;
}) {
    const id = useId();
    // Explicit label reference excludes select option text from the field's label.
    return <label className="account-field grid [gap:8px] [font-size:12px] [margin:10px_0] min-w-0 [&_input:not([type=checkbox])]:box-border [&_input:not([type=checkbox])]:w-full [&_input:not([type=checkbox])]:[min-height:44px] [&_input:not([type=checkbox])]:[border-width:1px] [&_input:not([type=checkbox])]:[border-style:solid] [&_input:not([type=checkbox])]:[border-color:var(--border)] [&_input:not([type=checkbox])]:[background:var(--surface)] [&_input:not([type=checkbox])]:[color:inherit] [&_input:not([type=checkbox])]:[padding:12px] [&_input:not([type=checkbox])]:[border-radius:4px] [&_input:not([type=checkbox])]:[font:inherit] [&_textarea]:box-border [&_textarea]:w-full [&_textarea]:[border-width:1px] [&_textarea]:[border-style:solid] [&_textarea]:[border-color:var(--border)] [&_textarea]:[background:var(--surface)] [&_textarea]:[color:inherit] [&_textarea]:[padding:12px] [&_textarea]:[border-radius:4px] [&_textarea]:[font:inherit] [&_select]:box-border [&_select]:w-full [&_select]:[min-height:44px] [&_select]:[border-width:1px] [&_select]:[border-style:solid] [&_select]:[border-color:var(--border)] [&_select]:[background:var(--surface)] [&_select]:[color:inherit] [&_select]:[padding:12px] [&_select]:[border-radius:4px] [&_select]:[font:inherit] [&_textarea]:[min-height:94px] [&_textarea]:[resize:vertical] [&_:focus-visible]:[outline:2px_solid_var(--accent)] [&_:focus-visible]:[outline-offset:2px] [&_input:disabled]:[opacity:.5]"><span id={id}>{label}</span>{isValidElement(children) ? cloneElement(children as ReactElement<{
            "aria-labelledby"?: string;
        }>, { "aria-labelledby": id }) : children}</label>;
}
export function Reason({ value, onChange }: {
    value: string;
    onChange: (value: string) => void;
}) {
    return <Field label="Lý do (10–500 ký tự)"><textarea required minLength={10} maxLength={500} value={value} onChange={e => onChange(e.target.value)}/></Field>;
}
export function Confirm({ title, children, busy, disabled = false, onCancel, onConfirm }: {
    title: string;
    children: ReactNode;
    busy: boolean;
    disabled?: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    const section = useRef<HTMLElement>(null);
    useEffect(() => { section.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); section.current?.focus({ preventScroll: true }); }, []);
    return <section ref={section} tabIndex={-1} className="account-confirm [border-width:1px] [border-style:solid] [border-color:var(--accent)] [background:var(--surface)] [padding:22px] [margin:22px_0] [border-radius:4px] [overflow-wrap:anywhere] [&_p]:[line-height:1.7] [&_p]:[font-size:13px] [&_pre]:[white-space:pre-wrap] [&_pre]:[overflow-wrap:anywhere] [&_pre]:[max-height:400px] [&_pre]:overflow-auto [&_pre]:[font-size:11px]" aria-label={title}><h3>{title}</h3>{children}<div className={accountStyles.actions}><button type="button" className={accountStyles.buttonSecondary} disabled={busy} onClick={onCancel}>Quay lại</button><button type="button" className={accountStyles.buttonPrimary} disabled={busy || disabled} onClick={onConfirm}>{busy ? "Đang xử lý…" : "Xác nhận"}</button></div></section>;
}
export type Row = Record<string, unknown>;
export type Column = {
    key: string;
    label: string;
    render?: (value: unknown, row: Row) => ReactNode;
};
export function show(value: unknown): string {
    if (value == null)
        return "—";
    if (typeof value === "boolean")
        return value ? "Có" : "Không";
    return typeof value === "object" ? JSON.stringify(value) : String(value);
}
export function DataTable({ items, columns, action }: {
    items: Row[];
    columns: Column[];
    action?: (row: Row) => ReactNode;
}) {
    if (!items.length)
        return <p className="muted [.terminal_&]:[color:var(--muted)] [.panel-heading_>_&]:[font-size:14px] [.panel-heading_>_&]:[color:var(--muted)] [.panel-heading_>_&]:whitespace-nowrap [.analysis-price_>_&]:[font-size:14px]">Chưa có dữ liệu.</p>;
    return <div className={accountStyles.table} tabIndex={0} role="region" aria-label="Bảng dữ liệu; cuộn ngang để xem"><table><thead><tr>{columns.map(col => <th key={col.key}>{col.label}</th>)}{action && <th>Thao tác</th>}</tr></thead><tbody>{items.map((row, i) => <tr key={String(row.id ?? i)}>{columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : show(row[col.key])}</td>)}{action && <td>{action(row)}</td>}</tr>)}</tbody></table></div>;
}
export function PagedTable({ path, role = "admin", columns, action, revision = 0 }: {
    path: string;
    role?: Role;
    columns: Column[];
    action?: (row: Row) => ReactNode;
    revision?: number;
}) {
    const [cursors, setCursors] = useState<string[]>([""]);
    const identity = `${path}|${revision}`;
    const [previous, setPrevious] = useState(identity);
    if (previous !== identity) {
        setPrevious(identity);
        setCursors([""]);
    }
    const cursor = previous === identity ? cursors.at(-1)! : "";
    const result = useResource<Page<Row>>(`${path}${path.includes("?") ? "&" : "?"}limit=20${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`, role, revision);
    return <><ResourceState {...result} retry={result.reload}/>{result.data && <DataTable items={result.data.items} columns={columns} action={action}/>}<div className={accountStyles.actions}><button className={accountStyles.buttonSecondary} disabled={result.loading} onClick={result.reload}>Cập nhật</button><button className={accountStyles.buttonSecondary} disabled={cursors.length === 1 || result.loading} onClick={() => setCursors(v => v.slice(0, -1))}>Trang trước</button><button className={accountStyles.buttonSecondary} disabled={!result.data?.next_cursor || result.loading || !!result.error} onClick={() => setCursors(v => [...v, result.data!.next_cursor!])}>Trang sau</button></div></>;
}
