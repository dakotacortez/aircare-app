# Quick Reference Card System

## Overview

The Quick Reference Card system is a mobile-first feature that allows field crews to save medical calculation results and clinical notes locally for 24-hour access. It's designed specifically for tablet and mobile devices used during patient care.

## Key Features

- **Mobile/Tablet Only**: System is disabled on desktop devices (screens >1024px)
- **Offline Support**: All data stored in localStorage for offline access
- **24-Hour Auto-Expiration**: Cards automatically expire after 24 hours
- **Save Calculations**: Store calculator results for quick reference
- **Add Notes**: Create time-stamped clinical notes
- **Export Options**: Copy, print, email, or SMS reference cards
- **Zero Server Dependencies**: Completely client-side implementation

## Architecture

### Core Components

1. **Hooks**
   - `useDeviceType`: Detects mobile/tablet devices
   - `useReferenceCard`: Main state management and localStorage persistence

2. **UI Components**
   - `ReferenceCardDrawer`: Main drawer with FAB (Floating Action Button)
   - `ReferenceCardItem`: Individual card display
   - `CardEntryItem`: Individual entry (calculation or note) display
   - `AddNoteModal`: Modal for adding notes
   - `SaveCalculationModal`: Modal for saving calculations

3. **Calculator Components**
   - `VentilatorCalculator`: Sample ventilator settings calculator
   - `PediatricDrugCalculator`: Sample pediatric drug dose calculator

### Data Structure

```typescript
interface ReferenceCard {
  id: string                  // UUID
  name: string                // User-provided or "Card - 14:30"
  createdAt: number           // Timestamp
  expiresAt: number           // createdAt + 24 hours
  entries: CardEntry[]
}

interface CardEntry {
  id: string                  // UUID
  type: 'calculation' | 'note'
  timestamp: number           // When entry was created
  
  // For calculations
  calculatorName?: string
  inputs?: Record<string, any>
  outputs?: Record<string, any>
  
  // For notes
  timeAction?: string
  noteText?: string
}
```

## Usage

### For Users

1. **Access Reference Cards**
   - Tap the filing cabinet icon in the navbar (mobile/tablet only)
   - Or use the FAB (floating blue button) in bottom-left

2. **Save a Calculator Result**
   - Use any calculator (e.g., `/calculators`)
   - Click "Calculate"
   - Click "Save to Reference Card"
   - Choose existing card or create new
   - Results saved instantly

3. **Add a Note**
   - Open reference card drawer
   - Click the green "+" button
   - Optionally add time/action (e.g., "14:30 - Gave bolus")
   - Enter note text
   - Choose existing card or create new

4. **Export Cards**
   - Open drawer
   - Click download icon
   - Choose: Copy, Print, Email, or SMS

5. **Delete Items**
   - Click X on individual entries to remove
   - Click trash icon on card to delete entire card
   - Click "Clear All" to remove all cards

### For Developers

#### Adding a New Calculator

```tsx
import { useReferenceCard } from '@/hooks/useReferenceCard'
import { SaveCalculationModal } from '@/components/ReferenceCard'
import type { CalculationData } from '@/types/referenceCard'

export const MyCalculator = () => {
  const [results, setResults] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [calculationToSave, setCalculationToSave] = useState<CalculationData | null>(null)
  const { isMobile } = useReferenceCard()

  const calculate = () => {
    // Your calculation logic
    setResults({ /* ... */ })
  }

  const handleSave = () => {
    if (!results) return
    
    const calculation: CalculationData = {
      calculatorName: 'My Calculator',
      inputs: { weight: '70kg' },
      outputs: results,
    }
    
    setCalculationToSave(calculation)
    setShowSaveModal(true)
  }

  return (
    <div>
      {/* Calculator UI */}
      
      {results && isMobile && (
        <button onClick={handleSave}>
          Save to Reference Card
        </button>
      )}
      
      {showSaveModal && calculationToSave && (
        <SaveCalculationModal
          calculation={calculationToSave}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
```

#### Device Detection

The system automatically detects mobile/tablet devices:

```tsx
const { isMobile } = useReferenceCard()

if (isMobile) {
  // Show save to card button
} else {
  // Show desktop message
}
```

## Technical Details

### localStorage Key

All data is stored under: `acmc-reference-cards`

### Expiration Logic

- Cards expire 24 hours after creation
- Expired cards are automatically removed on load
- No background cleanup (only on page load/refresh)

### Browser Support

- Requires localStorage (all modern browsers)
- Requires Clipboard API for copy functionality (may require HTTPS)
- SMS links may not work on desktop

### Performance

- localStorage operations are synchronous
- Fast for typical usage (10-50 cards)
- Consider IndexedDB if usage exceeds 100+ cards

### Security & Privacy

- **No PHI stored**: Only calculation results, no patient names
- **Device-local only**: Data never transmitted to server
- **Auto-expiration**: Prevents long-term data accumulation
- **User control**: Can manually clear all data

## File Structure

```
src/
├── types/
│   └── referenceCard.ts           # TypeScript interfaces
├── hooks/
│   ├── useDeviceType.ts           # Device detection hook
│   └── useReferenceCard.ts        # Main state management hook
├── components/
│   ├── ReferenceCard/
│   │   ├── ReferenceCardDrawer.tsx
│   │   ├── ReferenceCardItem.tsx
│   │   ├── CardEntryItem.tsx
│   │   ├── AddNoteModal.tsx
│   │   ├── SaveCalculationModal.tsx
│   │   └── index.tsx
│   └── Calculators/
│       ├── VentilatorCalculator.tsx
│       ├── PediatricDrugCalculator.tsx
│       └── index.tsx
└── app/(frontend)/
    ├── layout.tsx                 # ReferenceCardDrawer added here
    ├── calculators/
    │   └── page.tsx               # Calculator demo page
    └── globals.css                # Animations and responsive styles
```

## Integration Points

1. **Layout** (`src/app/(frontend)/layout.tsx`)
   - `<ReferenceCardDrawer />` added to provide global access

2. **Header** (`src/Header/Component.client.tsx`)
   - Filing cabinet icon with badge count
   - Only visible on mobile/tablet

3. **Calculators** (`src/components/Calculators/`)
   - Sample implementations showing integration
   - Located at `/calculators` route

## Testing

### Manual Testing Checklist

- [ ] Filing cabinet icon appears on mobile/tablet only
- [ ] Filing cabinet icon hidden on desktop
- [ ] Badge shows correct count
- [ ] FAB appears when cards exist
- [ ] FAB hidden when no cards
- [ ] Add note modal works
- [ ] Save calculation modal works
- [ ] Entries display correctly
- [ ] Copy to clipboard works
- [ ] Delete confirmation works (3-second timeout)
- [ ] Cards persist after page refresh
- [ ] Cards expire after 24 hours
- [ ] Export options work (copy, print, email, SMS)
- [ ] Clear all works with confirmation

### localStorage Testing

```javascript
// Check stored data
console.log(localStorage.getItem('acmc-reference-cards'))

// Manually set expiration to test cleanup
const cards = JSON.parse(localStorage.getItem('acmc-reference-cards'))
cards[0].expiresAt = Date.now() - 1000 // Expired 1 second ago
localStorage.setItem('acmc-reference-cards', JSON.stringify(cards))
// Refresh page - card should be gone
```

## Future Enhancements

Potential improvements (not currently implemented):

1. **Service Line Filtering**: Show only relevant calculators based on BLS/ALS/CCT
2. **Multi-Category Outputs**: Group calculation results by type (meds, equipment, etc.)
3. **Sync Across Devices**: Optional cloud backup (requires backend)
4. **Extended Storage**: Move to IndexedDB for larger datasets
5. **Print Optimization**: Custom print stylesheet for better formatting
6. **Offline Indicators**: Show when running in offline mode
7. **Card Templates**: Pre-configured cards for common scenarios

## Troubleshooting

### Cards Not Persisting

- Check localStorage quota (5-10MB typical)
- Check browser's localStorage is enabled
- Check for QuotaExceededError in console

### FAB Not Appearing

- Check device detection: `useDeviceType()` should return `true`
- Check screen width < 1024px
- Check touch capability detected

### Save Button Not Showing

- Check `isMobile` from `useReferenceCard()`
- Check calculator component is using the hook correctly

### Export Not Working

- **Copy**: Requires Clipboard API (HTTPS)
- **SMS**: May not work on desktop browsers
- **Email**: Opens default email client
- **Print**: Opens print dialog

## Support

For issues or questions:
- Check browser console for errors
- Verify device meets requirements (touch + <1024px)
- Test with sample calculators at `/calculators`
