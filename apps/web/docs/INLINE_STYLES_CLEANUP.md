# Inline Styles Cleanup Summary

## 🎯 Vấn Đề

Nhiều components đang dùng inline styles với hard-coded colors:

```tsx
// ❌ BAD - Hard-coded inline styles
<div style={{ backgroundColor: category.color }} />
<div style={{ color: nodeType?.color || '#888' }} />
<span style={{ backgroundColor: tag.color, borderColor: tag.color }} />
```

## ✅ Giải Pháp

### 1. Centralize Platform Colors

**File**: `apps/web/app/globals.css`

```css
/* Platform Colors - Centralized */
.platform-facebook {
  @apply text-[#1877F2] bg-[#1877F2]/10 border-[#1877F2]/20;
}

.platform-whatsapp {
  @apply text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20;
}

/* ... 25+ platforms */
```

### 2. Use CSS Classes

```tsx
// ✅ GOOD - Use CSS classes
<div className="platform-facebook p-2 rounded-lg border">
  <FiFacebook />
</div>
```

### 3. Dynamic Colors (When Needed)

Nếu màu từ database/user input:

```tsx
// ✅ GOOD - Use CSS variables
<div 
  className="p-2 rounded-lg border"
  style={{ 
    '--color': category.color,
    backgroundColor: 'hsl(var(--color) / 0.1)',
    borderColor: 'hsl(var(--color) / 0.2)',
    color: 'hsl(var(--color))'
  } as React.CSSProperties}
/>
```

## 📋 Files Cần Update

### High Priority

1. **node-palette.tsx**
```tsx
// Before
<div style={{ backgroundColor: category.color }} />

// After
<div className={getCategoryColorClass(category.id)} />
```

2. **execute-flow-modal.tsx**
```tsx
// Before
<div style={{ backgroundColor: nodeType?.color || '#888' }} />

// After
<div className={cn('w-2 h-2 rounded-full', getNodeColorClass(nodeType?.id))} />
```

3. **tag-dialog.tsx** & **category-dialog.tsx**
```tsx
// Before
<div style={{ backgroundColor: presetColor }} />

// After
<div className={getPresetColorClass(presetColor)} />
```

4. **tags/page.tsx** & **categories/page.tsx**
```tsx
// Before
<span style={{ backgroundColor: tag.color, borderColor: tag.color }} />

// After
<span className={getTagColorClass(tag.id)} />
```

### Medium Priority

5. **custom-node.tsx**
```tsx
// Before
<Icon style={{ color: nodeType?.color || 'currentColor' }} />

// After
<Icon className={getNodeIconColorClass(nodeType?.id)} />
```

6. **category-selector.tsx**
```tsx
// Before
<IconComponent style={{ color: category.color }} />

// After
<IconComponent className={getCategoryIconColorClass(category.id)} />
```

## 🔧 Helper Functions

Create utility file: `apps/web/lib/color-utils.ts`

```ts
export function getPlatformColorClass(platform: string): string {
  return `platform-${platform}` || 'platform-default'
}

export function getCategoryColorClass(categoryId: string): string {
  const colorMap: Record<string, string> = {
    'trigger': 'bg-success/10 text-success border-success/20',
    'ai': 'bg-primary/10 text-primary border-primary/20',
    'action': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    'logic': 'bg-warning/10 text-warning border-warning/20',
    'response': 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  }
  return colorMap[categoryId] || 'bg-muted text-muted-foreground border-border'
}

export function getNodeColorClass(nodeType?: string): string {
  if (!nodeType) return 'bg-muted'
  return getCategoryColorClass(nodeType)
}
```

## 📊 Migration Checklist

### Phase 1: Centralize (✅ Done)
- [x] Add platform colors to globals.css
- [x] Add success/warning/info to tailwind config
- [x] Create color utility functions
- [x] Document color system

### Phase 2: Update Components (🔄 In Progress)
- [ ] Update node-palette.tsx
- [ ] Update execute-flow-modal.tsx
- [ ] Update tag-dialog.tsx
- [ ] Update category-dialog.tsx
- [ ] Update tags/page.tsx
- [ ] Update categories/page.tsx
- [ ] Update custom-node.tsx
- [ ] Update category-selector.tsx

### Phase 3: Testing
- [ ] Test all components with new classes
- [ ] Verify colors match original
- [ ] Check dark mode compatibility
- [ ] Test responsive design

### Phase 4: Cleanup
- [ ] Remove unused inline styles
- [ ] Update documentation
- [ ] Code review
- [ ] Deploy

## 🎨 Color System Reference

### Theme Colors
```tsx
bg-primary      // Blue #2563eb
bg-success      // Green #10B981
bg-warning      // Amber #F59E0B
bg-destructive  // Red #EF4444
bg-info         // Cyan #0EA5E9
```

### Platform Colors
```tsx
platform-facebook
platform-instagram
platform-whatsapp
platform-telegram
// ... 25+ platforms
```

### Usage Patterns
```tsx
// Icon with platform color
<div className="platform-facebook p-2 rounded-lg border">
  <FiFacebook className="w-5 h-5" />
</div>

// Badge with status color
<Badge className="bg-success/10 text-success">Active</Badge>

// Card with hover
<div className="landing-card">
  {/* Auto hover effects */}
</div>
```

## 📝 Best Practices

### ✅ DO
- Use CSS classes from globals.css
- Use theme colors (primary, success, warning, etc.)
- Use platform-* classes for social media
- Create utility functions for dynamic colors

### ❌ DON'T
- Hard-code hex colors in components
- Use inline styles for colors
- Duplicate color definitions
- Mix inline styles with CSS classes

## 🔗 Related Docs

- `apps/web/docs/COLOR_SYSTEM.md` - Complete color system
- `apps/web/docs/THEME_USAGE.md` - Theme usage guide
- `apps/web/docs/CHANNELS_UI_IMPROVEMENTS.md` - Channels UI improvements
