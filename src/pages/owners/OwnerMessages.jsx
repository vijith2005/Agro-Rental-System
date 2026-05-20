import React from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import RentalMessagesInbox from "../../components/RentalMessagesInbox";

const OwnerMessages = () => (
  <RentalMessagesInbox
    role="owner"
    pageTitle="Messages"
    pageSubtitle="Review conversations from your active rentals."
    backLink="/owner"
    backLabel="Back to dashboard"
    emptyTitle="No conversation selected"
    emptyCopy="Your owner conversations will appear here once renters start chatting."
  />
);

export default OwnerMessages;
