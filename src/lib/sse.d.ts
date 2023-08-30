import type { source } from "sveltekit-sse";

export type Connection = ReturnType<typeof source>;
export type Selection = ReturnType<Connection['select']>;