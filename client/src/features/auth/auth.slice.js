import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { changePassword, me, userLogin, userLogout } from "./auth.api";

const initialState = {
  error: null,
  loading: false,
  userData: null,
  status: "idle",
};

export const loginUser = createAsyncThunk(
  "auth/login",
  async (payload, { rejectWithValue, dispatch }) => {
    try {
      const res = await userLogin(payload);
      if (!res.success) return rejectWithValue(res.message);

      // On récupère les données de l'utilisateur après login
      const meRes = await dispatch(fetchMe()).unwrap();
      return meRes;
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Erreur lors de la connexion.";
      return rejectWithValue(message);
    }
  },
);

export const fetchMe = createAsyncThunk(
  "auth/me",
  async (_, { rejectWithValue }) => {
    try {
      const res = await me();
      if (!res.success || !res.data) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Erreur lors de la connexion.";
      return rejectWithValue(message);
    }
  },
);

export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userLogout();
      if (!res.success) return rejectWithValue(res.message);
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Erreur lors de la déconnexion.";
      return rejectWithValue(message);
    }
  },
);

export const changeUserPassword = createAsyncThunk(
  "auth/change-password",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await changePassword(payload);
      if (!res.success) return rejectWithValue(res.message);
    } catch (error) {
      const message =
        error?.response?.data?.message ?? "Erreur lors de la modification.";
      return rejectWithValue(message);
    }
  },
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    logout: (state) => {
      state.error = null;
      state.loading = false;
      state.userData = null;
      state.status = "idle";
    },
  },

  extraReducers: (builder) => {
    // ── loginUser ──
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload ?? null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // ── fetchMe ──
    builder
      .addCase(fetchMe.pending, (state) => {
        state.status = "pending";
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload;
        state.status = "succeeded";
      })
      .addCase(fetchMe.rejected, (state, action) => {
        state.status = "failed";
        state.loading = false;
        state.userData = null;
        state.error = action.payload;
      });

    // ── logoutUser ──
    builder
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.loading = false;
        state.userData = null;
        state.status = "idle";
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.loading = false;
        // On reset quand même côté front même si l'API échoue
        state.userData = null;
        state.status = "idle";
        state.error = action.payload;
      });

    builder.addCase(changeUserPassword.fulfilled, (state) => {
      state.userData.isDefaultPasswordChanged = true;
    });
  },
});

export const { clearError, logout } = authSlice.actions;
export default authSlice.reducer;
