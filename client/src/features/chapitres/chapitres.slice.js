import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  fetchChapitresByModule,
  createChapitreApi,
  updateChapitreApi,
  toggleChapitrePublicationApi,
  reorderChapitresApi,
  deleteChapitreApi,
} from "./chapitres.api";
import { logoutUser } from "@/features/auth/auth.slice";

const initialState = {
  data: [], // arbre [{...chapitre, sousChapitres: [...]}]
  status: "idle",
  error: null,
  actionStatus: "idle",
  actionError: null,
};

export const fetchChapitresThunk = createAsyncThunk(
  "chapitres/fetch",
  async (moduleId, { rejectWithValue }) => {
    try {
      const res = await fetchChapitresByModule(moduleId);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de chargement.",
      );
    }
  },
);

export const createChapitreThunk = createAsyncThunk(
  "chapitres/create",
  async ({ moduleId, data }, { rejectWithValue }) => {
    try {
      const res = await createChapitreApi(moduleId, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de création.",
      );
    }
  },
);

export const updateChapitreThunk = createAsyncThunk(
  "chapitres/update",
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const res = await updateChapitreApi(id, data);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de modification.",
      );
    }
  },
);

export const toggleChapitrePublicationThunk = createAsyncThunk(
  "chapitres/togglePublication",
  async (id, { rejectWithValue }) => {
    try {
      const res = await toggleChapitrePublicationApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return res.data;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message ?? "Erreur.");
    }
  },
);

export const reorderChapitresThunk = createAsyncThunk(
  "chapitres/reorder",
  async ({ moduleId, items }, { rejectWithValue }) => {
    try {
      const res = await reorderChapitresApi(moduleId, items);
      if (!res.success) return rejectWithValue(res.message);
      return items;
    } catch (error) {
      return rejectWithValue(error?.response?.data?.message ?? "Erreur.");
    }
  },
);

export const deleteChapitreThunk = createAsyncThunk(
  "chapitres/delete",
  async (id, { rejectWithValue }) => {
    try {
      const res = await deleteChapitreApi(id);
      if (!res.success) return rejectWithValue(res.message);
      return id;
    } catch (error) {
      return rejectWithValue(
        error?.response?.data?.message ?? "Erreur de suppression.",
      );
    }
  },
);

// Helper : update un chapitre (parent ou sous) dans l'arbre
const updateChapitreInTree = (tree, updated) => {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i]._id === updated._id) {
      tree[i] = { ...tree[i], ...updated };
      return true;
    }
    if (tree[i].sousChapitres?.length) {
      for (let j = 0; j < tree[i].sousChapitres.length; j++) {
        if (tree[i].sousChapitres[j]._id === updated._id) {
          tree[i].sousChapitres[j] = {
            ...tree[i].sousChapitres[j],
            ...updated,
          };
          return true;
        }
      }
    }
  }
  return false;
};

const removeChapitreFromTree = (tree, id) => {
  const filtered = tree.filter((ch) => ch._id !== id);
  return filtered.map((ch) => ({
    ...ch,
    sousChapitres: (ch.sousChapitres || []).filter((s) => s._id !== id),
  }));
};

const chapitresSlice = createSlice({
  name: "chapitres",
  initialState,
  reducers: {
    resetChapitresAction: (state) => {
      state.actionStatus = "idle";
      state.actionError = null;
    },
    clearChapitres: (state) => {
      state.data = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChapitresThunk.pending, (state) => {
        state.status = "pending";
        state.error = null;
      })
      .addCase(fetchChapitresThunk.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.data = action.payload;
      })
      .addCase(fetchChapitresThunk.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      });

    // create : pour un chapitre racine on ajoute à la fin, pour un sous-chap on push dans le bon parent
    builder
      .addCase(createChapitreThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(createChapitreThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        const newCh = action.payload;
        if (!newCh.parentChapitre) {
          state.data.push({ ...newCh, sousChapitres: [] });
        } else {
          const parent = state.data.find((c) => c._id === newCh.parentChapitre);
          if (parent) {
            parent.sousChapitres = [...(parent.sousChapitres || []), newCh];
          }
        }
      })
      .addCase(createChapitreThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    // update / toggle
    const workflowThunks = [
      updateChapitreThunk,
      toggleChapitrePublicationThunk,
    ];
    workflowThunks.forEach((thunk) => {
      builder
        .addCase(thunk.pending, (state) => {
          state.actionStatus = "pending";
          state.actionError = null;
        })
        .addCase(thunk.fulfilled, (state, action) => {
          state.actionStatus = "succeeded";
          updateChapitreInTree(state.data, action.payload);
        })
        .addCase(thunk.rejected, (state, action) => {
          state.actionStatus = "failed";
          state.actionError = action.payload;
        });
    });

    // reorder : maj optimiste de l'ordre
    builder.addCase(reorderChapitresThunk.fulfilled, (state, action) => {
      const orderMap = new Map(action.payload.map((i) => [i.id, i.ordre]));
      state.data.forEach((ch) => {
        if (orderMap.has(ch._id)) ch.ordre = orderMap.get(ch._id);
        ch.sousChapitres?.forEach((s) => {
          if (orderMap.has(s._id)) s.ordre = orderMap.get(s._id);
        });
      });
      state.data.sort((a, b) => a.ordre - b.ordre);
      state.data.forEach((ch) =>
        ch.sousChapitres?.sort((a, b) => a.ordre - b.ordre),
      );
    });

    // delete
    builder
      .addCase(deleteChapitreThunk.pending, (state) => {
        state.actionStatus = "pending";
        state.actionError = null;
      })
      .addCase(deleteChapitreThunk.fulfilled, (state, action) => {
        state.actionStatus = "succeeded";
        state.data = removeChapitreFromTree(state.data, action.payload);
      })
      .addCase(deleteChapitreThunk.rejected, (state, action) => {
        state.actionStatus = "failed";
        state.actionError = action.payload;
      });

    builder.addCase(logoutUser.fulfilled, () => initialState);
  },
});

export const { resetChapitresAction, clearChapitres } = chapitresSlice.actions;
export default chapitresSlice.reducer;
