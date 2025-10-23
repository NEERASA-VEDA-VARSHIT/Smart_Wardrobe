import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
    name: "user",
    initialState: {
        user: null,
        isRehydrated: false,
    },
    reducers: {
        setUser: (state, action) => {
            console.log("Setting user in Redux:", action.payload);
            state.user = action.payload;
        },
        clearUser: (state) => {
            state.user = null;
        },
    },
    extraReducers: (builder) => {
        // Handle rehydration
        builder.addCase("persist/REHYDRATE", (state, action) => {
            console.log("Rehydrating user data:", action.payload);
            state.isRehydrated = true;
            if (action.payload && action.payload.user) {
                // Check if user data is nested or direct
                if (action.payload.user.user) {
                    // Handle case where user is stored as string "null"
                    if (action.payload.user.user === "null" || action.payload.user.user === null) {
                        state.user = null;
                        console.log("User data is null, setting to null");
                    } else {
                        state.user = action.payload.user.user;
                        console.log("User data restored (nested):", action.payload.user.user);
                    }
                } else {
                    // Handle case where user is stored as string "null"
                    if (action.payload.user === "null" || action.payload.user === null) {
                        state.user = null;
                        console.log("User data is null, setting to null");
                    } else {
                        state.user = action.payload.user;
                        console.log("User data restored (direct):", action.payload.user);
                    }
                }
            } else {
                console.log("No user data found in persisted state");
                // Only set user to null if we don't already have user data
                if (!state.user) {
                    state.user = null;
                }
            }
        });
        
        // Handle case when there's no persisted data (first time user)
        builder.addCase("persist/PERSIST", (state) => {
            console.log("Persistence started");
        });
    },
});

export const { setUser, clearUser } = userSlice.actions;
export default userSlice.reducer;

export function selectUser(state) {
    return state.user.user;
}

export function selectIsRehydrated(state) {
    return state.user.isRehydrated;
}