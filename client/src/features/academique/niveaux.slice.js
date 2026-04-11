import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchNiveaux,
  createNiveauApi,
  updateNiveauApi,
  deleteNiveauApi,
} from "./niveaux.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchNiveauxThunk = createAsyncThunk(
  "niveaux/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchNiveaux(params);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du chargement.",
      );
    }
  },
);

export const createNiveauThunk = createAsyncThunk(
  "niveaux/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createNiveauApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateNiveauThunk = createAsyncThunk(
  "niveaux/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateNiveauApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const deleteNiveauThunk = createAsyncThunk(
  "niveaux/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteNiveauApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la suppression.",
      );
    }
  },
);

const niveauxSlice = createSlice({
  name: "niveaux",
  initialState,
  reducers: {
    resetNiveauxAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNiveauxThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchNiveauxThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchNiveauxThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    builder
      .addCase(createNiveauThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createNiveauThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        // Insertion triée par ordre
        state.data.push({ ...action.payload, nbClasses: 0 });
        state.data.sort((a, b) => a.ordre - b.ordre);
      })
      .addCase(createNiveauThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(updateNiveauThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(updateNiveauThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex((n) => n._id === action.payload._id);
        if (idx !== -1) {
          state.data[idx] = { ...state.data[idx], ...action.payload };
          state.data.sort((a, b) => a.ordre - b.ordre);
        }
      })
      .addCase(updateNiveauThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(deleteNiveauThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(deleteNiveauThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data = state.data.filter((n) => n._id !== action.payload);
      })
      .addCase(deleteNiveauThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetNiveauxAction } = niveauxSlice.actions;
export default niveauxSlice.reducer;