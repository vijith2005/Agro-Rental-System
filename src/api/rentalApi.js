import { rentalClient } from "./http";

const pathId = (id) => encodeURIComponent(id);

export const createRental = async (payload) => {
  const { data } = await rentalClient.post("/rentals", payload);
  return data;
};

export const approveRental = async (id, payload = {}) => {
  const { data } = await rentalClient.put(`/rentals/${pathId(id)}/approve`, payload);
  return data;
};

export const scheduleRental = async (id, payload) => {
  const { data } = await rentalClient.put(`/rentals/${pathId(id)}/schedule`, payload);
  return data;
};

export const assignReturnPickup = async (id, payload) => {
  const { data } = await rentalClient.put(`/rentals/${pathId(id)}/return-assignment`, payload);
  return data;
};

export const updateRentalStatus = async (id, payload) => {
  const { data } = await rentalClient.put(`/rentals/${pathId(id)}/status`, payload);
  return data;
};

export const listAllRentals = async () => {
  const { data } = await rentalClient.get("/rentals");
  return data;
};

export const listRentalsByFarmer = async (farmerId) => {
  const { data } = await rentalClient.get(`/rentals/farmer/${pathId(farmerId)}`);
  return data;
};

export const listRentalsByOwner = async (ownerId) => {
  const { data } = await rentalClient.get(`/rentals/owner/${pathId(ownerId)}`);
  return data;
};

export const listRentalsByAgent = async (agentId) => {
  const { data } = await rentalClient.get(`/rentals/agent/${pathId(agentId)}`);
  return data;
};

export const addUsageLog = async (id, payload) => {
  const { data } = await rentalClient.post(`/rentals/${pathId(id)}/usage-log`, payload);
  return data;
};

export const addDamageReport = async (id, payload) => {
  const { data } = await rentalClient.post(`/rentals/${pathId(id)}/damage-report`, payload);
  return data;
};

export const sendRentalMessage = async (payload) => {
  const { data } = await rentalClient.post("/messages", payload);
  return data;
};

export const getRentalMessages = async (rentalId) => {
  const { data } = await rentalClient.get(`/messages/rental/${pathId(rentalId)}`);
  return data;
};

export const createDamageReport = async (payload) => {
  const { data } = await rentalClient.post("/damage-reports", payload);
  return data;
};

export const getDamageReport = async (id) => {
  const { data } = await rentalClient.get(`/damage-reports/${pathId(id)}`);
  return data;
};

export const resolveDamageReport = async (id, payload = {}) => {
  const { data } = await rentalClient.put(`/damage-reports/${pathId(id)}/resolve`, payload);
  return data;
};

export const createTicket = async (payload) => {
  const { data } = await rentalClient.post("/tickets", payload);
  return data;
};

export const getTicket = async (id) => {
  const { data } = await rentalClient.get(`/tickets/${pathId(id)}`);
  return data;
};
