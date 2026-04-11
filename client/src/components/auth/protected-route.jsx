import { useSelector } from "react-redux"
import { Navigate } from "react-router"

function ProtectedRoute({ children }) {
  const authUser = useSelector((state) => state.auth.userData)
  console.log(authUser)

  if (!authUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute