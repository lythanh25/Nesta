import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminLoggedIn } from "../../utils/adminAuth";

function RequireAdmin() {
  const location = useLocation();

  if (!isAdminLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default RequireAdmin;
