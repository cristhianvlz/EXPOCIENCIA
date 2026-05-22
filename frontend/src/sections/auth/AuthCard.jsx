import PropTypes from 'prop-types';

// material-ui
import Box from '@mui/material/Box';

// ==============================|| AUTHENTICATION - CARD WRAPPER (REDESIGNED) ||============================== //

export default function AuthCard({ children, ...other }) {
  return (
    <Box
      sx={{
        width: '100%',
        borderRadius: 4,
        background: 'rgba(255, 255, 255, 0.07)',
        backdropFilter: 'blur(24px)',
        border: '1px solid rgba(255,255,255,0.14)',
        boxShadow: '0 32px 64px rgba(0,0,0,0.35)',
        p: { xs: 3, sm: 4 }
      }}
      {...other}
    >
      {children}
    </Box>
  );
}

AuthCard.propTypes = { children: PropTypes.any, other: PropTypes.any };
