import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

// ==============================|| AUTH GUARD ||============================== //

export default function AuthGuard({ children }) {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

AuthGuard.propTypes = {
  children: PropTypes.node
};
