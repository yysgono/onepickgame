import React from "react";
import { useAdmin } from "../utils/AdminContext";

function AdminOnly({ children }) {
  const { isAdmin } = useAdmin();
  if (!isAdmin) return null;
  return <>{children}</>;
}

export default AdminOnly;
