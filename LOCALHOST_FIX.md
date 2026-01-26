# Localhost Performance Fix

## Problem
`http://localhost:3000/` was loading slowly compared to the network IP addresses like `http://192.168.174.1:3000/`

## Root Cause
Windows DNS resolution for `localhost` was checking both IPv4 (127.0.0.1) and IPv6 (::1), causing a delay. Vite's `host: true` setting was allowing both protocols, which created a race condition.

## Solution Applied
Changed Vite configuration to explicitly use IPv4 only:

```typescript
server: {
  host: '0.0.0.0', // Explicitly use IPv4 - prevents IPv6 DNS delays
  port: 3000,
  strictPort: false,
}
```

## How to Apply the Fix

1. **Stop the current dev server** (Press `Ctrl+C` in the terminal running `npm run dev`)

2. **Restart the dev server**:
   ```bash
   npm run dev
   ```

3. **Test localhost**:
   - Visit `http://localhost:3000/`
   - It should now load as fast as `http://192.168.174.1:3000/`

## Expected Result
✅ `localhost:3000` will now resolve instantly via IPv4 (127.0.0.1)  
✅ No more DNS lookup delays  
✅ Same performance as network IP addresses  

## Alternative (If You Prefer)
If you want to use the IP address directly, you can always use:
- `http://127.0.0.1:3000/` (IPv4 localhost - always fast)

This bypasses DNS entirely and goes straight to IPv4.

## Files Modified
- `vite.config.ts` - Changed `host: true` to `host: '0.0.0.0'`
