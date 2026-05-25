import { paymentClient } from "./http";

const pathId = (id) => encodeURIComponent(id);
const normalizePaymentPayload = (payload) => ({
  ...payload,
  amount: Math.round(Number(payload?.amount || 0)),
});

export const createPayment = async (payload) => {
  const { data } = await paymentClient.post("/payments", normalizePaymentPayload(payload));
  return data;
};

export const createRazorpayOrder = async (payload) => {
  const { data } = await paymentClient.post("/payments/razorpay/orders", {
    ...payload,
    amount: Math.round(Number(payload?.amount || 0)),
  });
  return data;
};

export const updatePaymentStatus = async (id, payload) => {
  const { data } = await paymentClient.put(`/payments/${pathId(id)}/status`, payload);
  return data;
};

export const getPaymentById = async (id) => {
  const { data } = await paymentClient.get(`/payments/${pathId(id)}`);
  return data;
};

export const listAllPayments = async () => {
  const { data } = await paymentClient.get("/payments");
  return data;
};

export const listPaymentsByFarmer = async (farmerId) => {
  const { data } = await paymentClient.get(`/payments/farmer/${pathId(farmerId)}`);
  return data;
};

export const listPaymentsByOwner = async (ownerId) => {
  const { data } = await paymentClient.get(`/payments/owner/${pathId(ownerId)}`);
  return data;
};

export const listPaymentsByRental = async (rentalId) => {
  const { data } = await paymentClient.get(`/payments/rental/${pathId(rentalId)}`);
  return data;
};
