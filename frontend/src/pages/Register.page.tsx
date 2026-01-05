import { Navigate } from 'react-router-dom';

// Keep a minimal `Register` page for backwards compatibility.
// Redirect to the unified `/auth` route with `mode=register` query param.
export default function Register() {
  return <Navigate to="/auth?mode=register" replace />;
}
