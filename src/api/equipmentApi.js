import { equipmentClient } from "./http";

const pathId = (id) => encodeURIComponent(id);

const buildQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          searchParams.append(key, item);
        }
      });
      return;
    }
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
  const { data } = await equipmentClient.get(`/equipment/${pathId(id)}`);
  return data;
};

export const createEquipment = async (payload) => {
  const { data } = await equipmentClient.post("/equipment", payload);
  return data;
};

export const updateEquipment = async (id, payload) => {
  const { data } = await equipmentClient.put(`/equipment/${pathId(id)}`, payload);
  return data;
};

export const updateEquipmentStatus = async (id, status) => {
  const { data } = await equipmentClient.patch(`/equipment/${pathId(id)}/status`, { status });
  return data;
};

export const deleteEquipment = async (id) => {
  const { data } = await equipmentClient.delete(`/equipment/${pathId(id)}`);
  return data;
};
