import React, { useEffect, useMemo, useRef, useState } from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { readStoredUser } from "../../utils/authApi";

const OwnerMessages = () => {
  const [contacts, setContacts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState("");
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  const currentUser = readStoredUser();
  const ownerId = currentUser?.email || "owner@demo.com";
  const ownerName = currentUser?.name || currentUser?.email?.split("@")[0] || "Owner";

  useEffect(() => {
    const threads = getStored(STORAGE_KEYS.chats, []);
    const myThreads = threads.filter((t) => t.ownerId === ownerId);
    const mapped = myThreads.map((t) => ({
      id: t.id,
      contactName: t.farmerName,
      equipment: t.equipmentName,
      unread: t.unreadForOwner || 0,
      messages: t.messages || [],
    }));
    setContacts(mapped);
    if (mapped.length > 0 && !activeId) {
      setActiveId(mapped[0].id);
    }
  }, [activeId, ownerId]);

  const activeThread = contacts.find((c) => c.id === activeId);

  const filteredContacts = useMemo(() => {
    const term = search.toLowerCase();
    return contacts.filter(
      (c) =>
        c.contactName.toLowerCase().includes(term) ||
        c.equipment.toLowerCase().includes(term)
    );
  }, [contacts, search]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeThread]);

  const sendMessage = () => {
    if (!input.trim() || !activeThread) return;
    const threads = getStored(STORAGE_KEYS.chats, []);
    const idx = threads.findIndex((t) => t.id === activeThread.id);
    if (idx === -1) return;
    const newMsg = {
      from: ownerId,
      fromName: ownerName,
      text: input.trim(),
      at: new Date().toISOString(),
    };
    threads[idx].messages = [...(threads[idx].messages || []), newMsg];
    threads[idx].unreadForFarmer = (threads[idx].unreadForFarmer || 0) + 1;
    setStored(STORAGE_KEYS.chats, threads);
    setContacts((prev) =>
      prev.map((c) => (c.id === activeThread.id ? { ...c, messages: [...c.messages, newMsg] } : c))
    );
    setInput("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="agr-page owner-dashboard">
      <h2 className="agr-h1 mb-3">Messages</h2>
      <div className="row g-3">
        {/* Left contacts list */}
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Contacts</h5>
                <span className="badge bg-light text-dark">{contacts.length}</span>
              </div>
              <div className="mb-3">
                <input
                  className="form-control"
                  placeholder="Search contacts"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="list-group" style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {filteredContacts.length === 0 && (
                  <div className="text-muted small py-2 px-1">No contacts.</div>
                )}
                {filteredContacts.map((c) => {
                  const last = c.messages[c.messages.length - 1];
                  const isActive = c.id === activeId;
                  return (
                    <button
                      key={c.id}
                      className={`list-group-item list-group-item-action d-flex justify-content-between align-items-start ${isActive ? "active" : ""}`}
                      onClick={() => setActiveId(c.id)}
                    >
                      <div className="ms-0">
                        <div className="fw-semibold">{c.contactName}</div>
                        <div className="text-muted small">{c.equipment}</div>
                        <div className="text-muted small">{last?.text?.slice(0, 40) || "No messages yet"}</div>
                      </div>
                      {c.unread > 0 && <span className="badge bg-warning text-dark">{c.unread}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right chat panel */}
        <div className="col-lg-8">
          <div className="card h-100">
            {!activeThread ? (
              <div className="card-body d-flex align-items-center justify-content-center text-muted">
                Select a contact to start chatting.
              </div>
            ) : (
              <>
                <div className="card-header bg-white d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold">{activeThread.contactName}</div>
                    <div className="text-muted small">{activeThread.equipment}</div>
                  </div>
                  <span className="badge bg-success">Online</span>
                </div>
                <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                  {activeThread.messages.length === 0 && (
                    <div className="text-muted small">No messages yet. Say hello!</div>
                  )}
                  {activeThread.messages.map((m, idx) => {
                    const isMine = m.from === ownerId;
                    return (
                      <div
                        key={idx}
                        className={`d-flex ${isMine ? "justify-content-end" : "justify-content-start"} mb-2`}
                      >
                        <div
                          className={`p-2 rounded-3 ${isMine ? "bg-primary text-white" : "bg-light text-dark"}`}
                          style={{ maxWidth: "70%" }}
                        >
                          <div className="small mb-1 text-muted">{m.fromName || (isMine ? "You" : activeThread.contactName)}</div>
                          <div>{m.text}</div>
                          <div className="text-muted small mt-1">{new Date(m.at).toLocaleString()}</div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                <div className="card-footer bg-white">
                  <div className="input-group">
                    <textarea
                      className="form-control"
                      rows={1}
                      placeholder="Type a message"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button className="btn btn-warning" onClick={sendMessage}>
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerMessages;
