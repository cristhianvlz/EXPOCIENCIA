import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'contexts/AuthContext';

export default function PermissionGuard({ code, children }) {
  const { hasPermission } = useAuth();

  if (!hasPermission(code)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

PermissionGuard.propTypes = {
  code: PropTypes.string,
  children: PropTypes.node
};
