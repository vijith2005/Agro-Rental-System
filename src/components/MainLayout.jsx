import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

const getCurrentUser = () =>
  JSON.parse(localStorage.getItem("currentUser")) ||
  JSON.parse(sessionStorage.getItem("currentUser")) ||
  null;

const MainLayout = () => {
  const user = getCurrentUser();

  return (
    <div className="agr-shell">
      <Sidebar user={user} />
      <main className="agr-main motion-page">
        <Outlet />
      </main>
    </div>
  );
};

export default MainLayout;
