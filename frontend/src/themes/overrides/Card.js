// project imports
import { withAlpha } from 'utils/colorUtils';

// ==============================|| OVERRIDES - CARD ||============================== //

export default function Card(theme) {
  return {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: `0 4px 24px 0 ${withAlpha(theme.vars.palette.grey[900], 0.04)}`,
          backgroundImage: 'none',
          border: `1px solid ${theme.vars.palette.divider}`,
          transition: 'box-shadow 0.3s ease-in-out',
          '&:hover': {
            boxShadow: `0 8px 32px 0 ${withAlpha(theme.vars.palette.grey[900], 0.08)}`
          }
        }
      }
    }
  };
}
