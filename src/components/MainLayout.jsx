import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { getCurrentUser } from "../utils/session";

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
