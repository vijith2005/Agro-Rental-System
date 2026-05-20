import { paymentClient } from "./http";

export const createPayment = async (payload) => {
  const { data } = await paymentClient.post("/payments", payload);
  return data;
};

export const updatePaymentStatus = async (id, payload) => {
  const { data } = await paymentClient.put(`/payments/${id}/status`, payload);
  return data;
};

export const getPaymentById = async (id) => {
  const { data } = await paymentClient.get(`/payments/${id}`);
  return data;
};

export const listPaymentsByFarmer = async (farmerId) => {
  const { data } = await paymentClient.get(`/payments/farmer/${encodeURIComponent(farmerId)}`);
  return data;
};

export const listPaymentsByOwner = async (ownerId) => {
  const { data } = await paymentClient.get(`/payments/owner/${encodeURIComponent(ownerId)}`);
  return data;
};

export const listPaymentsByRental = async (rentalId) => {
  const { data } = await paymentClient.get(`/payments/rental/${encodeURIComponent(rentalId)}`);
  return data;
};
