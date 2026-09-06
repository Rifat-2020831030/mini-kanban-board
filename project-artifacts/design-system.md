# Design System: High-Contrast Dark Mode (Developer Focused)

This document defines the design tokens and component guidelines for the "High-Contrast Dark Mode" aesthetic, heavily inspired by modern developer tools like Linear.

## 1. Color Palette

We use a heavily desaturated, dark slate palette (Zinc) paired with vibrant primary accents.

### Backgrounds & Surfaces
| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| **App Background** | `#09090b` | `bg-zinc-950` | The main canvas/board background. Pitch black feel. |
| **Surface Primary** | `#18181b` | `bg-zinc-900` | Task cards, modals, dropdowns, and sidebars. |
| **Surface Hover** | `#27272a` | `bg-zinc-800` | Hover states for task cards and menu items. |
| **Surface Accent** | `#3f3f46` | `bg-zinc-700` | Pressed states, active tabs. |

### Borders
| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| **Border Subtle** | `#27272a` | `border-zinc-800` | Standard 1px crisp borders for cards, inputs, and dividers. |
| **Border Hover** | `#3f3f46` | `border-zinc-700` | Border state when hovering over interactive elements. |

### Typography Colors
| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| **Text Primary** | `#f4f4f5` | `text-zinc-50` | Headings, task titles, primary text. |
| **Text Secondary** | `#a1a1aa` | `text-zinc-400` | Descriptions, metadata, empty states. |
| **Text Muted** | `#71717a` | `text-zinc-500` | Placeholder text, disabled states. |

### Semantic Accents (Vibrant)
| Token | Hex Value | Tailwind Class | Usage |
|---|---|---|---|
| **Primary (Neutral)** | `#fafafa` | `text-zinc-50` / `bg-zinc-50` | Primary buttons, active tabs, focused input rings. |
| **Success (Green)** | `#10b981` | `text-emerald-500` | Completed sub-tasks, "Done" state indicators. |
| **Warning (Amber)** | `#f59e0b` | `text-amber-500` | Medium priority, warning alerts. |
| **Danger (Red)** | `#ef4444` | `text-red-500` | High priority, destructive actions (delete task). |

---

## 2. Typography

We use modern, clean geometric fonts to achieve a highly technical and professional feel.

* **Primary Font**: `Inter` (or `Geist Sans`). Clean, legible at small sizes.
* **Monospace Font**: `JetBrains Mono` (or `Geist Mono`). Used for Task IDs (e.g., `KAN-104`) and code snippets.
* **Base Size**: `14px` (`text-sm`). The UI is dense and information-heavy, avoiding oversized text.
* **Weights**:
  * `Regular (400)` for all body text.
  * `Medium (500)` for task titles, buttons, and column headers.
  * `SemiBold (600)` for modal titles.

---

## 3. UI Elements & Styling Rules

### Border Radius
Keep it sharp.
* **Global Radius**: `6px` (`rounded-md`). Used for buttons, inputs, task cards, and labels.
* **Inner Elements**: `4px` (`rounded-sm`). Used for tiny tags or inner checkboxes.

### Shadows (Elevation)
Because the background is pitch black, traditional drop shadows don't work well. We rely on **crisp borders** for separation.
* **Cards**: No shadow. Rely entirely on the 1px `border-zinc-800`.
* **Modals/Drawers**: Deep, heavy shadow (`shadow-2xl`) combined with a 1px border to separate it from the dimmed background overlay.

### Buttons
1. **Primary**: Solid white background (`bg-zinc-50`), black text (`text-zinc-950`), hover (`bg-zinc-200`).
2. **Secondary/Ghost**: Transparent background, text secondary (`text-zinc-400`), hover background (`bg-zinc-800`), hover text white.
3. **Outline**: Transparent background, `border-zinc-700`, text primary, hover background (`bg-zinc-800`).

### Task Cards
* **Default State**: `bg-zinc-900 border-zinc-800`
* **Hover State**: `bg-zinc-800 border-zinc-700 cursor-grab`
* **Active/Dragging State**: `border-zinc-400 shadow-xl opacity-90 cursor-grabbing`

### Labels & Tags
* **Style**: Highly desaturated background with vibrant text.
* **Example (Bug Label)**: `bg-red-500/10 text-red-400 border border-red-500/20`.

---

## 4. Implementation Notes (Tailwind)

This entire design system can be achieved rapidly using **shadcn/ui** by generating a custom theme that maps `--background` to `zinc-950` and `--primary` to `zinc-50`. 
We will override standard shadcn border radiuses to `0.375rem` (6px) to match the sharp aesthetic.
