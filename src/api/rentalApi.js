import { rentalClient } from "./http";

export const createRental = async (payload) => {
  const { data } = await rentalClient.post("/rentals", payload);
  return data;
};

export const approveRental = async (id, payload = {}) => {
  const { data } = await rentalClient.put(`/rentals/${id}/approve`, payload);
  return data;
};

export const scheduleRental = async (id, payload) => {
  const { data } = await rentalClient.put(`/rentals/${id}/schedule`, payload);
  return data;
};

export const updateRentalStatus = async (id, payload) => {
  const { data } = await rentalClient.put(`/rentals/${id}/status`, payload);
  return data;
};

export const listRentalsByFarmer = async (farmerId) => {
  const { data } = await rentalClient.get(`/rentals/farmer/${encodeURIComponent(farmerId)}`);
  return data;
};

export const listRentalsByOwner = async (ownerId) => {
  const { data } = await rentalClient.get(`/rentals/owner/${encodeURIComponent(ownerId)}`);
  return data;
};

export const listRentalsByAgent = async (agentId) => {
  const { data } = await rentalClient.get(`/rentals/agent/${encodeURIComponent(agentId)}`);
  return data;
};

export const addUsageLog = async (id, payload) => {
  const { data } = await rentalClient.post(`/rentals/${id}/usage-log`, payload);
  return data;
};

export const addDamageReport = async (id, payload) => {
  const { data } = await rentalClient.post(`/rentals/${id}/damage-report`, payload);
  return data;
};

export const sendRentalMessage = async (payload) => {
  const { data } = await rentalClient.post("/messages", payload);
  return data;
};

export const getRentalMessages = async (rentalId) => {
  const { data } = await rentalClient.get(`/messages/rental/${encodeURIComponent(rentalId)}`);
  return data;
};

export const createDamageReport = async (payload) => {
  const { data } = await rentalClient.post("/damage-reports", payload);
  return data;
};

export const getDamageReport = async (id) => {
  const { data } = await rentalClient.get(`/damage-reports/${encodeURIComponent(id)}`);
  return data;
};

export const resolveDamageReport = async (id, payload = {}) => {
  const { data } = await rentalClient.put(`/damage-reports/${encodeURIComponent(id)}/resolve`, payload);
  return data;
};

export const createTicket = async (payload) => {
  const { data } = await rentalClient.post("/tickets", payload);
  return data;
};

export const getTicket = async (id) => {
  const { data } = await rentalClient.get(`/tickets/${encodeURIComponent(id)}`);
  return data;
};
