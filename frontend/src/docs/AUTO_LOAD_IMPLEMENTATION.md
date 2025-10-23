# Auto-Load Graph Implementation

## Overview

The Data Visualization tab now automatically fetches and displays graph data when the user clicks on the Data tab for the first time. The "Plot Graphs" button remains available for manual refresh.

## Implementation Details

### Changes Made

#### 1. App.tsx
- Added `isActive` prop to DataVisualizationTab component
- Passes `activeTab === "data"` to indicate when the tab is active

```typescript
{activeTab === "data" && <DataVisualizationTab isActive={activeTab === "data"} />}
```

#### 2. DataVisualizationTab.tsx

**Added Props Interface**:
```typescript
interface DataVisualizationTabProps {
  isActive: boolean;
}
```

**Added State**:
```typescript
const hasLoadedOnce = useRef(false);
```

**Added useEffect Hook**:
```typescript
// Auto-fetch data when tab becomes active
useEffect(() => {
  if (isActive && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true;
    fetchGraphData();
  }
}, [isActive]);
```

## Behavior

### First Tab Click
1. User clicks on "Data" tab
2. `isActive` prop becomes `true`
3. `useEffect` detects this is the first activation (`hasLoadedOnce.current === false`)
4. Automatically calls `fetchGraphData()`
5. Sets `hasLoadedOnce.current = true` to prevent re-fetching
6. Loading indicator appears
7. Graphs load and display

### Subsequent Tab Clicks
1. User clicks on "Data" tab again
2. `isActive` prop becomes `true`
3. `useEffect` sees `hasLoadedOnce.current === true`
4. Does NOT auto-fetch (graphs remain from previous load)
5. User can manually click "Plot Graphs" to refresh

### Manual Refresh
1. User clicks "Plot Graphs" button
2. `fetchGraphData()` is called directly
3. All graphs reload with fresh data
4. Loading indicator appears during fetch

## Benefits

### User Experience
- **Faster Access**: No need to click a button to see graphs
- **Intuitive**: Graphs appear immediately when navigating to Data tab
- **Flexible**: Manual refresh button available when needed
- **Efficient**: Only fetches once per session (until manual refresh)

### Technical
- **Simple Implementation**: Uses React refs and useEffect
- **No Breaking Changes**: Existing functionality preserved
- **Clean Code**: Minimal changes to existing codebase
- **Performance**: Prevents unnecessary re-fetching

## Use Cases

### When Auto-Load is Useful
- Quickly checking latest DAQ data
- Monitoring experiment in real-time
- Reviewing recent measurements
- Initial data exploration

### When Manual Refresh is Useful
- Updating graphs after new DAQ run
- Checking for data changes
- Refreshing after configuration changes
- Forcing reload on error

## Testing

### Test Cases
1. ✅ First click on Data tab auto-loads graphs
2. ✅ Loading indicator appears during auto-load
3. ✅ Second click on Data tab does NOT auto-load
4. ✅ "Plot Graphs" button still works for manual refresh
5. ✅ Error handling still works correctly
6. ✅ No console errors during auto-load
7. ✅ Graphs display correctly after auto-load

### Manual Testing Steps
1. Start the application
2. Click on "Control" tab (or any other tab)
3. Click on "Data" tab
4. Verify graphs start loading automatically
5. Wait for graphs to finish loading
6. Click on another tab
7. Click back on "Data" tab
8. Verify graphs do NOT reload
9. Click "Plot Graphs" button
10. Verify graphs reload with fresh data

## Edge Cases

### Configuration Changes
- If user changes number of graphs in Settings, existing graphs remain
- Manual refresh required to load new graph configuration

### API Errors
- If auto-load fails, error message displays
- User can click "Plot Graphs" to retry

### Network Issues
- Loading indicator shows during slow networks
- Timeout handled by browser fetch API
- Error graphs display on failure

## Future Enhancements

Potential improvements:
- Auto-refresh on interval (e.g., every 5 seconds for real-time monitoring)
- "Clear Graphs" button to reset to placeholder state
- Remember scroll position when switching tabs
- Selective graph refresh (reload only specific graphs)
- Configuration option to disable auto-load
- Loading skeleton/shimmer instead of placeholders

## Code Example

### Full useEffect Implementation
```typescript
// Auto-fetch data when tab becomes active (first time only)
useEffect(() => {
  if (isActive && !hasLoadedOnce.current) {
    hasLoadedOnce.current = true;
    fetchGraphData();
  }
}, [isActive]);
```

### Why useRef Instead of State?
- `useRef` doesn't trigger re-renders when changed
- Persists across re-renders
- Perfect for tracking one-time events
- More efficient than useState for this use case

## Documentation Updates

Updated files:
- `/docs/GRAPH_PLOTTING_SUMMARY.md` - Added auto-load behavior
- `/CHANGELOG.md` - Documented the feature
- `/README.md` - Updated DataVisualizationTab description
- `/docs/AUTO_LOAD_IMPLEMENTATION.md` - This file

## Related Files

- `/App.tsx` - Passes isActive prop
- `/components/DataVisualizationTab.tsx` - Implements auto-load
- `/docs/GRAPH_API.md` - API documentation
- `/docs/BACKEND_EXAMPLE.md` - Backend implementation examples
