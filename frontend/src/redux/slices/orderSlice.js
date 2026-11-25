import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

export const createOrder = createAsyncThunk(
  "orders/create",
  async (orderData, { getState, rejectWithValue }) => {
    try {
      const { auth: { user } } = getState();
      const { data } = await axios.post(`${API}/orders`, orderData, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to create order");
    }
  }
);

export const fetchMyOrders = createAsyncThunk(
  "orders/fetchMine",
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth: { user } } = getState();
      const { data } = await axios.get(`${API}/orders/myorders`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
    }
  }
);

const orderSlice = createSlice({
  name: "orders",
  initialState: {
    myOrders: [],
    currentOrder: null,
    loading: false,
    error: null,
    success: false,
  },
  reducers: {
    clearOrderState: (state) => {
      state.currentOrder = null;
      state.success = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createOrder.pending, (state) => { state.loading = true; state.error = null; state.success = false; })
      .addCase(createOrder.fulfilled, (state, action) => { state.loading = false; state.currentOrder = action.payload; state.success = true; })
      .addCase(createOrder.rejected, (state, action) => { state.loading = false; state.error = action.payload; })
      .addCase(fetchMyOrders.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchMyOrders.fulfilled, (state, action) => { state.loading = false; state.myOrders = action.payload; })
      .addCase(fetchMyOrders.rejected, (state, action) => { state.loading = false; state.error = action.payload; });
  },
});

export const { clearOrderState } = orderSlice.actions;
export default orderSlice.reducer;