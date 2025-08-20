import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import chatReducer from './slices/chatSlice'
import integrationsReducer from './slices/integrationsSlice'
import knowledgeBaseReducer from './slices/knowledgeBaseSlice'
import settingsReducer from './slices/settingsSlice'
import analyticsReducer from './slices/analyticsSlice'
import logsReducer from './slices/logsSlice'
import userReducer from './slices/userSlice'
import botReducer from './slices/botSlice'
import vectorStoreReducer from './slices/vectorStoreSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    integrations: integrationsReducer,
    knowledgeBase: knowledgeBaseReducer,
    settings: settingsReducer,
    analytics: analyticsReducer,
    logs: logsReducer,
    users: userReducer,
    bots: botReducer,
    vectorStore: vectorStoreReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
