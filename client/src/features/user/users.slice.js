import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchUsers,
  createUserApi,
  updateUserApi,
  toggleUserStatusApi,
  fetchUserDetailsApi, // ← ajouté
} from "./users.api";
import { logoutUser } from "@/features/auth/auth.slice";

const makeRoleState = () => ({
  data: [],
  pagination: { total: 0, page: 1, limit: 20, totalPages: 1 },
  status: "idle",
  error: null,
});

const initialState = {
  byRole: {
    enseignant: makeRoleState(),
    etudiant: makeRoleState(),
    chef_departement: makeRoleState(),
    admin: makeRoleState(),
  },
  // ─── NOUVEAU : détail de l'utilisateur actuellement consulté ───
  currentDetails: {
    data: null,
    status: "idle",
    error: null,
  },
  actionStatus: "idle",
  actionError: null,
};

export const fetchUsersThunk = createAsyncThunk(
  "users/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchUsers(params);
      if (!res.success) return rejectWithValue(res.message);
      return {
        role: params.role ?? "all",
        data: res.data,
        pagination: res.pagination,
      };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du chargement.",
      );
    }
  },
);

export const createUserThunk = createAsyncThunk(
  "users/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createUserApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateUserThunk = createAsyncThunk(
  "users/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateUserApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const toggleUserStatusThunk = createAsyncThunk(
  "users/toggleStatus",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleUserStatusApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return { user: res.data, warning: res.warning ?? null };
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ??
          "Erreur lors du changement de statut.",
      );
    }
  },
);

// ─── NOUVEAU ───
export const fetchUserDetailsThunk = createAsyncThunk(
  "users/fetchDetails",
  async (id, { rejectWithValue }) => {
    try {
      const res = await fetchUserDetailsApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ??
          "Erreur lors du chargement des détails.",
      );
    }
  },
);

const updateUserInAllRoles = (state, updatedUser) => {
  const roleKey = updatedUser.role;
  if (state.byRole[roleKey]) {
    const idx = state.byRole[roleKey].data.findIndex(
      (u) => u._id === updatedUser._id,
    );
    if (idx !== -1) state.byRole[roleKey].data[idx] = updatedUser;
  }
  // Si c'est l'utilisateur dont on consulte les détails, on met à jour aussi
  if (state.currentDetails.data?.user?._id === updatedUser._id) {
    state.currentDetails.data.user = {
      ...state.currentDetails.data.user,
      ...updatedUser,
    };
  }
};

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    resetActionStatus: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    // ─── NOUVEAU : clear les détails quand on quitte la page ───
    clearCurrentDetails: (state) => {
      state.currentDetails = { data: null, status: "idle", error: null };
    },
  },
  extraReducers: (builder) => {
    // fetchAll
    builder
      .addCase(fetchUsersThunk.pending, (state, action) => {
        const role = action.meta.arg?.role ?? "all";
        if (state.byRole[role]) {
          state.byRole[role].status = "pending";
          state.byRole[role].error = null;
        }
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        const { role, data, pagination } = action.payload;
        if (state.byRole[role]) {
          state.byRole[role].status = "succeeded";
          state.byRole[role].data = data;
          state.byRole[role].pagination = pagination;
        }
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        const role = action.meta.arg?.role ?? "all";
        if (state.byRole[role]) {
          state.byRole[role].status = "failed";
          state.byRole[role].error = action.payload;
        }
      });

    // create
    builder
      .addCase(createUserThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createUserThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const roleKey = action.payload.role;
        if (state.byRole[roleKey]) {
          state.byRole[roleKey].data.unshift(action.payload);
          state.byRole[roleKey].pagination.total += 1;
        }
      })
      .addCase(createUserThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // update
    builder
      .addCase(updateUserThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(updateUserThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        updateUserInAllRoles(state, action.payload);
      })
      .addCase(updateUserThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // toggleStatus
    builder
      .addCase(toggleUserStatusThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(toggleUserStatusThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        updateUserInAllRoles(state, action.payload.user);
      })
      .addCase(toggleUserStatusThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // ─── NOUVEAU : fetchDetails ───
    builder
      .addCase(fetchUserDetailsThunk.pending, (state) => {
        state.currentDetails.status = "pending";
        state.currentDetails.error = null;
      })
      .addCase(fetchUserDetailsThunk.fulfilled, (state, action) => {
        state.currentDetails.status = "succeeded";
        state.currentDetails.data = action.payload;
      })
      .addCase(fetchUserDetailsThunk.rejected, (state, action) => {
        state.currentDetails.status = "failed";
        state.currentDetails.error = action.payload;
      });

    // reset au logout
    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetActionStatus, clearCurrentDetails } = usersSlice.actions;
export default usersSlice.reducer;