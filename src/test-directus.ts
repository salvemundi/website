import { directusFetch, directusUrl } from './lib/directus';

// Test the Directus REST API connection
async function testDirectusConnection() {
  console.log('🔍 Testing Directus REST API connection...');
  console.log('📍 Directus URL:', directusUrl);

  try {
    // Test fetching events
    const events = await directusFetch<any[]>('/items/events?limit=1');
    console.log('✅ Directus connection successful!');
    console.log('📊 Sample event:', events[0]);

    // Test fetching committees
    const committees = await directusFetch<any[]>('/items/committees?limit=1');
    console.log('📋 Sample committee:', committees[0]);

  } catch (error) {
    console.error('❌ Directus connection failed:', error);
  }
}

// Only run in browser context
if (typeof window !== 'undefined') {
  testDirectusConnection();
}

export { testDirectusConnection };

