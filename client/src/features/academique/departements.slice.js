import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchDepartements,
  createDepartementApi,
  updateDepartementApi,
  toggleDepartementStatusApi,
} from "./departements.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  pagination: { total: 0, page: 1, limit: 50, totalPages: 1 },
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchDepartementsThunk = createAsyncThunk(
  "departements/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchDepartements(params);
      if (!res.success) return rejectWithValue(res.message);
      return { data: res.data, pagination: res.pagination };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du chargement.",
      );
    }
  },
);

export const createDepartementThunk = createAsyncThunk(
  "departements/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createDepartementApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateDepartementThunk = createAsyncThunk(
  "departements/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateDepartementApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const toggleDepartementStatusThunk = createAsyncThunk(
  "departements/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleDepartementStatusApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return { dep: res.data, warning: res.warning ?? null };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du changement de statut.",
      );
    }
  },
);

const departementsSlice = createSlice({
  name: "departements",
  initialState,
  reducers: {
    resetDepartementsAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchDepartementsThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchDepartementsThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchDepartementsThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // create
    builder
      .addCase(createDepartementThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createDepartementThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data.unshift({
          ...action.payload,
          nbFilieres: 0,
          nbEnseignants: 0,
        });
        state.pagination.total += 1;
      })
      .addCase(createDepartementThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateDepartementThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(updateDepartementThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex((d) => d._id === action.payload._id);
        if (idx !== -1) {
          // Préserver les compteurs enrichis
          state.data[idx] = {
            ...state.data[idx],
            ...action.payload,
          };
        }
      })
      .addCase(updateDepartementThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // toggle status
    builder
      .addCase(toggleDepartementStatusThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(toggleDepartementStatusThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex(
          (d) => d._id === action.payload.dep._id,
        );
        if (idx !== -1) {
          state.data[idx] = {
            ...state.data[idx],
            ...action.payload.dep,
          };
        }
      })
      .addCase(toggleDepartementStatusThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // reset au logout
    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetDepartementsAction } = departementsSlice.actions;
export default departementsSlice.reducer;