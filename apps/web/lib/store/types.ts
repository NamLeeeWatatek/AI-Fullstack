/**
 * Redux Types
 * Temporary types until packages are installed
 */

// Placeholder types for Redux Toolkit (will be replaced when @reduxjs/toolkit is installed)
export type PayloadAction<T = any> = {
  payload: T
  type: string
}

export type AsyncThunk<Returned, ThunkArg = void> = any

export interface SliceOptions<State, Reducers> {
  name: string
  initialState: State
  reducers: Reducers
  extraReducers?: (builder: any) => void
}

// Re-export when packages are installed
// export { PayloadAction, createSlice, createAsyncThunk } from '@reduxjs/toolkit'
