/// <reference path="../deno.d.ts" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SyncResult = {
  success: boolean;
  inserted_or_updated?: number;
  total_auth_users?: number;
  error?: string;
};

function getFullName(user: any): string | null {
  const name =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.name ??
    user?.user_metadata?.display_name ??
    null;
  return typeof name === 'string' && name.trim().length > 0 ? name.trim() : null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Authorization header required' } satisfies SyncResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || Deno.env.get('APP_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized' } satisfies SyncResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 401,
      });
    }

    // Admin-only
    const { data: isAdminRow, error: roleErr } = await adminClient
      .from('user_roles')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (roleErr) throw roleErr;
    if (!isAdminRow) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden' } satisfies SyncResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 403,
      });
    }

    // Paginate through auth users and upsert profiles
    const perPage = 1000;
    let page = 1;
    let total = 0;
    let upserted = 0;

    // Safety cap to avoid runaway loops in case of unexpected API behavior
    const maxPages = 50;

    while (page <= maxPages) {
      const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
      if (error) throw error;

      const users = data?.users ?? [];
      total += users.length;
      if (users.length === 0) break;

      const rows = users
        .filter((u) => !!u?.id)
        .map((u) => ({
          user_id: u.id,
          email: u.email ?? null,
          full_name: getFullName(u),
          avatar_url: (typeof u?.user_metadata?.avatar_url === 'string' ? u.user_metadata.avatar_url : null) ?? null,
        }));

      if (rows.length > 0) {
        const { error: upsertError } = await adminClient
          .from('profiles')
          .upsert(rows, { onConflict: 'user_id' });
        if (upsertError) throw upsertError;
        upserted += rows.length;
      }

      if (users.length < perPage) break;
      page += 1;
    }

    return new Response(
      JSON.stringify({ success: true, inserted_or_updated: upserted, total_auth_users: total } satisfies SyncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 },
    );
  } catch (error) {
    console.error('Error in sync-users-profiles:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      } satisfies SyncResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
    );
  }
});
