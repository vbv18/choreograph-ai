import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "message",
  initialState: {
    messages: [],
    artifacts: [],
    isArtifactOpen: false,
    activeArtifactIndex: 0,
    activeFileIndex: 0,
    isLoading: false,
  },
  reducers: {
    setMessages: (state, action) => {
      const msgs = Array.isArray(action.payload) ? action.payload : [];
      state.messages = [...msgs].sort(
        (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
      );
    },
    addMessage: (state, action) => {
      if (action.payload) {
        state.messages.push(action.payload);
      }
    },
    setArtifacts: (state, action) => {
      const raw = Array.isArray(action.payload)
        ? action.payload
        : action.payload
          ? [action.payload]
          : [];
      state.artifacts = raw;
      if (raw.length > 0) {
        state.isArtifactOpen = true;
        state.activeArtifactIndex = 0;
        state.activeFileIndex = 0;
      }
    },
    toggleArtifactOpen: (state) => {
      state.isArtifactOpen = !state.isArtifactOpen;
    },
    setArtifactOpen: (state, action) => {
      state.isArtifactOpen = Boolean(action.payload);
    },
    setActiveArtifactIndex: (state, action) => {
      state.activeArtifactIndex = action.payload;
      state.activeFileIndex = 0;
    },
    setActiveFileIndex: (state, action) => {
      state.activeFileIndex = action.payload;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setArtifacts,
  toggleArtifactOpen,
  setArtifactOpen,
  setActiveArtifactIndex,
  setActiveFileIndex,
  setIsLoading,
} = messageSlice.actions;

export default messageSlice.reducer;
