/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit'
import flowsReducer from './slices/flowsSlice'
import nodeTypesReducer from './slices/nodeTypesSlice'
import workflowEditorReducer from './slices/workflowEditorSlice'

export const store = configureStore({
  reducer: {
    flows: flowsReducer,
    nodeTypes: nodeTypesReducer,
    workflowEditor: workflowEditorReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['workflowEditor/setNodes', 'workflowEditor/setEdges'],
        ignoredActionPaths: ['payload.icon'],
        ignoredPaths: ['nodeTypes.items', 'workflowEditor.nodes'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
