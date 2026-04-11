import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchClasses,
  createClasseApi,
  updateClasseApi,
  deleteClasseApi,
} from "./classes.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [],
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchClassesThunk = createAsyncThunk(
  "classes/fetchAll",
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchClasses(params);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors du chargement.",
      );
    }
  },
);

export const createClasseThunk = createAsyncThunk(
  "classes/create",
  async (data, { rejectWithValue }) => {
    try {
      const res = await createClasseApi(data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la création.",
      );
    }
  },
);

export const updateClasseThunk = createAsyncThunk(
  "classes/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateClasseApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la modification.",
      );
    }
  },
);

export const deleteClasseThunk = createAsyncThunk(
  "classes/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteClasseApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur lors de la suppression.",
      );
    }
  },
);

const classesSlice = createSlice({
  name: "classes",
  initialState,
  reducers: {
    resetClassesAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClassesThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchClassesThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchClassesThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    builder
      .addCase(createClasseThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createClasseThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data.unshift({ ...action.payload, nbEtudiants: 0 });
      })
      .addCase(createClasseThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(updateClasseThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(updateClasseThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const idx = state.data.findIndex((c) => c._id === action.payload._id);
        if (idx !== -1)
          state.data[idx] = { ...state.data[idx], ...action.payload };
      })
      .addCase(updateClasseThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder
      .addCase(deleteClasseThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(deleteClasseThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data = state.data.filter((c) => c._id !== action.payload);
      })
      .addCase(deleteClasseThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetClassesAction } = classesSlice.actions;
export default classesSlice.reducer;