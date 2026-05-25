import React from "react";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import RentalMessagesInbox from "../../components/RentalMessagesInbox";

const Messages = () => (
  <RentalMessagesInbox
    role="farmer"
    pageTitle="Messages"
    pageSubtitle="Chat with owners attached to your rentals."
    backLink="/farmer/bookings"
    backLabel="Back to bookings"
    emptyTitle="No conversation selected"
    emptyCopy="Your conversations will appear here once you have a rental to discuss with the owner."
  />
);

export default Messages;
