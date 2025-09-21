import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

// Helper to get auth headers
const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
});

// Normalize response payloads so callers get the expected shape
const unwrap = (res) => {
  // common API patterns:
  // - res.data might be the payload directly
  // - res.data could be { data: ... } or { rooms: [...], booking: {...} }
  if (!res || !res.data) return res;
  // prefer commonly named fields
  if (res.data.rooms) return res.data.rooms;
  if (res.data.booking) return res.data.booking;
  if (res.data.data) return res.data.data;
  return res.data;
};

// GET floors for a building
export const getFloors = async (buildingId) => {
  const res = await axios.get(`${API_BASE}/buildings/${buildingId}/floors`, authHeaders());
  return unwrap(res);
};

// GET buildings
export const getBuildings = async () => {
  const res = await axios.get(`${API_BASE}/buildings`, authHeaders());
  return unwrap(res);
};

// GET rooms for a floor with time filtering
export const getRooms = async (floorId, date, startTime, endTime) => {
  const res = await axios.get(`${API_BASE}/rooms/${floorId}/availability`, {
    params: { date, startTime, endTime },
    ...authHeaders()
  });
  // unwrap may return array of rooms or an object; frontend expects an array
  const value = unwrap(res);
  return Array.isArray(value) ? value : (value?.rooms || []);
};

// POST a new room booking
export const bookRoom = async (bookingData) => {
  const res = await axios.post(`${API_BASE}/bookings`, bookingData, authHeaders());
  return unwrap(res);
};

// GET booking details for a room at a specific time
export const getBookingDetails = async (roomId, date, startTime, endTime) => {
  const res = await axios.get(`${API_BASE}/bookings/${roomId}`, {
    params: { date, startTime, endTime },
    ...authHeaders()
  });
  return unwrap(res);
};

// DELETE a booking by ID
export const cancelBooking = async (bookingId) => {
  const res = await axios.delete(`${API_BASE}/bookings/${bookingId}`, authHeaders());
  return unwrap(res);
};

// ADMIN API ENDPOINTS

// POST admin batch booking
export const createAdminBatch = async (batchData) => {
  const res = await axios.post(`${API_BASE}/admin/bookings/batch`, batchData, authHeaders());
  return unwrap(res);
};

// GET admin bookings with filters
export const getAdminBookings = async (filters = {}) => {
  const res = await axios.get(`${API_BASE}/admin/bookings`, {
    params: filters,
    ...authHeaders()
  });
  return unwrap(res);
};

// GET admin templates
export const getTemplates = async () => {
  const res = await axios.get(`${API_BASE}/admin/templates`, authHeaders());
  return unwrap(res);
};

// POST create template
export const createTemplate = async (templateData) => {
  const res = await axios.post(`${API_BASE}/admin/templates`, templateData, authHeaders());
  return unwrap(res);
};