
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

async function checkRoles() {
    const { data, error } = await supabase
        .from('user_roles')
        .select('user_id, count(*)')
        .group('user_id')
        .having('count(*).gt.1');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Users with multiple roles:', data);

    const { data: allRoles } = await supabase.from('user_roles').select('*');
    console.log('All roles:', allRoles);
}

checkRoles();
