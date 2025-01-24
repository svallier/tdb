import { createClient } from '@supabase/supabase-js';
 
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
 
export async function checkDatabaseState() {
  try {
    // Vérifier la connexion à la base de données avec une requête simple
    const { count, error: countError } = await supabase
      .from('real_estate_ads')
      .select('*', { count: 'exact', head: true });
 
    if (countError) {
      console.error('Database health check failed:', countError);
      return;
    }
 
    console.log('Database connection: OK');
    console.log('Total properties:', count);
 
    // Vérifier la structure des données avec un échantillon
    const { data: sample, error: sampleError } = await supabase
      .from('real_estate_ads')
      .select(`
        id,
        title,
        price,
        surface,
        reference,
        picture_url,
        pictures (
          picture_url
        ),
        location:location_id (
          id,
          city,
          region_code,
          coordinates
        )
      `)
      .limit(1)
      .single();
 
    if (sampleError) {
      console.error('Sample data check failed:', sampleError);
      return;
    }
 
    // Vérifier les champs critiques
    const criticalFields = {
      'ID': sample?.id,
      'Title': sample?.title,
      'Price': sample?.price,
      'Surface': sample?.surface,
      'Location': sample?.location?.city,
      'Coordinates': sample?.location?.coordinates,
      'Pictures': sample?.pictures?.length || (sample?.picture_url ? 1 : 0)
    };
 
    console.log('Data structure check:', criticalFields);
 
  } catch (error) {
    console.error('Checkpoint verification failed:', error);
  }
}