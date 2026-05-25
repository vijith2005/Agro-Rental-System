import { getStored, setStored } from "./storage";

export const DELIVERY_REMINDERS_UPDATED_EVENT = "delivery-reminders-updated";
const DELIVERY_REMINDERS_KEY = "deliveryNotifications";
const DELIVERY_REMINDERS_SEEN_KEY = "deliveryNotificationsSeen";

const normalizeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const isActiveDelivery = (status) => {
  const normalized = (status || "").toString().trim().toUpperCase();
  return !["RETURNED", "COMPLETED", "CANCELLED", "REJECTED", "DAMAGED"].includes(normalized);
};

export const collectDeliveryReminders = (rentals = [], agentEmail = "", daysAhead = 2) => {
  const targetAgent = (agentEmail || "").toString().trim().toLowerCase();
  const now = new Date();
  const thresholdMs = Math.max(daysAhead, 0) * 24 * 60 * 60 * 1000;

  return rentals
    .filter((rental) => {
      const assignedAgent = (rental?.returnAgentId || rental?.agentId || "").toString().trim().toLowerCase();
      return assignedAgent && assignedAgent === targetAgent && isActiveDelivery(rental?.status);
    })
    .map((rental) => {
      const endDate = normalizeDate(rental?.endDate || rental?.schedule?.returnDateTime || rental?.schedule?.deliveryDateTime);
      if (!endDate) return null;

      const diff = endDate.getTime() - now.getTime();
      if (diff > thresholdMs) return null;

      const daysLeft = Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
      const urgency = diff < 0 ? "Overdue" : `Due in ${daysLeft} day${daysLeft === 1 ? "" : "s"}`;
      return {
        id: `${rental.id}:${rental.endDate || rental?.schedule?.returnDateTime || "due"}`,
        rentalId: rental.id,
        label: `Return pickup due for ${rental.equipmentName || "equipment"}`,
        meta: `${rental.ownerName || "Owner"} -> ${rental.farmerName || "Farmer"} | ${
          rental.returnAgentName || rental.returnAgentId || rental.agentName || rental.agentId || "Delivery agent"
        } | ${rental.deliveryLocation || rental?.schedule?.deliveryLocation || "Delivery location"} | ${urgency}`,
        dueDate: endDate.toISOString(),
        daysLeft,
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.daysLeft - right.daysLeft);
};

export const readDeliveryReminders = () => getStored(DELIVERY_REMINDERS_KEY, []);

export const writeDeliveryReminders = (items) => {
  setStored(DELIVERY_REMINDERS_KEY, items);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(DELIVERY_REMINDERS_UPDATED_EVENT));
  }
};

export const readSeenDeliveryReminderIds = () => getStored(DELIVERY_REMINDERS_SEEN_KEY, []);

export const markSeenDeliveryReminderIds = (ids = []) => {
  const seen = new Set(readSeenDeliveryReminderIds());
  ids.forEach((id) => seen.add(id));
  setStored(DELIVERY_REMINDERS_SEEN_KEY, [...seen]);
};

export const syncDeliveryReminders = (rentals = [], agentEmail = "", daysAhead = 2) => {
  const reminders = collectDeliveryReminders(rentals, agentEmail, daysAhead);
  writeDeliveryReminders(reminders);
  return reminders;
};
