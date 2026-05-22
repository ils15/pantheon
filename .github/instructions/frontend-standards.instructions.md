---
description: "Frontend development standards for React/TypeScript"
name: "Frontend Development Standards"
applyTo: "**/*.{ts,tsx,js,jsx}"
---

# Frontend Development Standards (Aphrodite)

## TypeScript
- Strict mode always (no `any` types)
- Props interfaces on all components
- Return type annotations on all functions

## Components
- Single Responsibility Principle
- Reusable and composable
- Max 300 lines per component
- Atomic Design pattern

## Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Color contrast WCAG AA
- Semantic HTML

## Responsive Design
- Mobile-first approach
- Breakpoints: 640px, 768px, 1024px, 1280px
- Test on multiple devices

## State Management
- Hooks (useState, useContext, useReducer)
- Centralized state for app-wide data
- Local state for component-specific needs

## Testing
- React Testing Library (no snapshot testing)
- Test behavior not implementation
- >80% coverage requirement
- Test user workflows

## Styling
- Tailwind CSS + custom CSS when needed
- Design tokens for colors/spacing
- Responsive classes
- No inline styles
