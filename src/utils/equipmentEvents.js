export const EQUIPMENT_UPDATED_EVENT = "equipment-updated";

export const notifyEquipmentUpdated = () => {
  window.dispatchEvent(new Event(EQUIPMENT_UPDATED_EVENT));
};
