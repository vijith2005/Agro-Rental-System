import { equipmentClient } from "./http";

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    searchParams.set(key, value);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : "";
};

export const listEquipment = async (params = {}) => {
  const { data } = await equipmentClient.get(`/equipment${buildQueryString(params)}`);
  return data;
};

export const getEquipmentById = async (id) => {
  const { data } = await equipmentClient.get(`/equipment/${id}`);
  return data;
};

export const createEquipment = async (payload) => {
  const { data } = await equipmentClient.post("/equipment", payload);
  return data;
};

export const updateEquipment = async (id, payload) => {
  const { data } = await equipmentClient.put(`/equipment/${id}`, payload);
  return data;
};

export const updateEquipmentStatus = async (id, status) => {
  const { data } = await equipmentClient.patch(`/equipment/${id}/status`, { status });
  return data;
};

export const deleteEquipment = async (id) => {
  const { data } = await equipmentClient.delete(`/equipment/${id}`);
  return data;
};
