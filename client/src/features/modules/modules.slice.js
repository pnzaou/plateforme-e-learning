import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchModules,
  fetchModuleByIdApi,
  createModuleApi,
  updateModuleApi,
  soumettreModuleApi,
  approuverModuleApi,
  rejeterModuleApi,
  archiverModuleApi,
  deleteModuleApi,
} from "./modules.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
  status: "idle",
  error: null,
  current: { data: null, status: "idle", error: null },
  actionStatus: "idle",
  actionError: null,
};

export const fetchModulesThunk = createAsyncThunk(
  "modules/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchModules(params);
      if (!res.success) return rejectWithValue(res.message);
      return { data: res.data, pagination: res.pagination };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de chargement.",
      );
    }
  },
);

export const fetchModuleByIdThunk = createAsyncThunk(
  "modules/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetchModuleByIdApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de chargement.",
      );
    }
  },
);

export const createModuleThunk = createAsyncThunk(
  "modules/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createModuleApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateModuleThunk = createAsyncThunk(
  "modules/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateModuleApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const soumettreModuleThunk = createAsyncThunk(
  "modules/soumettre",
  async (id, { rejectWithValue }) => {
    try {
      const res = await soumettreModuleApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la soumission.",
      );
    }
  },
);

export const approuverModuleThunk = createAsyncThunk(
  "modules/approuver",
  async (id, { rejectWithValue }) => {
    try {
      const res = await approuverModuleApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de l'approbation.",
      );
    }
  },
);

export const rejeterModuleThunk = createAsyncThunk(
  "modules/rejeter",
  async ({ id, motif }, { rejectWithValue }) => {
    try {
      const res = await rejeterModuleApi(id, motif);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du rejet.",
      );
    }
  },
);

export const archiverModuleThunk = createAsyncThunk(
  "modules/archiver",
  async (id, { rejectWithValue }) => {
    try {
      const res = await archiverModuleApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de l'archivage.",
      );
    }
  },
);

export const deleteModuleThunk = createAsyncThunk(
  "modules/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteModuleApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la suppression.",
      );
    }
  },
);

// Helper : MAJ d'un module dans la liste
const updateModuleInList = (state, updated) => {
  const idx = state.data.findIndex((m) => m._id === updated._id);
  if (idx !== -1) {
    state.data[idx] = { ...state.data[idx], ...updated };
  }
  if (state.current.data?._id === updated._id) {
    state.current.data = { ...state.current.data, ...updated };
  }
};

const modulesSlice = createSlice({
  name: "modules",
  initialState,
  reducers: {
    resetModulesAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearCurrentModule: (state) => {
      state.current = { data: null, status: "idle", error: null };
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchModulesThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchModulesThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchModulesThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // fetchById
    builder
      .addCase(fetchModuleByIdThunk.pending, (state) => {
        state.current.status = "pending";
        state.current.error = null;
      })
      .addCase(fetchModuleByIdThunk.fulfilled, (state, action) => {
        state.current.status = "succeeded";
        state.current.data = action.payload;
      })
      .addCase(fetchModuleByIdThunk.rejected, (state, action) => {
        state.current.status = "failed";
        state.current.error = action.payload;
      });

    // create
    builder
      .addCase(createModuleThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createModuleThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data.unshift(action.payload);
        state.pagination.total += 1;
      })
      .addCase(createModuleThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // update / workflow (soumettre/approuver/rejeter/archiver)
    const workflowThunks = [
      updateModuleThunk,
      soumettreModuleThunk,
      approuverModuleThunk,
      rejeterModuleThunk,
      archiverModuleThunk,
    ];
    workflowThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionStatus = "pending";
          state.actionError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionStatus = "succeeded";
          updateModuleInList(state, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload;
        });
    });

    // delete
    builder
      .addCase(deleteModuleThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(deleteModuleThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data = state.data.filter((m) => m._id !== action.payload);
        state.pagination.total = Math.max(0, state.pagination.total - 1);
      })
      .addCase(deleteModuleThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetModulesAction, clearCurrentModule } = modulesSlice.actions;
export default modulesSlice.reducer;