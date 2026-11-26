import { createBrowserClient } from '@supabase/ssr';

const memoryLocks = new Map<string, Promise<unknown>>();

async function inMemoryLock<R>(name: string, _acquireTimeout: number, fn: () => Promise<R>): Promise<R> {
    const prev = memoryLocks.get(name) ?? Promise.resolve();
    const next = prev.catch(() => undefined).then(() => fn());
    memoryLocks.set(name, next);
    try {
        return await next;
    } finally {
        if (memoryLocks.get(name) === next) {
            memoryLocks.delete(name);
        }
    }
}

function timedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    if (init?.signal || typeof AbortSignal === 'undefined' || !('timeout' in AbortSignal)) {
        return fetch(input, init);
    }
    return fetch(input, { ...init, signal: AbortSignal.timeout(12000) });
}

let browserClient: ReturnType<typeof createBrowserClient<any>> | null = null;

export function createClient() {
    if (typeof window !== 'undefined' && browserClient) {
        return browserClient;
    }
    const client = createBrowserClient<any>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { lock: inMemoryLock },
            global: { fetch: timedFetch },
        }
    );
    if (typeof window !== 'undefined') {
        browserClient = client;
    }
    return client;
}
