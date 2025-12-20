# Filter Functionality UI Guide

## Desktop Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Recipe Manager                            ⚙️  👤 Sign Out          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌────────────────────┐ ┌───────────┐ ┌─────────────────┐          │
│  │ 🔍 Search recipes  │ │ 🔽 Filter │ │  Add Recipe      │          │
│  └────────────────────┘ │    (2)    │ └─────────────────┘          │
│                         └───────────┘                                │
│                              │                                       │
│                              ▼                                       │
│                    ┌──────────────────────┐                         │
│                    │  Filter Recipes    ✕ │                         │
│                    ├──────────────────────┤                         │
│                    │ Category             │                         │
│                    │ ☑ Breakfast          │                         │
│                    │ ☐ Lunch              │                         │
│                    │ ☑ Dinner             │                         │
│                    │ ☐ Dessert            │                         │
│                    │                      │                         │
│                    │ Type                 │                         │
│                    │ ☑ Manual             │                         │
│                    │ ☐ Link               │                         │
│                    │ ☐ Document           │                         │
│                    │                      │                         │
│                    │ [Clear All] [Apply]  │                         │
│                    └──────────────────────┘                         │
│                                                                       │
│  Active filters: [Breakfast ×] [Dinner ×] [Manual ×] Clear all      │
│                                                                       │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐      │
│  │   Recipe   │ │   Recipe   │ │   Recipe   │ │   Recipe   │      │
│  │    Card    │ │    Card    │ │    Card    │ │    Card    │      │
│  └────────────┘ └────────────┘ └────────────┘ └────────────┘      │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

## Mobile Layout (< 640px)

```
┌─────────────────────────────────┐
│ Recipe Manager     ⚙️ 👤        │
├─────────────────────────────────┤
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔍 Search recipes           │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌──────────────┐ ┌────────────┐ │
│ │ 🔽 Filter(2) │ │ Add Recipe │ │
│ └──────────────┘ └────────────┘ │
│                                 │
│ Active filters:                 │
│ [Dinner ×] [Manual ×]          │
│ Clear all                       │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         Recipe Card         │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │         Recipe Card         │ │
│ └─────────────────────────────┘ │
│                                 │
└─────────────────────────────────┘
```

## Component States

### Filter Button States

**Default (No Active Filters)**
```
┌───────────┐
│ 🔽 Filter │
└───────────┘
```

**With Active Filters**
```
┌───────────┐
│🔽Filter(2)│
└───────────┘
```
- Blue badge shows count of active filters
- Badge has white text on blue background

### Filter Panel States

**Open - No Selections**
```
┌──────────────────────┐
│ Filter Recipes     ✕ │
├──────────────────────┤
│ Category             │
│ ☐ Breakfast          │
│ ☐ Lunch              │
│ ☐ Dinner             │
│                      │
│ Type                 │
│ ☐ Manual             │
│ ☐ Link               │
│ ☐ Document           │
│                      │
│ [Clear All] [Apply]  │
└──────────────────────┘
```
- Clear All button is disabled (grayed out)

**Open - With Selections**
```
┌──────────────────────┐
│ Filter Recipes     ✕ │
├──────────────────────┤
│ Category             │
│ ☑ Breakfast          │
│ ☐ Lunch              │
│ ☑ Dinner             │
│                      │
│ Type                 │
│ ☑ Manual             │
│ ☐ Link               │
│ ☐ Document           │
│                      │
│ [Clear All] [Apply]  │
└──────────────────────┘
```
- Clear All button is enabled
- Checked items highlighted

### Filter Chips Display

**Multiple Active Filters**
```
Active filters: [🔵 Breakfast ×] [🔵 Dinner ×] [🟢 Manual ×] Clear all
```
- Blue chips for categories (with category color dot)
- Green chips for types
- Each chip has × button to remove
- "Clear all" text button at the end

**Single Active Filter**
```
Active filters: [🔵 Dinner ×] Clear all
```

**No Active Filters**
```
(Filter chips section is hidden)
```

## Interaction Flow

### Opening Filter Panel
1. User clicks "Filter" button
2. Panel animates downward from button
3. Panel appears with shadow overlay effect
4. Current filter selections are pre-checked
5. Focus moves to panel (accessibility)

### Selecting Filters
1. User clicks checkbox next to category/type
2. Checkbox toggles immediately
3. Checkmark appears/disappears
4. Background highlights on hover

### Applying Filters
1. User clicks "Apply" button
2. Panel closes with animation
3. Filter chips appear below search bar
4. Badge count updates on filter button
5. Recipe list updates immediately
6. Loading indicator shows during fetch (if needed)

### Removing Individual Filter
1. User clicks × on filter chip
2. Chip disappears with animation
3. Badge count decreases
4. Recipe list updates immediately
5. If no filters remain, chip section hides

### Clearing All Filters
1. User clicks "Clear all" (in panel or chips)
2. All chips disappear
3. Badge disappears from filter button
4. Recipe list shows all recipes
5. Panel checkboxes all unchecked

### Click Outside to Close
1. User clicks anywhere outside panel
2. Panel closes with animation
3. Changes are NOT applied (must click Apply)
4. Selections revert to last applied state

## Accessibility Features

### Keyboard Navigation
- Tab through checkboxes in order
- Space to toggle checkbox
- Tab to buttons (Clear All, Apply, Close)
- Enter/Space to activate buttons
- Escape to close panel

### Screen Reader Support
- Filter button announces "Filter, 2 active filters"
- Each checkbox has proper label
- Close button has aria-label
- Chip remove buttons have descriptive labels
- Count badge is announced

### Visual Indicators
- Focus rings on interactive elements
- High contrast between text and background
- Color-blind friendly (not relying on color alone)
- Clear hover states

## Color Scheme

### Filter Button
- Background: White (#FFFFFF)
- Border: Gray-300 (#D1D5DB)
- Text: Gray-700 (#374151)
- Hover: Gray-50 (#F9FAFB)
- Badge: Blue-600 (#2563EB) with white text

### Filter Panel
- Background: White (#FFFFFF)
- Border: Gray-200 (#E5E7EB)
- Shadow: Large shadow with blur
- Heading: Gray-900 (#111827)
- Labels: Gray-700 (#374151)

### Filter Chips
- Category chips: Blue-100 background (#DBEAFE), Blue-800 text (#1E40AF)
- Type chips: Green-100 background (#D1FAE5), Green-800 text (#166534)
- Remove button hover: Darker shade of respective color

### Buttons
- Apply button: Blue-600 (#2563EB) with white text
  - Hover: Blue-700 (#1D4ED8)
- Clear All button: Gray-100 (#F3F4F6) with Gray-700 text
  - Hover: Gray-200 (#E5E7EB)
  - Disabled: Opacity 50%, cursor not-allowed

## Animation Details

### Panel Open/Close
- Duration: 200ms
- Easing: ease-out
- Transform: translateY(0) from translateY(-10px)
- Opacity: 1 from 0

### Chip Add/Remove
- Duration: 150ms
- Easing: ease-in-out
- Transform: scale(1) from scale(0.8)
- Opacity: 1 from 0

### Hover Effects
- Duration: 150ms
- Easing: ease-in-out
- Background color transition
- Box shadow change (for panel close)

## Responsive Breakpoints

### Desktop (≥ 640px)
- Search bar and buttons in single row
- Filter panel width: 320px (20rem)
- Panel positioned below filter button

### Mobile (< 640px)
- Search bar full width on first row
- Buttons on second row, equal width
- Filter panel max-width: calc(100vw - 2rem)
- Panel positioned at screen right edge
- Chips wrap to multiple lines if needed

## Empty States

### No Categories Available
```
┌──────────────────────┐
│ Category             │
│ No categories        │
│ available            │
└──────────────────────┘
```

### No Recipes Match Filters
```
┌─────────────────────────────────┐
│ No recipes found                │
│ Try adjusting your filters      │
└─────────────────────────────────┘
```
- Shows in recipe list area
- Friendly message
- Suggestion to clear filters

## Loading States

### Loading Categories
```
┌──────────────────────┐
│ Category             │
│ Loading categories...│
└──────────────────────┘
```

### Loading Recipes (with filters applied)
```
┌─────────────────────────────────┐
│         Loading...              │
│    (spinner animation)          │
└─────────────────────────────────┘
```
- Shows in recipe list area
- Animated spinner
- Brief display (fast client-side filtering)
