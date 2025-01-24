import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export async function checkDatabaseState() {
  try {
    // Check tables count
    const tables = ['publishers', 'locations', 'real_estate_ads', 'pictures', 'options'];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      console.log(`${table} count:`, count);
    }

    // Get sample real estate ad with relations
    const { data: sample, error: sampleError } = await supabase
      .from('real_estate_ads')
      .select(`
        *,
        publisher:publisher_id(*),
        location:location_id(*),
        pictures(*),
        options(*)
      `)
      .limit(1)
      .single();
    
    if (sampleError) throw sampleError;
    console.log('Sample property with relations:', sample);

  } catch (error) {
    console.error('Error checking database state:', error);
  }
}