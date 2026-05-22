import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { readStoredUser } from "../utils/authApi";

const MainLayout = () => {
  const user = readStoredUser();

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
