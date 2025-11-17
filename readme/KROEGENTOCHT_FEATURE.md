# Kroegentocht Feature Documentation

## Overview
The Kroegentocht (pub crawl) page is a standalone public signup page that allows anyone - members and non-members alike - to register for this special bi-annual event. This feature is designed for broader participation, including members from other student associations.

## Implementation Details

### Database Structure
The feature uses the existing `pub_crawl_events` table with the following structure:
```sql
CREATE TABLE public.pub_crawl_events (
    id serial PRIMARY KEY,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL UNIQUE,
    association character varying(50),
    amount_tickets integer NOT NULL,
    name_initials character varying(255),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone
);
```

### Files Created/Modified

#### 1. **New Page Component**
- **File**: `src/pages/KroegentochtPagina.tsx`
- **Purpose**: Main signup page for the Kroegentocht event
- **Features**:
  - Public access (no authentication required)
  - Form fields:
    - Name (required)
    - Email (required)
    - Association selection from predefined list (required)
    - Custom association input (if "Anders" is selected)
    - Number of tickets (1-10, required)
  - Success confirmation display
  - Error handling
  - Responsive design matching site theme

#### 2. **API Additions**
- **File**: `src/lib/api.ts`
- **Changes**: Added `create` method to `pubCrawlEventsApi`
```typescript
create: async (data: { 
  name: string; 
  email: string; 
  association: string; 
  amount_tickets: number 
}) => {
  return directusFetch<any>(`/items/pub_crawl_events`, {
    method: 'POST',
    body: JSON.stringify(data)
  });
}
```

#### 3. **Routing**
- **File**: `src/App.tsx`
- **Changes**: Added route for `/kroegentocht` path
```typescript
<Route path="/kroegentocht" element={<KroegentochtPagina />} />
```

#### 4. **Navigation**
- **File**: `src/components/NavBar.tsx`
- **Changes**: Added "Kroegentocht" link to navigation menu
- **Position**: Between "Activiteiten" and "Commissies"

### Predefined Associations
The form includes a dropdown with the following associations:
- Salve Mundi
- Proto
- Thor
- Thalia
- S.V. LIFE
- S.V. Inter-Actief
- Anders (with custom text input)

## User Flow

1. **Navigate to page**: User visits `/kroegentocht`
2. **View event information**: Right column shows event details and important information
3. **Fill out form**: User enters:
   - Full name
   - Email address
   - Association (select from list or enter custom)
   - Number of tickets (1-10)
4. **Submit**: Form validates and submits to Directus backend
5. **Confirmation**: Success message displayed with email confirmation notice
6. **Option to register again**: Button to clear form for new signup

## Features

### Accessibility
- No authentication required
- Mobile-responsive design
- Clear form validation
- Error messages displayed prominently

### User Experience
- Consistent styling with rest of site (Salve Mundi theme colors)
- Loading states during submission
- Success confirmation with email display
- Ability to submit multiple registrations
- Maximum 10 tickets per registration

### Information Display
Three information cards on the right side:
1. **Event Description**: Overview of what the Kroegentocht is
2. **Event Details**: Date, time, location, and price (marked as TBA)
3. **Important Information**: Key points about participation, age requirements, and contact info

## Future Enhancements

Potential improvements for future iterations:

1. **Email Confirmation**: Integration with email service to send confirmation emails
2. **Payment Integration**: Add payment processing for ticket purchases
3. **Event Management**: Admin interface to view/manage signups
4. **Dynamic Event Data**: Pull event details (date, time, price) from database
5. **QR Code Tickets**: Generate unique QR codes for each ticket
6. **Capacity Management**: Set maximum capacity and show remaining spots
7. **Group Registration**: Allow users to register groups with individual names
8. **Waitlist**: Implement waitlist when event is full
9. **Calendar Integration**: Add to calendar button for event details
10. **Multiple Events**: Support for different Kroegentocht events (spring/fall)

## Testing Checklist

- [ ] Form validation works for all required fields
- [ ] Association dropdown shows all options
- [ ] Custom association input appears when "Anders" is selected
- [ ] Ticket number validation (1-10)
- [ ] Email validation
- [ ] Successful submission shows confirmation
- [ ] Error handling displays appropriate messages
- [ ] Mobile responsive layout works correctly
- [ ] Navigation link works from all pages
- [ ] Data saves correctly to database
- [ ] Duplicate email handling (should fail due to unique constraint)

## API Endpoints

### Create Pub Crawl Signup
**Endpoint**: `POST /items/pub_crawl_events`

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "association": "Salve Mundi",
  "amount_tickets": 2
}
```

**Response**: Returns created event object with ID

## Notes

- The email field has a UNIQUE constraint in the database, so duplicate signups with the same email will fail
- The `name_initials` field in the database is currently not used by the form but could be added for future name formatting
- The `updated_at` timestamp is automatically managed by the database
- No authentication is required for this page, making it accessible to non-members

## Support

For questions or issues related to the Kroegentocht feature, contact the development team or open an issue in the repository.
