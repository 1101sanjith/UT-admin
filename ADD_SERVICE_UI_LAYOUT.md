# Add Service Form - UI Comparison

## New UI Layout (Matching Your Sketch)

```
┌────────────────────────────────────────────────────┐
│ Add New Service                                [X] │
├────────────────────────────────────────────────────┤
│                                                    │
│ Service name:                                      │
│ __________________________________________________ │
│                                                    │
│ Service icon:                                      │
│ __________________________________________________ │
│                                                    │
│ Background color:                                  │
│ [🎨]  #4CAF50________________________________     │
│                                                    │
│ Price:                                             │
│ __________________________________________________ │
│                                                    │
│ What We do:                                        │
│ ✓ ______________________________ [Add] [Remove]   │
│ ✓ ______________________________ [Add] [Remove]   │
│                                                    │
│ What We don't do:                                  │
│ ✗ ______________________________ [Add] [Remove]   │
│ ✗ ______________________________ [Add] [Remove]   │
│                                                    │
│ How it's Work:                                     │
│ 1. ______________________________ [Add] [Remove]  │
│ 2. ______________________________ [Add] [Remove]  │
│                                                    │
│             [  Create  ]  [  Cancel  ]             │
│                                                    │
└────────────────────────────────────────────────────┘
```

## Key Features

### 1. Service Name

- Simple text input
- Bottom border only (no box)
- Placeholder: "Enter service name"

### 2. Service Icon

- Text input for emoji
- Supports up to 4 characters (for multi-character emojis)
- Placeholder: "Enter emoji icon (e.g., 🧹)"

### 3. Background Color

- Color picker (visual selector)
- Text input showing hex code
- Default: #4CAF50
- Both inputs sync automatically

### 4. Price

- Number input
- Minimum value: 0
- Bottom border style
- Placeholder: "Enter price"

### 5. What We Do (Dynamic List)

- Each row has:
  - Green checkmark (✓) icon
  - Text input
  - Add button (adds new row)
  - Remove button (removes current row)
- Multiple items supported

### 6. What We Don't Do (Dynamic List)

- Each row has:
  - Red X (✗) icon
  - Text input
  - Add button
  - Remove button
- Multiple items supported

### 7. How It's Work (Dynamic List)

- Each row has:
  - Auto-numbered (1, 2, 3...)
  - Text input
  - Add button
  - Remove button
- Numbers update automatically when items are removed

### 8. Action Buttons

- **Create**: Saves the new service
- **Cancel**: Closes modal without saving

## Styling Details

- **Inputs**: Bottom border only (2px solid #d1d5db), no box outline
- **Focus state**: Blue border (#3b82f6) on bottom
- **Spacing**: 20px between sections
- **Font**: System font, medium weight for labels
- **Icons**: Emoji-based (no images)
- **Buttons**:
  - Primary (Create): Blue background
  - Secondary (Cancel): White with border
  - Add/Remove: Small outline buttons

## Behavior

1. **Adding items**: Click "Add" button to add a new row
2. **Removing items**: Click "Remove" button to delete that row
3. **Validation**: Form validates before submission:
   - Name is required
   - Icon is required
   - Price must be > 0
   - Empty items are filtered out before saving
4. **Auto-save**: Data saved to Supabase in JSON format

## Data Flow

```
User Input → Form State → Validation → Clean Data → Supabase
```

Clean Data removes:

- Empty strings from arrays
- Trims whitespace
- Converts price to number
