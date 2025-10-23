import { configureStore } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import userSlice from "./userSlice";
import uiSlice from "./uiSlice";
import dataSlice from "./dataSlice";
import geminiSlice from "./geminiSlice";
import { apiTrackingMiddleware, apiLoggingMiddleware, loadingStateMiddleware } from "./middleware/apiTrackingMiddleware";

// Persistence configuration for different slices
const userPersistConfig = {
    key: "user",
    storage,
    whitelist: ["user"] // Only persist user data
};

const dataPersistConfig = {
    key: "data",
    storage,
    whitelist: ["clothingItems", "collections", "weather"], // Persist wardrobe data
    blacklist: ["loading", "errors", "lastFetched"] // Don't persist loading states
};

const uiPersistConfig = {
    key: "ui",
    storage,
    whitelist: ["theme", "sidebarOpen"], // Persist UI preferences
    blacklist: ["loading", "error", "notifications", "modals"] // Don't persist temporary UI state
};

const store = configureStore({
    reducer: {
        user: persistReducer(userPersistConfig, userSlice),
        ui: persistReducer(uiPersistConfig, uiSlice),
        data: persistReducer(dataPersistConfig, dataSlice),
        gemini: geminiSlice, // Don't persist API tracking data
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [
                    "persist/PERSIST", 
                    "persist/REHYDRATE",
                    "gemini/trackAPICall"
                ],
            },
        }).concat([
            apiTrackingMiddleware,
            apiLoggingMiddleware,
            loadingStateMiddleware
        ]),
});

export const persistor = persistStore(store);
export default store;