import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listApps() {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .eq('email', 'abdulquadrialaka@gmail.com')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('Error:', error);
    return;
  }

  console.log('Applications for abdulquadrialaka@gmail.com:\n');
  data.forEach((app, i) => {
    console.log(`${i + 1}. ${app.program} (${app.status})`);
    console.log(`   ID: ${app.id}`);
    console.log(`   Days: ${app.preferred_days ? JSON.stringify(app.preferred_days) : 'None'}`);
    console.log(`   Times: ${app.preferred_times ? JSON.stringify(app.preferred_times) : 'None'}`);
    console.log('');
  });
}

listApps().catch(console.error);
