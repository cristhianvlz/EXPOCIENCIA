import PropTypes from 'prop-types';
import { Navigate } from 'react-router-dom';

// ==============================|| GUEST GUARD ||============================== //

export default function GuestGuard({ children }) {
  const token = localStorage.getItem('token');

  if (token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

GuestGuard.propTypes = {
  children: PropTypes.node
};
