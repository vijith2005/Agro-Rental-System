export const formatAddressLine = (profile) => {
  const parts = [profile?.address, profile?.district, profile?.state]
    .map((value) => (value || "").toString().trim())
    .filter(Boolean);

  return parts.join(", ");
};

export const getOwnerPickupLocation = (rental) =>
  rental?.pickupLocation ||
  rental?.schedule?.pickupLocation ||
  rental?.ownerLocation ||
  rental?.location ||
  "Owner location";

export const getFarmerDropLocation = (rental) =>
  rental?.deliveryLocation ||
  rental?.schedule?.deliveryLocation ||
  rental?.farmerLocation ||
  "Farmer address";

export const buildOwnerPickupRequestText = (rental) =>
  `Delivery request: please release ${rental?.equipmentName || "the equipment"} from the owner pickup point at ${
    getOwnerPickupLocation(rental)
  } for rental ${rental?.id || "N/A"}.`;

export const buildFarmerDropRequestText = (rental) =>
  `Delivery request: please confirm drop-off of ${rental?.equipmentName || "the equipment"} at ${
    getFarmerDropLocation(rental)
  } for rental ${rental?.id || "N/A"}.`;

export const buildReturnPickupRequestText = (rental) =>
  `Return pickup request: please collect ${rental?.equipmentName || "the equipment"} from the farmer at ${
    getFarmerDropLocation(rental)
  } and return it to the owner pickup point at ${getOwnerPickupLocation(rental)} for rental ${
    rental?.id || "N/A"
  }.`;
