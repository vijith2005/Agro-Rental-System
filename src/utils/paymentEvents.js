export const PAYMENT_UPDATED_EVENT = "payment-updated";

export const notifyPaymentUpdated = () => {
  window.dispatchEvent(new Event(PAYMENT_UPDATED_EVENT));
};
