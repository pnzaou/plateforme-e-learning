import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchFilieres,
  createFiliereApi,
  updateFiliereApi,
  toggleFiliereStatusApi,
} from "./filieres.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  pagination: { total: 0, page: 1, limit: 50, totalPages: 1 },
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchFilieresThunk = createAsyncThunk(
  "filieres/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchFilieres(params);
      if (!res.success) return rejectWithValue(res.message);
      return { data: res.data, pagination: res.pagination };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du chargement.",
      );
    }
  },
);

export const createFiliereThunk = createAsyncThunk(
  "filieres/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createFiliereApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateFiliereThunk = createAsyncThunk(
  "filieres/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateFiliereApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const toggleFiliereStatusThunk = createAsyncThunk(
  "filieres/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleFiliereStatusApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return { filiere: res.data, warning: res.warning ?? null };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du changement de statut.",
      );
    }
  },
);

const filieresSlice = createSlice({
  name: "filieres",
  initialState,
  reducers: {
    resetFilieresAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFilieresThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchFilieresThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchFilieresThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    builder
      .addCase(createFiliereThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createFiliereThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data.unshift({ ...action.payload, nbNiveaux: 0 });
        state.pagination.total += 1;
      })
      .addCase(createFiliereThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(updateFiliereThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(updateFiliereThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex((f) => f._id === action.payload._id);
        if (idx !== -1)
          state.data[idx] = { ...state.data[idx], ...action.payload };
      })
      .addCase(updateFiliereThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(toggleFiliereStatusThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(toggleFiliereStatusThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex(
          (f) => f._id === action.payload.filiere._id,
        );
        if (idx !== -1)
          state.data[idx] = { ...state.data[idx], ...action.payload.filiere };
      })
      .addCase(toggleFiliereStatusThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetFilieresAction } = filieresSlice.actions;
export default filieresSlice.reducer;