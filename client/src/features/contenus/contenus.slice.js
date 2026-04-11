import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchContenusByChapitre,
  createContenuApi,
  updateContenuApi,
  toggleContenuPublicationApi,
  reorderContenusApi,
  deleteContenuApi,
} from "./contenus.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchContenusThunk = createAsyncThunk(
  "contenus/fetch",
  async (chapitreId, { rejectWithValue }) => {
    try {
      const res = await fetchContenusByChapitre(chapitreId);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de chargement.",
      );
    }
  },
);

export const createContenuThunk = createAsyncThunk(
  "contenus/create",
  async ({ chapitreId, data }, { rejectWithValue }) => {
    try {
      const res = await createContenuApi(chapitreId, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de création.",
      );
    }
  },
);

export const updateContenuThunk = createAsyncThunk(
  "contenus/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateContenuApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de modification.",
      );
    }
  },
);

export const toggleContenuPublicationThunk = createAsyncThunk(
  "contenus/togglePublication",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleContenuPublicationApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message ?? "Erreur.");
    }
  },
);

export const reorderContenusThunk = createAsyncThunk(
  "contenus/reorder",
  async ({ chapitreId, items }, { rejectWithValue }) => {
    try {
      const res = await reorderContenusApi(chapitreId, items);
      if (!res.success) return rejectWithValue(res.message);
      return items;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message ?? "Erreur.");
    }
  },
);

export const deleteContenuThunk = createAsyncThunk(
  "contenus/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteContenuApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de suppression.",
      );
    }
  },
);

const contenusSlice = createSlice({
  name: "contenus",
  initialState,
  reducers: {
    resetContenusAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearContenus: (state) => {
      state.data = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchContenusThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchContenusThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchContenusThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createContenuThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createContenuThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data.push(action.payload);
      })
      .addCase(createContenuThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // update + toggle publication
    [updateContenuThunk, toggleContenuPublicationThunk].forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionStatus = "pending";
          state.actionError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionStatus = "succeeded";
          const idx = state.data.findIndex(
            (c) => c._id === action.payload._id,
          );
          if (idx !== -1)
            state.data[idx] = { ...state.data[idx], ...action.payload };
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload;
        });
    });

    // reorder (optimiste)
    builder.addCase(reorderContenusThunk.fulfilled, (state, action) => {
      const orderMap = new Map(action.payload.map((i) => [i.id, i.ordre]));
      state.data.forEach((c) => {
        if (orderMap.has(c._id)) c.ordre = orderMap.get(c._id);
      });
      state.data.sort((a, b) => a.ordre - b.ordre);
    });

    // delete
    builder
      .addCase(deleteContenuThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(deleteContenuThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data = state.data.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteContenuThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetContenusAction, clearContenus } = contenusSlice.actions;
export default contenusSlice.reducer;