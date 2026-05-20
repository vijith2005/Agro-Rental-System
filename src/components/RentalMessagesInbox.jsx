import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getApiErrorMessage } from "../api/http";
import { getRentalMessages, listRentalsByFarmer, listRentalsByOwner, sendRentalMessage } from "../api/rentalApi";
import { getCurrentUser } from "../utils/session";
import {
  buildChatThread,
  clearUnreadForRole,
  getThreadPreview,
  getThreadStamp,
  normalizeChatMessage,
  readChatThreads,
  writeChatThreads,
} from "../utils/chatThreads";

const formatStamp = (value) => {
  if (!value) return "Awaiting reply";

  const stamp = new Date(value);
  if (Number.isNaN(stamp.getTime())) return "Awaiting reply";

  return stamp.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const RentalMessagesInbox = ({
  role,
  pageTitle,
  pageSubtitle,
  backLink,
  backLabel,
  emptyTitle,
  emptyCopy,
}) => {
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.email || `${role}@demo.com`;
  const currentUserName =
    currentUser?.name || currentUser?.email?.split("@")[0] || (role === "owner" ? "Owner" : "Farmer");
  const isOwnerView = role === "owner";
  const [searchParams, setSearchParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [selectedRentalId, setSelectedRentalId] = useState(searchParams.get("rentalId") || "");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [connectionState, setConnectionState] = useState("loading");
  const bottomRef = useRef(null);

  const loadThreads = async () => {
    setLoading(true);
    setError("");
    setConnectionState("loading");

    try {
      const rentals = isOwnerView
        ? await listRentalsByOwner(currentUserId)
        : await listRentalsByFarmer(currentUserId);
      const rentalList = Array.isArray(rentals) ? rentals : [];
      const cachedThreads = readChatThreads();
      const cachedLookup = new Map(
        cachedThreads
          .filter((thread) => (isOwnerView ? thread.ownerId === currentUserId : thread.farmerId === currentUserId))
          .map((thread) => [thread.id, thread])
      );

      const nextThreads = await Promise.all(
        rentalList.map(async (rental) => {
          const cachedThread = cachedLookup.get(rental.id) || null;
          try {
            const messages = await getRentalMessages(rental.id);
            return buildChatThread(rental, role, Array.isArray(messages) ? messages : [], cachedThread);
          } catch {
            return buildChatThread(rental, role, cachedThread?.messages || [], cachedThread);
          }
        })
      );

      const sortedThreads = [...nextThreads].sort((left, right) => {
        const leftStamp = getThreadStamp(left);
        const rightStamp = getThreadStamp(right);
        return (rightStamp ? new Date(rightStamp).getTime() : 0) - (leftStamp ? new Date(leftStamp).getTime() : 0);
      });

      setThreads(sortedThreads);
      writeChatThreads(sortedThreads);
      setConnectionState("live");

      const requestedRentalId = searchParams.get("rentalId");
      const nextSelected =
        (requestedRentalId && sortedThreads.some((thread) => thread.id === requestedRentalId)
          ? requestedRentalId
          : null) || sortedThreads[0]?.id || "";

      setSelectedRentalId(nextSelected);
    } catch {
      const cachedThreads = readChatThreads().filter((thread) =>
        isOwnerView ? thread.ownerId === currentUserId : thread.farmerId === currentUserId
      );

      if (cachedThreads.length > 0) {
        setThreads(cachedThreads);
        const requestedRentalId = searchParams.get("rentalId");
        setSelectedRentalId(
          (requestedRentalId && cachedThreads.some((thread) => thread.id === requestedRentalId)
            ? requestedRentalId
            : null) || cachedThreads[0]?.id || ""
        );
        setConnectionState("cached");
        setError("Using cached conversations because the chat service is unavailable.");
      } else {
        setThreads([]);
        setSelectedRentalId("");
        setConnectionState("offline");
        setError("Using cached conversations because the chat service is unavailable.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId, role]);

  useEffect(() => {
    if (!threads.length || !selectedRentalId) return;

    const activeThread = threads.find((thread) => thread.id === selectedRentalId);
    if (!activeThread) return;

    const nextThreads = threads.map((thread) =>
      thread.id === selectedRentalId ? clearUnreadForRole(thread, role) : thread
    );

    const changed = nextThreads.some((thread, index) => thread !== threads[index]);
    if (changed) {
      setThreads(nextThreads);
      writeChatThreads(nextThreads);
    }
  }, [role, selectedRentalId, threads]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedRentalId, threads]);

  useEffect(() => {
    const requestedRentalId = searchParams.get("rentalId") || "";
    if (
      requestedRentalId &&
      requestedRentalId !== selectedRentalId &&
      threads.some((thread) => thread.id === requestedRentalId)
    ) {
      setSelectedRentalId(requestedRentalId);
    }
  }, [searchParams, selectedRentalId, threads]);

  const selectedThread = threads.find((thread) => thread.id === selectedRentalId) || null;

  const filteredThreads = useMemo(() => {
    const term = search.toLowerCase();

    return threads.filter((thread) => {
      const haystack = [
        thread.contactName,
        thread.equipmentName,
        thread.status,
        getThreadPreview(thread),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [search, threads]);

  const openThread = (threadId) => {
    setSelectedRentalId(threadId);
    const next = new URLSearchParams(searchParams);
    next.set("rentalId", threadId);
    setSearchParams(next, { replace: true });
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !selectedThread || sending) return;

    const optimisticMessage = {
      id: `msg-${Date.now()}`,
      rentalId: selectedThread.id,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: role.toUpperCase(),
      text,
      createdAt: new Date().toISOString(),
    };

    setSending(true);
    setError("");

    try {
      const response = await sendRentalMessage({
        rentalId: selectedThread.id,
        text,
      });

      const persistedMessage = normalizeChatMessage(response);
      const nextThreads = threads.map((thread) => {
        if (thread.id !== selectedThread.id) return thread;

        return {
          ...thread,
          messages: [...(thread.messages || []), persistedMessage],
          unreadForFarmer: role === "farmer" ? thread.unreadForFarmer || 0 : (thread.unreadForFarmer || 0) + 1,
          unreadForOwner: role === "owner" ? thread.unreadForOwner || 0 : (thread.unreadForOwner || 0) + 1,
        };
      });

      setThreads(nextThreads);
      writeChatThreads(nextThreads);
      setConnectionState("live");
      setDraft("");
    } catch (error) {
      const apiMessage = getApiErrorMessage(error, "Unable to send message right now.");
      const isNetworkError = !error?.response || error?.message === "Network Error";
      const isMissingThread =
        error?.response?.status === 404 || /resource not found/i.test(apiMessage);

      if (!isNetworkError && !isMissingThread) {
        setConnectionState("live");
        setError(apiMessage);
        return;
      }

      const nextThreads = threads.map((thread) => {
        if (thread.id !== selectedThread.id) return thread;

        return {
          ...thread,
          messages: [...(thread.messages || []), optimisticMessage],
          unreadForFarmer: role === "farmer" ? thread.unreadForFarmer || 0 : (thread.unreadForFarmer || 0) + 1,
          unreadForOwner: role === "owner" ? thread.unreadForOwner || 0 : (thread.unreadForOwner || 0) + 1,
        };
      });

      setThreads(nextThreads);
      writeChatThreads(nextThreads);
      setConnectionState("cached");
      setError("");
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  const activeMessages = selectedThread?.messages || [];

  return (
    <div className={isOwnerView ? "agr-page owner-dashboard" : "agr-page"}>
      <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
        <div>
          <h2 className="agr-h1 mb-1">{pageTitle}</h2>
          <p className="text-muted mb-0">{pageSubtitle}</p>
        </div>
        {backLink && (
          <Link to={backLink} className="btn btn-outline-primary">
            {backLabel}
          </Link>
        )}
      </div>

      {error && <div className={`alert mb-3 ${connectionState === "offline" ? "alert-danger" : "alert-warning"}`}>{error}</div>}

      <div className="row g-3">
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header bg-white d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-bold">Conversations</div>
                <div className="text-muted small">{isOwnerView ? "Owner inbox" : "Farmer inbox"}</div>
              </div>
              <span className={`badge ${connectionState === "live" ? "bg-success" : "bg-secondary"}`}>
                {connectionState === "live" ? "Live" : connectionState === "cached" ? "Cached" : "Offline"}
              </span>
            </div>
            <div className="card-body p-0">
              <div className="p-3 border-bottom">
                <input
                  type="search"
                  className="form-control"
                  placeholder="Search by owner, farmer or equipment"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>

              <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
                {loading ? (
                  <div className="p-3 text-muted">Loading conversations...</div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-3 text-muted">{emptyCopy}</div>
                ) : (
                  filteredThreads.map((thread) => {
                    const lastMessage = thread.messages[thread.messages.length - 1];
                    const unread = isOwnerView ? thread.unreadForOwner || 0 : thread.unreadForFarmer || 0;
                    const isActive = thread.id === selectedRentalId;

                    return (
                      <button
                        key={thread.id}
                        type="button"
                        className={`list-group-item list-group-item-action border-0 rounded-0 p-3 text-start ${
                          isActive ? "bg-light" : ""
                        }`}
                        onClick={() => openThread(thread.id)}
                      >
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{thread.contactName}</div>
                            <div className="text-muted small text-truncate">{thread.equipmentName}</div>
                            <div className="text-muted small text-truncate">{lastMessage?.text || "No messages yet"}</div>
                          </div>
                          <div className="text-end flex-shrink-0">
                            <div className="text-muted small">{formatStamp(getThreadStamp(thread))}</div>
                            {unread > 0 && <span className="badge bg-warning text-dark mt-1">{unread}</span>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="col-lg-8">
          <div className="card h-100">
            {!selectedThread ? (
              <div className="card-body d-flex align-items-center justify-content-center text-muted">
                {loading ? "Loading thread..." : emptyTitle}
              </div>
            ) : (
              <>
                <div className="card-header bg-white d-flex align-items-center justify-content-between gap-2">
                  <div>
                    <div className="fw-bold">{selectedThread.contactName}</div>
                    <div className="text-muted small">{selectedThread.equipmentName}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <span className={`badge ${connectionState === "live" ? "bg-success" : "bg-secondary"}`}>
                      {connectionState === "live" ? "Live" : "Cached"}
                    </span>
                    <Link
                      to={`${isOwnerView ? "/owner" : "/farmer"}/messages?rentalId=${encodeURIComponent(selectedThread.id)}`}
                      className="btn btn-outline-primary btn-sm"
                    >
                      Open thread
                    </Link>
                  </div>
                </div>
                <div className="card-body" style={{ height: "55vh", overflowY: "auto" }}>
                  {activeMessages.length === 0 ? (
                    <div className="text-muted small">No messages yet. Say hello!</div>
                  ) : (
                    activeMessages.map((message) => {
                      const senderRole = (message.senderRole || message.from || "").toLowerCase();
                      const isMine = senderRole === role || message.senderId === currentUserId;

                      return (
                        <div
                          key={message.id}
                          className={`d-flex mb-3 ${isMine ? "justify-content-end" : "justify-content-start"}`}
                        >
                          <div
                            className={`p-2 rounded-3 ${isMine ? "bg-primary text-white" : "bg-light text-dark"}`}
                            style={{ maxWidth: "70%", minWidth: "180px" }}
                          >
                            <div className="small mb-1 text-muted">
                              {isMine ? "You" : message.senderName || selectedThread.contactName}
                            </div>
                            <div>{message.text}</div>
                            <div className="text-muted small mt-1">
                              {new Date(message.createdAt || message.at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>
                <div className="card-footer bg-white">
                  <div className="d-flex gap-2">
                    <input
                      className="form-control"
                      type="text"
                      placeholder="Type a message"
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !event.shiftKey) {
                          event.preventDefault();
                          sendMessage();
                        }
                      }}
                    />
                    <button className="btn btn-warning" onClick={sendMessage} disabled={sending}>
                      {sending ? "Sending..." : "Send"}
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

export default RentalMessagesInbox;
