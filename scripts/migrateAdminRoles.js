import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!url || !serviceKey) {
  throw new Error('SUPABASE_URL and SUPABASE_SERVICE_KEY are required.');
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

let page = 1;
let migrated = 0;

while (true) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;

  for (const user of users) {
    const legacyRole = user.user_metadata?.role;
    const currentRole = user.app_metadata?.role;
    if (!currentRole && (legacyRole === 'admin' || legacyRole === 'super_admin')) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        app_metadata: {
          ...user.app_metadata,
          role: legacyRole,
          is_active: user.user_metadata?.is_active !== false
        }
      });
      if (updateError) throw updateError;
      migrated += 1;
      console.log(`Migrated ${user.email}`);
    }
  }

  if (users.length < 1000) break;
  page += 1;
}

console.log(`Migration complete. ${migrated} admin account(s) updated.`);
