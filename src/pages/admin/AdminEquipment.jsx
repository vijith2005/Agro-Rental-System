import React, { useEffect, useMemo, useState } from "react";
import PaginationControls from "../../components/PaginationControls";
import "../../styles/FarmerDashboard.css";
import "../../styles/FarmerModules.css";
import { listEquipment } from "../../api/equipmentApi";
import { getStored, setStored, STORAGE_KEYS } from "../../utils/storage";
import { EQUIPMENT_UPDATED_EVENT } from "../../utils/equipmentEvents";

const PAGE_SIZE = 6;

const AdminEquipment = () => {
  const [items, setItems] = useState(() => getStored(STORAGE_KEYS.equipments, []));
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;

    const loadEquipment = async () => {
      try {
        const data = await listEquipment({ page: 0, size: 100 });
        const content = data?.content || [];
        if (!active) return;
        setItems(content);
        setStored(STORAGE_KEYS.equipments, content);
        setLoadError("");
      } catch {
        if (active) {
          setLoadError("Showing cached equipment because the backend is unavailable.");
        }
      }
    };

    loadEquipment();
    const handleEquipmentUpdated = () => {
      loadEquipment();
    };

    window.addEventListener(EQUIPMENT_UPDATED_EVENT, handleEquipmentUpdated);
    return () => {
      active = false;
      window.removeEventListener(EQUIPMENT_UPDATED_EVENT, handleEquipmentUpdated);
    };
  }, []);

  const mappedItems = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        name: item.name,
        owner: item.ownerName || item.ownerId || "Unknown",
        status: item.status || (item.available ? "AVAILABLE" : "INACTIVE"),
      })),
    [items]
  );

  const totalPages = Math.max(1, Math.ceil(mappedItems.length / PAGE_SIZE));
  const pageItems = mappedItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, totalPages));
  }, [totalPages]);

  return (
    <div className="agr-page admin-dashboard motion-page">
      <div className="page-header">
        <div>
          <div className="page-title">Equipment Verification</div>
          <div className="page-subtitle">Review and approve listed equipment.</div>
        </div>
      </div>

      {loadError && <div className="alert alert-warning mb-3">{loadError}</div>}

      <div className="list-shell">
        <div className="list-grid">
          {pageItems.map((item) => (
            <div key={item.id} className="list-card">
              <div>
                <div className="equipment-name">{item.name}</div>
                <div className="list-meta">
                  {item.id} • Owner: {item.owner}
                </div>
              </div>
              <span
                className={`status-pill ${
                  item.status === "AVAILABLE"
                    ? "status-approved"
                    : item.status === "RESERVED"
                    ? "status-requested"
                    : "status-pending"
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <PaginationControls
          currentPage={page}
          totalPages={totalPages}
          totalItems={mappedItems.length}
          pageSize={PAGE_SIZE}
          itemLabel="equipment items"
          onPageChange={setPage}
        />
      </div>
    </div>
  );
};

export default AdminEquipment;
