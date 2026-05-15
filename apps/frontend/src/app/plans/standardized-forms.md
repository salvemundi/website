# Plan: Standardized Form Components

Standardize form titles, containers, and typography across the application to ensure visual consistency between registration, membership, and contact forms.

## 1. Shared UI Component
Create a `StandardFormCard` component that encapsulates the common layout and typography for all public-facing forms.

- **Path**: `apps/frontend/src/components/ui/forms/StandardFormCard.tsx`
- **Props**:
  - `title`: string (Main heading)
  - `subtitle`: string (Small uppercase label above/below title)
  - `description`: string (Optional helper text)
  - `icon`: ReactNode (Optional icon next to title)
  - `price`: number (Optional price display in header)
  - `headerActions`: ReactNode (Optional buttons/actions in header)
  - `children`: ReactNode (The actual form content)
  - `className`: string (Optional container overrides)

## 2. Global CSS Utilities
Update `apps/frontend/src/app/styles/components.css` with a standardized `.form-title` class.

```css
.form-title {
    font-size: var(--font-size-3xl); /* Fluid 1.5rem to 2.25rem */
    font-weight: 900;
    color: var(--color-purple-700);
    letter-spacing: -0.025em;
    line-height: 1.2;
}

.dark .form-title {
    color: var(--color-purple-300);
}
```

## 3. Implementation Steps

### Step 3.1: Create StandardFormCard
Implement the component using the new fluid design tokens (`--font-size-*`, `--spacing-fluid-*`).

### Step 3.2: Migrate Membership Form
Refactor `/lidmaatschap/page.tsx`. Currently uses a custom `h1` and `section` wrapper.

### Step 3.3: Migrate Reis Form
Refactor `ReisFormIsland.tsx`. Currently uses `h1` and a `section` with custom blur effects.

### Step 3.4: Migrate Kroegentocht Form
Refactor `KroegentochtFormIsland.tsx`. Currently uses `h2` and a `Ticket` icon.

### Step 3.5: Migrate Activity Signup Form
Refactor `SignupFormContent.tsx`. Currently uses `h3` and a `Users` icon, plus a price display.

## 4. Verification
Check all migrated forms on mobile and desktop to ensure:
- Titles have identical size, color, and weight.
- Spacing (padding/gap) is consistent.
- Dark mode behavior is uniform.
