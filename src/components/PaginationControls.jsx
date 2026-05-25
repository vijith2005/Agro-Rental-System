import React from "react";
import { Pagination } from "react-bootstrap";

const buildVisiblePages = (currentPage, totalPages, windowSize = 5) => {
  if (totalPages <= windowSize) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const halfWindow = Math.floor(windowSize / 2);
  let start = Math.max(1, currentPage - halfWindow);
  let end = Math.min(totalPages, start + windowSize - 1);

  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }

  const pages = [];

  if (start > 1) {
    pages.push(1);
    if (start > 2) {
      pages.push("ellipsis-start");
    }
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages) {
    if (end < totalPages - 1) {
      pages.push("ellipsis-end");
    }
    pages.push(totalPages);
  }

  return pages;
};

const PaginationControls = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = "items",
  className = "",
}) => {
  if (!totalItems || totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);
  const pages = buildVisiblePages(currentPage, totalPages);

  return (
    <div className={`d-flex flex-wrap justify-content-between align-items-center gap-2 mt-3 ${className}`.trim()}>
      <div className="text-muted small">
        Showing {startItem}-{endItem} of {totalItems} {itemLabel}
      </div>
      <Pagination className="mb-0 flex-wrap">
        <Pagination.Prev disabled={currentPage === 1} onClick={() => onPageChange(Math.max(1, currentPage - 1))} />
        {pages.map((page) =>
          page === "ellipsis-start" || page === "ellipsis-end" ? (
            <Pagination.Ellipsis key={page} disabled />
          ) : (
            <Pagination.Item
              key={page}
              active={currentPage === page}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Pagination.Item>
          )
        )}
        <Pagination.Next
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        />
      </Pagination>
    </div>
  );
};

export default PaginationControls;
