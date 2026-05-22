import PropTypes from 'prop-types';
import { Link, useLocation, matchPath, useNavigate } from 'react-router-dom';
import React, { useState } from 'react';

// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import { LogoutOutlined, WarningOutlined } from '@ant-design/icons';

// project imports
import IconButton from 'components/@extended/IconButton';

import { handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

export default function NavItem({ item, level, isParents = false, setSelectedID }) {
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;

  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));

  const navigate = useNavigate();
  const [openLogoutModal, setOpenLogoutModal] = useState(false);

  let itemTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const handleLogout = () => {
    localStorage.removeItem('token');
    setOpenLogoutModal(false);
    navigate('/login');
  };

  const itemHandler = () => {
    if (item.id === 'logout') {
      setOpenLogoutModal(true);
      return;
    }

    if (downLG) handlerDrawerOpen(false);

    if (isParents && setSelectedID) {
      setSelectedID(item.id);
    }
  };

  const Icon = item.icon;
  const itemIcon = item.icon ? (
    <Icon
      style={{
        fontSize: drawerOpen ? '1rem' : '1.25rem',
        ...(isParents && { fontSize: 20, stroke: '1.5' })
      }}
    />
  ) : (
    false
  );

  const { pathname } = useLocation();
  const isSelected = !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname);

  const textColor = 'text.primary';
  const iconSelectedColor = 'primary.main';

  return (
    <>
      <Box sx={{ position: 'relative' }}>
        <ListItemButton
          {...(item.id !== 'logout' && { component: Link, to: item.url, target: itemTarget })}
          disabled={item.disabled}
          selected={isSelected}
          sx={(theme) => ({
            zIndex: 1201,
            pl: drawerOpen ? `${level * 28}px` : 1.5,
            py: !drawerOpen && level === 1 ? 1.25 : 1,
            ...(item.id === 'logout' ? {
              color: 'error.main',
              bgcolor: 'error.lighter',
              mt: 1,
              '&:hover': {
                bgcolor: 'error.light',
                color: 'error.dark'
              }
            } : {
              ...(drawerOpen && {
                '&:hover': { bgcolor: 'primary.lighter' },
                '&.Mui-selected': {
                  bgcolor: 'primary.lighter',
                  borderRight: '2px solid',
                  borderColor: 'primary.main',
                  color: iconSelectedColor,
                  '&:hover': { color: iconSelectedColor, bgcolor: 'primary.lighter' }
                }
              }),
              ...(!drawerOpen && {
                '&:hover': { bgcolor: 'transparent' },
                '&.Mui-selected': { '&:hover': { bgcolor: 'transparent' }, bgcolor: 'transparent' }
              })
            })
          })}
          onClick={() => itemHandler()}
        >
          {itemIcon && (
            <ListItemIcon
              sx={(theme) => ({
                minWidth: 28,
                color: item.id === 'logout' ? 'inherit' : (isSelected ? iconSelectedColor : textColor),
                ...(!drawerOpen && {
                  borderRadius: 1.5,
                  width: 36,
                  height: 36,
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': { bgcolor: 'secondary.lighter' }
                }),
                ...(!drawerOpen &&
                  isSelected && {
                    bgcolor: 'primary.lighter',
                    '&:hover': { bgcolor: 'primary.lighter' }
                  })
              })}
            >
              {itemIcon}
            </ListItemIcon>
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && (
            <ListItemText
              primary={
                <Typography variant="h6" sx={{ color: item.id === 'logout' ? 'inherit' : (isSelected ? iconSelectedColor : textColor) }}>
                  {item.title}
                </Typography>
              }
            />
          )}
          {(drawerOpen || (!drawerOpen && level !== 1)) && item.chip && (
            <Chip
              color={item.chip.color}
              variant={item.chip.variant}
              size={item.chip.size}
              label={item.chip.label}
              avatar={item.chip.avatar && <Avatar>{item.chip.avatar}</Avatar>}
            />
          )}
        </ListItemButton>
        {(drawerOpen || (!drawerOpen && level !== 1)) &&
          item?.actions &&
          item?.actions.map((action, index) => {
            const ActionIcon = action.icon;
            const callAction = action?.function;
            return (
              <IconButton
                key={index}
                {...(action.type === 'function' && {
                  onClick: (event) => {
                    event.stopPropagation();
                    callAction();
                  }
                })}
                {...(action.type === 'link' && {
                  component: Link,
                  to: action.url,
                  target: action.target ? '_blank' : '_self'
                })}
                color="secondary"
                variant="outlined"
                sx={{
                  position: 'absolute',
                  top: 12,
                  right: 20,
                  zIndex: 1202,
                  width: 20,
                  height: 20,
                  mr: -1,
                  ml: 1,
                  color: 'secondary.dark',
                  borderColor: isSelected ? 'primary.light' : 'secondary.light',
                  '&:hover': { borderColor: isSelected ? 'primary.main' : 'secondary.main' }
                }}
              >
                <ActionIcon style={{ fontSize: '0.625rem' }} />
              </IconButton>
            );
          })}
      </Box>

      {item.id === 'logout' && (
        <Dialog
          open={openLogoutModal}
          onClose={() => setOpenLogoutModal(false)}
          aria-labelledby="logout-dialog-title"
          PaperProps={{
            sx: {
              borderRadius: 4,
              px: 1,
              py: 1,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 24px 48px rgba(0,0,0,0.18)'
            }
          }}
        >
          <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
            {/* Icono grande de advertencia */}
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 72,
                height: 72,
                borderRadius: '50%',
                bgcolor: 'error.lighter',
                mb: 2.5
              }}
            >
              <LogoutOutlined style={{ fontSize: 34, color: '#ff4d4f' }} />
            </Box>

            <Typography variant="h4" fontWeight={700} mb={1} color="text.primary">
              ¿Cerrar Sesión?
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.6 }}>
              Estás a punto de salir del sistema.<br />
              ¿Estás seguro de que deseas continuar?
            </Typography>
          </DialogContent>

          <Divider sx={{ mx: 2 }} />

          <DialogActions sx={{ px: 3, py: 2.5, gap: 1.5, justifyContent: 'center' }}>
            <Button
              onClick={() => setOpenLogoutModal(false)}
              variant="outlined"
              color="inherit"
              size="large"
              sx={{
                flex: 1,
                borderRadius: 2,
                borderColor: 'divider',
                color: 'text.secondary',
                fontWeight: 600,
                '&:hover': { borderColor: 'text.secondary', bgcolor: 'action.hover' }
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogout}
              variant="contained"
              color="error"
              size="large"
              autoFocus
              startIcon={<LogoutOutlined />}
              sx={{
                flex: 1,
                borderRadius: 2,
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%)',
                boxShadow: '0 4px 14px rgba(255, 77, 79, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #cf1322 0%, #a8071a 100%)',
                  boxShadow: '0 6px 20px rgba(255, 77, 79, 0.5)'
                }
              }}
            >
              Sí, salir
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </>
  );
}

NavItem.propTypes = {
  item: PropTypes.any,
  level: PropTypes.number,
  isParents: PropTypes.bool,
  setSelectedID: PropTypes.oneOfType([PropTypes.any, PropTypes.func])
};
