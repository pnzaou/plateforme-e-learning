import { useSelector } from "react-redux"
import { Navigate } from "react-router"

function PublicRoute({ children }) {
  const authUser = useSelector((state) => state.auth.userData)

  if (authUser) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default PublicRoute