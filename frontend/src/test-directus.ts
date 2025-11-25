import { directusFetch, directusUrl } from './lib/directus';
import { committeesApi } from './lib/api';

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
    console.log('📋 Sample committee (basic):', committees[0]);

    // Test fetching committees with members
    const committesWithMembers = await committeesApi.getAllWithMembers();
    console.log('📋 Committees with members:', committesWithMembers.length);
    if (committesWithMembers.length > 0) {
      console.log('📋 First committee with members:', committesWithMembers[0]);
      console.log('👥 Members structure:', committesWithMembers[0].members);
    }

    // Test fetching a specific committee by ID
    if (committesWithMembers.length > 0) {
      const committeeId = committesWithMembers[0].id;
      const detailedCommittee = await committeesApi.getById(committeeId);
      console.log('📋 Detailed committee:', detailedCommittee);
      console.log('👥 Detailed members:', detailedCommittee.members);
      console.log('🔑 All keys in committee:', Object.keys(detailedCommittee));
    }

    // Test with all fields
    console.log('🧪 Testing with wildcard fields...');
    const testCommittee1 = await directusFetch<any>('/items/committees/163?fields=*,members.*,members.member_id.*');
    console.log('📋 Test committee with wildcard:', testCommittee1);
    console.log('🔑 Keys:', Object.keys(testCommittee1));
    console.log('👥 Users field:', testCommittee1.users);

    // Check ALL committees for one that has committee_members
    console.log('🔍 Searching for committees with committee_members...');
    for (const comm of committesWithMembers) {
      if (comm.committee_members && comm.committee_members.length > 0) {
        console.log(`✅ Found committee with members: ${comm.name} (ID: ${comm.id})`);
        console.log('👥 Committee members:', comm.committee_members);
        console.log('📝 First member:', comm.committee_members[0]);
        console.log('📝 First member user_id:', comm.committee_members[0].user_id);
        break;
      }
    }

    // Check what fields are actually available in committees
    console.log('🔍 Checking available fields in committees...');
    const committeeWithAllFields = await directusFetch<any>('/items/committees/164?fields=*');
    console.log('📋 Committee with all fields:', committeeWithAllFields);
    console.log('� Available keys:', Object.keys(committeeWithAllFields));
    
    // Try to access the junction table directly
    try {
      console.log('🧪 Checking committee_members junction table directly...');
      const junctionData = await directusFetch<any[]>('/items/committee_members?filter[committee_id][_eq]=164&limit=10');
      console.log('📋 Junction table data for committee 164:', junctionData);
    } catch (error) {
      console.error('❌ Cannot access committee_members table:', error);
    }
    
    // Check if there's a different relationship field name
    console.log('🔍 Trying alternative field names...');
    const possibleFields = ['committee_members', 'members', 'users', 'directus_users'];
    for (const fieldName of possibleFields) {
      try {
        const test = await directusFetch<any>(`/items/committees/164?fields=*,${fieldName}`);
        if (test[fieldName]) {
          console.log(`✅ Found field: ${fieldName}`, test[fieldName]);
        }
      } catch (e: any) {
        console.log(`❌ Field ${fieldName} not accessible:`, e.message);
      }
    }

  } catch (error) {
    console.error('❌ Directus connection failed:', error);
  }
}

// Only run in browser context
if (typeof window !== 'undefined') {
  testDirectusConnection();
}

export { testDirectusConnection };

