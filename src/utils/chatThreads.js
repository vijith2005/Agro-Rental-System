import { getStored, setStored, STORAGE_KEYS } from "./storage";

export const CHAT_UPDATED_EVENT = "chats-updated";

export const readChatThreads = () => getStored(STORAGE_KEYS.chats, []);

export const writeChatThreads = (threads) => {
  setStored(STORAGE_KEYS.chats, threads);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CHAT_UPDATED_EVENT));
  }
};

const normalizeRole = (role) => (role || "").toLowerCase();

export const normalizeChatMessage = (message) => {
  const createdAt = message?.createdAt || message?.at || new Date().toISOString();
  const senderRole = normalizeRole(message?.senderRole || message?.sender || message?.from);

  return {
    id: message?.id || `msg-${Date.now()}`,
    rentalId: message?.rentalId || "",
    senderId: message?.senderId || message?.from || "",
    senderName: message?.senderName || message?.fromName || "",
    senderRole,
    text: message?.text || "",
    createdAt,
    at: createdAt,
    from: senderRole,
    fromName: message?.senderName || message?.fromName || "",
  };
};

export const buildChatThread = (rental, role, messages = [], cachedThread = null) => {
  const isOwnerView = role === "owner";
  const contactName = isOwnerView ? rental?.farmerName || "Farmer" : rental?.ownerName || "Owner";
  const contactId = isOwnerView ? rental?.farmerId || "" : rental?.ownerId || "";

  return {
    id: rental?.id || "",
    rentalId: rental?.id || "",
    equipmentId: rental?.equipmentId || "",
    equipmentName: rental?.equipmentName || "Equipment",
    ownerId: rental?.ownerId || "",
    ownerName: rental?.ownerName || "Owner",
    farmerId: rental?.farmerId || "",
    farmerName: rental?.farmerName || "Farmer",
    agentId: rental?.agentId || "",
    agentName: rental?.agentName || "Agent",
    contactId,
    contactName,
    unreadForFarmer: cachedThread?.unreadForFarmer || 0,
    unreadForOwner: cachedThread?.unreadForOwner || 0,
    messages: messages.map(normalizeChatMessage),
    status: rental?.status || "",
    createdAt: rental?.createdAt || "",
    updatedAt: rental?.updatedAt || "",
  };
};

export const clearUnreadForRole = (thread, role) => {
  if (!thread) return thread;

  const nextUnreadForFarmer = role === "farmer" ? 0 : thread.unreadForFarmer || 0;
  const nextUnreadForOwner = role === "owner" ? 0 : thread.unreadForOwner || 0;

  if (
    nextUnreadForFarmer === (thread.unreadForFarmer || 0) &&
    nextUnreadForOwner === (thread.unreadForOwner || 0)
  ) {
    return thread;
  }

  return {
    ...thread,
    unreadForFarmer: nextUnreadForFarmer,
    unreadForOwner: nextUnreadForOwner,
  };
};

export const getThreadPreview = (thread) => {
  const messages = thread?.messages || [];
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.text || "No messages yet.";
};

export const getThreadStamp = (thread) => {
  const messages = thread?.messages || [];
  const lastMessage = messages[messages.length - 1];
  return lastMessage?.createdAt || lastMessage?.at || thread?.updatedAt || thread?.createdAt || null;
};
