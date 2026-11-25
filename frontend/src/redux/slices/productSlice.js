import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const fetchProducts = createAsyncThunk(
  "products/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/products`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch products");
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchById",
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API}/products/${id}`);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch product");
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState: {
    items: [],
    selectedProduct: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => { state.loading = false; state.items = action.payload; })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchProductById.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProductById.fulfilled, (state, action) => { state.loading = false; state.selectedProduct = action.payload; })
      .addCase(fetchProductById.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearSelectedProduct } = productSlice.actions;
export default productSlice.reducer;