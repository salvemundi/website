# Theme Utilities Guide

This guide explains how to use the theme utility classes for consistent styling across light and dark modes.

## Setup

Import the theme file in your `globals.css`:

```css
@import "./styles/theme.css";
```

Or in your layout/page:

```tsx
import "@/styles/theme.css";
```

---

## Text Colors

### Adaptive Text (changes with light/dark mode)

| Class              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `text-theme`       | Main text color (purple in light, white in dark) |
| `text-theme-muted` | Muted/secondary text                             |
| `text-theme-light` | Light/subtle text                                |

```tsx
<p className="text-theme">This text adapts to the theme</p>
<p className="text-theme-muted">Secondary information</p>
```

### White Text (always white)

| Class              | Description                 |
| ------------------ | --------------------------- |
| `text-theme-white` | Always white, ignores theme |

```tsx
<div className="bg-theme-purple">
  <h1 className="text-theme-white">Always white text</h1>
</div>
```

### Purple Text Variations

| Class                       | Light Mode              | Dark Mode                |
| --------------------------- | ----------------------- | ------------------------ |
| `text-theme-purple`         | `#663265` (deep purple) | `#d9a3d6` (light purple) |
| `text-theme-purple-light`   | `#a4539b`               | `#e8c4e6`                |
| `text-theme-purple-lighter` | `#d4add0`               | `#f4e2f3`                |
| `text-theme-purple-dark`    | `#471e3b`               | `#b471ad`                |
| `text-theme-purple-darker`  | `#2d1228`               | `#8c4682`                |

```tsx
<h1 className="text-theme-purple">Main purple heading</h1>
<p className="text-theme-purple-light">Light purple text</p>
<span className="text-theme-purple-dark">Dark purple accent</span>
```

---

## Gradient Text

### Basic Gradients

| Class                      | Description                        |
| -------------------------- | ---------------------------------- |
| `text-gradient`            | Default diagonal gradient (135deg) |
| `text-gradient-light`      | Lighter shade gradient             |
| `text-gradient-horizontal` | Left to right gradient             |
| `text-gradient-vertical`   | Top to bottom gradient             |

```tsx
<h1 className="text-gradient text-4xl font-bold">
  Gradient Heading
</h1>

<h2 className="text-gradient-light text-2xl">
  Light Gradient Text
</h2>
```

### Special Gradients

| Class                        | Description                |
| ---------------------------- | -------------------------- |
| `text-gradient-purple-white` | Purple to white gradient   |
| `text-gradient-white-purple` | White to purple gradient   |
| `text-gradient-animated`     | Animated shifting gradient |

```tsx
{
  /* Great for dark backgrounds */
}
<div className="bg-theme-purple-dark p-8">
  <h1 className="text-gradient-purple-white text-5xl font-bold">Hero Title</h1>
</div>;

{
  /* Animated gradient */
}
<h1 className="text-gradient-animated text-6xl font-bold">
  ✨ Animated Text ✨
</h1>;
```

---

## Background Colors

| Class                     | Description               |
| ------------------------- | ------------------------- |
| `bg-theme-purple`         | Main purple background    |
| `bg-theme-purple-light`   | Light purple background   |
| `bg-theme-purple-lighter` | Lighter purple background |
| `bg-theme-purple-dark`    | Dark purple background    |
| `bg-theme-purple-darker`  | Darker purple background  |

### Gradient Backgrounds

| Class                          | Description                  |
| ------------------------------ | ---------------------------- |
| `bg-gradient-theme`            | Diagonal gradient background |
| `bg-gradient-theme-horizontal` | Horizontal gradient          |
| `bg-gradient-theme-vertical`   | Vertical gradient            |

```tsx
<section className="bg-gradient-theme text-theme-white py-16">
  <h1>Hero Section</h1>
</section>
```

---

## Border Colors

| Class                       | Description         |
| --------------------------- | ------------------- |
| `border-theme-purple`       | Purple border       |
| `border-theme-purple-light` | Light purple border |
| `border-theme-purple-dark`  | Dark purple border  |

```tsx
<div className="border-2 border-theme-purple rounded-lg p-4">
  Card with purple border
</div>
```

---

## Hover States

All colors have hover variants:

```tsx
<button className="text-theme-purple hover:text-theme-purple-dark">
  Hover me
</button>

<div className="bg-theme-purple-light hover:bg-theme-purple transition-colors">
  Hover background
</div>
```

---

## Common Patterns

### Hero Section

```tsx
<section className="bg-gradient-theme min-h-screen">
  <h1 className="text-theme-white text-6xl font-bold">Welcome</h1>
  <p className="text-theme-white/80">Subtitle with opacity</p>
</section>
```

### Card with Theme Colors

```tsx
<div className="bg-white dark:bg-gray-800 rounded-xl p-6">
  <h2 className="text-gradient text-2xl font-bold mb-2">Card Title</h2>
  <p className="text-theme-muted">Card description text</p>
  <button className="bg-theme-purple text-theme-white px-4 py-2 rounded-lg hover:bg-theme-purple-dark">
    Action
  </button>
</div>
```

### Text on Colored Backgrounds

```tsx
{
  /* On dark backgrounds - use white */
}
<div className="bg-theme-purple-dark">
  <h1 className="text-theme-white">White text on dark</h1>
</div>;

{
  /* On light backgrounds - use purple */
}
<div className="bg-theme-purple-lighter">
  <h1 className="text-theme-purple-dark">Dark purple on light</h1>
</div>;
```

### Gradient Badge

```tsx
<span className="bg-gradient-theme text-theme-white px-3 py-1 rounded-full text-sm">
  New
</span>
```

---

## CSS Variables Reference

You can also use these variables directly in custom CSS:

```css
.my-custom-class {
  color: var(--theme-purple);
  background: linear-gradient(
    135deg,
    var(--theme-gradient-start),
    var(--theme-gradient-end)
  );
}
```

### Available Variables

| Variable                 | Light Mode | Dark Mode |
| ------------------------ | ---------- | --------- |
| `--theme-purple`         | `#663265`  | `#d9a3d6` |
| `--theme-purple-light`   | `#a4539b`  | `#e8c4e6` |
| `--theme-purple-lighter` | `#d4add0`  | `#f4e2f3` |
| `--theme-purple-dark`    | `#471e3b`  | `#b471ad` |
| `--theme-purple-darker`  | `#2d1228`  | `#8c4682` |
| `--theme-white`          | `#ffffff`  | `#ffffff` |
| `--theme-text`           | `#663265`  | `#ffffff` |
| `--theme-text-muted`     | `#6f5772`  | `#c9b2cc` |
| `--theme-gradient-start` | `#663265`  | `#d9a3d6` |
| `--theme-gradient-end`   | `#a4539b`  | `#e8c4e6` |

---

## Tips

1. **Always test both modes**: Toggle between light and dark mode to ensure readability.

2. **Use semantic classes**: Prefer `text-theme` over `text-white` for adaptive text.

3. **Contrast matters**: On dark backgrounds, use `text-theme-white`. On light backgrounds, use `text-theme-purple` variants.

4. **Gradients look best on headings**: Large text with `text-gradient` creates visual impact.

5. **Combine with Tailwind**: These utilities work alongside standard Tailwind classes.

```tsx
<h1 className="text-gradient text-4xl md:text-6xl font-bold tracking-tight">
  Responsive Gradient Heading
</h1>
```
