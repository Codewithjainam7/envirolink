import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';

const memoryLocks = new Map<string, Promise<unknown>>();

// Avoid Chrome/WebView navigator.locks deadlocks by using an in-tab sequential queue
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

export function createClient() {
    return createBrowserClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: { lock: inMemoryLock },
            global: { fetch: timedFetch },
        }
    );
}

// Singleton instance for client-side use
let supabaseInstance: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabase() {
    if (typeof window === 'undefined') {
        return createClient();
    }
    if (!supabaseInstance) {
        supabaseInstance = createClient();
    }
    return supabaseInstance;
}
