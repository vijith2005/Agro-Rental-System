export const RENTAL_UPDATED_EVENT = "rental-updated";

export const notifyRentalUpdated = () => {
  window.dispatchEvent(new Event(RENTAL_UPDATED_EVENT));
};
