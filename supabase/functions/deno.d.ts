// Type definitions for Deno runtime in Supabase Edge Functions
declare namespace Deno {
    export function serve(
        handler: (request: Request) => Response | Promise<Response>
    ): void;

    export namespace env {
        export function get(key: string): string | undefined;
    }
}

// Type declarations for ESM imports
declare module 'https://esm.sh/@supabase/supabase-js@2' {
    export * from '@supabase/supabase-js';
}
