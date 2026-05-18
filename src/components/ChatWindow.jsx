import React from "react";
import { Card, Form, Button } from "react-bootstrap";

const ChatWindow = ({ messages = [] }) => {
  return (
    <Card className="chat-window shadow-sm">
      <Card.Body className="d-flex flex-column gap-3">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="text-muted small">Start a conversation with the owner.</div>
          )}
          {messages.map((msg, idx) => (
            <div
              key={`${msg.sender}-${idx}`}
              className={`chat-bubble ${msg.sender === "me" ? "from-me" : "from-owner"}`}
            >
              <div className="fw-semibold small mb-1">{msg.name}</div>
              <div className="small">{msg.text}</div>
              <div className="text-muted small mt-1">{msg.time}</div>
            </div>
          ))}
        </div>
        <Form className="d-flex gap-2">
          <Form.Control type="text" placeholder="Type a message" />
          <Button variant="success">Send</Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default ChatWindow;
