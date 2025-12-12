# Board History Page - Changes & Data Structure

## Overview
The board history page has been redesigned to display as a **vertical timeline** with improved visual hierarchy and better data organization.

## Changes Made

### 1. Data Structure Improvements (API Level)

**File:** `frontend/src/shared/lib/api/salvemundi.ts`

The Board collection now uses better fields for temporal organization:

```typescript
// Old structure (problematic):
{
  id: number,
  naam: string,  // e.g., "Bestuur 2023-2024" or "Bestuur v1.5"
  image: string,
  members: []
}

// New structure (improved):
{
  id: number,
  naam: string,           // Board name/identifier
  image: string,
  start_year: number,     // e.g., 2023
  end_year: number,       // e.g., 2024
  academic_year: string,  // e.g., "2023-2024" (optional, for display)
  members: []
}
```

**Benefits:**
- ✅ Proper chronological sorting by numeric years
- ✅ Better filtering and querying capabilities
- ✅ Cleaner separation of data vs display concerns
- ✅ Supports academic year ranges properly

### 2. Timeline Design

**File:** `frontend/src/app/bestuurs-geschiedenis/page.tsx`

**Key Features:**
- **Vertical Timeline:** Boards are displayed in chronological order from newest to oldest
- **Year Badges:** Each board has a sticky year badge on the left side
- **Timeline Connector:** Visual line connects all boards (visible on desktop)
- **Enhanced Cards:** Larger, more prominent board cards with improved imagery
- **Grid Layout for Members:** Board members displayed in a 2-column grid for better space usage

**Visual Elements:**
- Purple gradient timeline line
- Circular connection dots
- Sticky year badges with calendar icons
- Enhanced hover effects
- Better image overlays with board name

### 3. Sorting Logic

Boards are now sorted by:
1. `start_year` (primary)
2. `end_year` (fallback)
3. Most recent first (descending order)

## Required Directus Configuration

To use the new structure, update your Directus `Board` collection with these fields:

```typescript
Board Collection Fields:
- id (integer, primary key)
- naam (string) - Board name/identifier
- image (file/image) - Board photo
- start_year (integer) - Starting year (e.g., 2023)
- end_year (integer) - Ending year (e.g., 2024)
- academic_year (string, optional) - Display format (e.g., "2023-2024")
- members (M2M relation) - Link to board members via junction table
```

### Migration Guide

If you have existing boards with names like "Bestuur 2023-2024" or "Bestuur v1.5":

1. **Add new fields** to the Board collection:
   - `start_year` (integer)
   - `end_year` (integer)
   - `academic_year` (string, optional)

2. **Migrate existing data:**
   - Parse year ranges from `naam` field
   - Set `start_year` and `end_year` accordingly
   - Optionally populate `academic_year` for custom display

3. **Example migration:**
   ```sql
   -- For "Bestuur 2023-2024"
   UPDATE Board 
   SET start_year = 2023, 
       end_year = 2024, 
       academic_year = '2023-2024'
   WHERE naam LIKE '%2023-2024%';
   
   -- For "Bestuur v1.5" (legacy naming)
   -- Manually set appropriate years based on actual tenure period
   ```

## Benefits of New Approach

### 1. **Scalability**
- Easy to add boards for multiple years
- No naming convention confusion
- Proper database indexing on year fields

### 2. **Flexibility**
- Support for partial-year boards
- Handle mid-year transitions
- Easy to filter by date ranges

### 3. **User Experience**
- Clear chronological flow
- Visual timeline makes history easy to understand
- Better mobile responsiveness with sticky year badges

### 4. **Maintainability**
- Separation of concerns (data vs display)
- No need to parse strings to extract years
- Easier to query and filter in the future

## Visual Preview

```
┌─────────────┐
│  2024-2025  │ ←── Sticky year badge
└─────────────┘
      │
      ● ←──────── Timeline dot
      │
┌─────┴──────────────────────────────────┐
│  ╔═══════════════════════════════════╗ │
│  ║ [Board Photo]                     ║ │
│  ║                                   ║ │
│  ║ Bestuur 2024-2025                 ║ │
│  ╚═══════════════════════════════════╝ │
│                                        │
│  👥 8 bestuursleden                    │
│  ┌─────────────┬─────────────┐        │
│  │ [Photo] Name│ [Photo] Name│        │
│  │ Position    │ Position    │        │
│  └─────────────┴─────────────┘        │
└────────────────────────────────────────┘
      │
      ● ←──────── Timeline dot
      │
┌─────┴──────────────────────────────────┐
│  2023-2024 Board Card...               │
└────────────────────────────────────────┘
```

## Next Steps

1. **Update Directus schema** with the new fields
2. **Migrate existing data** to use year fields
3. **Test the timeline view** with real data
4. Consider adding filters (by year range, member name, etc.)
5. Add search functionality if needed

## Questions or Issues?

If you have questions about the implementation or need help with data migration, feel free to ask!
