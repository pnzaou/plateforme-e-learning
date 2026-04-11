import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { getAdminDashboard, getTeacherDashboard } from "./dashboard.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  admin: {
    data: {
      stats: [],
      departmentStats: [],
      pendingApprovals: [],
      recentActivity: [],
      resume: {
        moyenneGlobale: "—",
        tauxReussite: "—",
        quizActifs: 0,
        tauxPresence: "—",
      },
    },
    status: "idle",
    error: null,
  },
  teacher: {
    data: {
      stats: [],
      myCourses: [],
      recentSubmissions: [],
      upcomingClasses: [],
      resume: {
        moyenneGenerale: 0,
        tauxPresence: "—",
        leconsPubliees: 0,
        tauxReussite: "0%",
      },
    },
    status: "idle",
    error: null,
  },
};

export const fetchAdminDashboard = createAsyncThunk(
  "dashboard/admin",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getAdminDashboard();
      if (!res.success || !res.data) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      const message =
        error?.response?.data?.message ??
        "Erreur lors du chargement du dashboard.";
      return rejectWithValue(message);
    }
  },
);

export const fetchTeacherDashboard = createAsyncThunk(
  "dashboard/teacher",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getTeacherDashboard();
      if (!res.success || !res.data) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de chargement."
      );
    }
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {
    resetDashboard: () => initialState,
  },
  extraReducers: (builder) => {
    // Admin
    builder
      .addCase(fetchAdminDashboard.pending, (state) => {
        state.admin.status = "pending";
        state.admin.error = null;
      })
      .addCase(fetchAdminDashboard.fulfilled, (state, action) => {
        state.admin.status = "succeeded";
        state.admin.data = action.payload;
      })
      .addCase(fetchAdminDashboard.rejected, (state, action) => {
        state.admin.status = "failed";
        state.admin.error = action.payload;
      });

    // Teacher
    builder
      .addCase(fetchTeacherDashboard.pending, (state) => {
        state.teacher.status = "pending";
        state.teacher.error = null;
      })
      .addCase(fetchTeacherDashboard.fulfilled, (state, action) => {
        state.teacher.status = "succeeded";
        state.teacher.data = action.payload;
      })
      .addCase(fetchTeacherDashboard.rejected, (state, action) => {
        state.teacher.status = "failed";
        state.teacher.error = action.payload;
      });

    // Reset auto au logout
    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;