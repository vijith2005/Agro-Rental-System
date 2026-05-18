import React, { useEffect, useMemo, useState } from "react";
import { getStored, setStored, STORAGE_KEYS } from "../utils/storage";

const persistThreads = (threads) => {
  setStored(STORAGE_KEYS.chats, threads);
  window.dispatchEvent(new Event("chats-updated"));
};

const ChatModal = ({ item, thread, currentRole, currentUserId, currentUserName, onClose }) => {
  const chatId = useMemo(() => {
    if (thread?.id) return thread.id;
    const ownerId = item?.ownerId || "owner@demo.com";
    return `chat-${item?.id}-${ownerId}-${currentUserId}`;
  }, [currentUserId, item?.id, item?.ownerId, thread?.id]);

  const [draft, setDraft] = useState("");
  const [threads, setThreads] = useState(() => getStored(STORAGE_KEYS.chats, []));
  const [activeThread, setActiveThread] = useState(thread || null);

  useEffect(() => {
    const existing = threads.find((t) => t.id === chatId);
    if (existing) {
      setActiveThread(existing);
      const needsClear =
        currentRole === "farmer"
          ? (existing.unreadForFarmer || 0) > 0
          : (existing.unreadForOwner || 0) > 0;
      if (needsClear) {
        const updated = threads.map((t) =>
          t.id === chatId
            ? {
                ...t,
                unreadForFarmer: currentRole === "farmer" ? 0 : t.unreadForFarmer,
                unreadForOwner: currentRole === "owner" ? 0 : t.unreadForOwner,
              }
            : t
        );
        setThreads(updated);
        persistThreads(updated);
      }
      return;
    }

    if (!item) return;
    const newThread = {
      id: chatId,
      equipmentId: item.id,
      equipmentName: item.name,
      ownerId: item.ownerId || "owner@demo.com",
      ownerName: item.ownerName || "Owner",
      farmerId: currentRole === "farmer" ? currentUserId : item.farmerId || "farmer@demo.com",
      farmerName: currentRole === "farmer" ? currentUserName : item.farmerName || "Farmer",
      unreadForFarmer: 0,
      unreadForOwner: 0,
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: "owner",
          text: `Hi ${currentUserName}, you can message me here about ${item.name}.`,
          createdAt: new Date().toISOString(),
        },
      ],
    };
    const updated = [...threads, newThread];
    setThreads(updated);
    persistThreads(updated);
    setActiveThread(newThread);
  }, [chatId, currentRole, currentUserId, currentUserName, item, threads]);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text || !activeThread) return;
    const updatedThreads = threads.map((t) => {
      if (t.id !== chatId) return t;
      const msg = {
        id: `msg-${Date.now()}`,
        sender: currentRole,
        text,
        createdAt: new Date().toISOString(),
      };
      return {
        ...t,
        unreadForFarmer:
          currentRole === "owner" ? (t.unreadForFarmer || 0) + 1 : t.unreadForFarmer,
        unreadForOwner:
          currentRole === "farmer" ? (t.unreadForOwner || 0) + 1 : t.unreadForOwner,
        messages: [...t.messages, msg],
      };
    });
    setThreads(updatedThreads);
    persistThreads(updatedThreads);
    setDraft("");
  };

  if (!activeThread) return null;

  return (
    <div className="chat-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(event) => event.stopPropagation()}>
        <div className="chat-header">
          <div>
            <div className="chat-title">
              {currentRole === "farmer" ? activeThread.ownerName : activeThread.farmerName}
            </div>
            <div className="chat-subtitle">Regarding {activeThread.equipmentName}</div>
          </div>
          <button type="button" className="chat-close" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="chat-body">
          {activeThread.messages.map((message) => (
            <div
              key={message.id}
              className={`chat-bubble ${
                message.sender === currentRole ? "from-me" : "from-owner"
              }`}
            >
              <div className="chat-text">{message.text}</div>
            </div>
          ))}
        </div>
        <div className="chat-input">
          <input
            type="text"
            placeholder="Type your message..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
          <button type="button" onClick={sendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatModal;
