# 🚀 Installation Instructions

## ⚠️ IMPORTANT: Install Required Packages

The Redux and Axios setup requires these packages to be installed:

```bash
cd apps/web

# Clean install (if needed)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Install all dependencies
npm install

# Install Redux & Axios
npm install @reduxjs/toolkit react-redux axios
```

## 📦 Required Packages

- `@reduxjs/toolkit` - Redux with best practices
- `react-redux` - React bindings for Redux  
- `axios` - HTTP client

## ✅ After Installation

1. **Verify installation:**
   ```bash
   npm list @reduxjs/toolkit react-redux axios
   ```

2. **Build to check for errors:**
   ```bash
   npm run build
   ```

3. **Start development:**
   ```bash
   npm run dev
   ```

## 🔧 If Installation Fails

### Issue: Missing packages/types

**Solution:**
```bash
# Already fixed in package.json and tsconfig.json
# Just run npm install
npm install
```

### Issue: Lock file conflicts

**Solution:**
```bash
Remove-Item package-lock.json -Force
npm install
```

### Issue: Node modules corrupted

**Solution:**
```bash
Remove-Item -Recurse -Force node_modules
npm install
```

## 📁 Files Ready

All Redux files are created and ready:
- ✅ `lib/axios.ts`
- ✅ `lib/store/index.ts`
- ✅ `lib/store/Provider.tsx`
- ✅ `lib/store/hooks.ts`
- ✅ `lib/store/slices/flowsSlice.ts`
- ✅ `lib/store/slices/nodeTypesSlice.ts`
- ✅ `lib/store/slices/workflowEditorSlice.ts`

## 🎯 Next Steps

After packages are installed:

1. **Add Redux Provider to layout:**
   ```typescript
   // apps/web/app/layout.tsx
   import { ReduxProvider } from '@/lib/store/Provider'
   
   <ReduxProvider>{children}</ReduxProvider>
   ```

2. **Start using Redux in components:**
   ```typescript
   import { useAppDispatch, useAppSelector } from '@/lib/store/hooks'
   import { fetchFlows } from '@/lib/store/slices/flowsSlice'
   
   const dispatch = useAppDispatch()
   const { items: flows } = useAppSelector((state) => state.flows)
   
   useEffect(() => {
     dispatch(fetchFlows())
   }, [])
   ```

3. **Build and test:**
   ```bash
   npm run build
   npm run dev
   ```

## 🚀 Ready!

Once packages are installed, all TypeScript errors will be resolved and you can start using Redux!
