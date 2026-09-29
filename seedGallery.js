import { supabase } from './supabaseClient.js';

const tempImages = [
  {
    title: 'Sunday Worship',
    image_url: 'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'worship'
  },
  {
    title: 'Youth Retreat',
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'youth'
  },
  {
    title: 'Community Outreach',
    image_url: 'https://images.unsplash.com/photo-1593113565694-c6c7475d4a13?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'events'
  },
  {
    title: 'Baptism Service',
    image_url: 'https://images.unsplash.com/photo-1510595295738-f94e1d3e13d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'worship'
  },
  {
    title: 'Worship Team',
    image_url: 'https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'worship'
  },
  {
    title: 'Christmas Celebration',
    image_url: 'https://images.unsplash.com/photo-1543343360-15cb382756d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'events'
  }
];

async function seed() {
  console.log('Inserting temp images...');
  const { data, error } = await supabase.from('gallery').insert(tempImages);
  if (error) {
    console.error('Error seeding gallery:', error);
  } else {
    console.log('Successfully seeded gallery!');
  }
}

seed();
