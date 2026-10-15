import { uiClasses } from "./ui-classes";

/** Shared Tailwind variants; semantic hooks keep tests/conditional selectors stable. */
export function tw(value: string | undefined | null | false): string {
  if (!value) return "";
  const hooks = value.trim().split(/\s+/);
  const rules = hooks.flatMap(hook => uiClasses[hook] || []).sort((a, b) => a[0] - b[0]);
  const utilities = new Map<string, string>();
  for (const [, property, utility] of rules) utilities.set(property, utility);
  return [...new Set([...hooks, ...utilities.values()])].join(" ");
}
