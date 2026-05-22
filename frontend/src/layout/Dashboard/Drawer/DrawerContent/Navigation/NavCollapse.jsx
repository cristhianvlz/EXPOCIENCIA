import PropTypes from 'prop-types';
import { useState } from 'react';
import { useLocation, matchPath } from 'react-router-dom';

// material-ui
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';

// project import
import NavItem from './NavItem';
import { useGetMenuMaster } from 'api/menu';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { useAuth } from 'contexts/AuthContext';

export default function NavCollapse({ menu, level }) {
  const theme = useTheme();
  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const { hasPermission } = useAuth();

  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen(!open);
  };

  const { pathname } = useLocation();

  const visibleChildren = menu.children?.filter((item) => hasPermission(item.permission));

  const isSelected = visibleChildren?.some((item) => !!matchPath({ path: item?.link ? item.link : item.url, end: false }, pathname));

  if (!visibleChildren || visibleChildren.length === 0) return null;

  const Icon = menu.icon;
  const menuIcon = menu.icon ? (
    <Icon style={{ fontSize: drawerOpen ? '1rem' : '1.25rem' }} />
  ) : (
    false
  );

  const textColor = 'text.primary';
  const iconSelectedColor = 'primary.main';

  const navCollapse = visibleChildren.map((item) => {
    switch (item.type) {
      case 'item':
        return <NavItem key={item.id} item={item} level={level + 1} />;
      default:
        return (
          <Typography key={item.id} variant="h6" color="error" align="center">
            Fix - Collapse Item
          </Typography>
        );
    }
  });

  return (
    <>
      <ListItemButton
        disableRipple
        selected={isSelected}
        onClick={handleClick}
        sx={{
          zIndex: 1201,
          pl: drawerOpen ? `${level * 28}px` : 1.5,
          py: !drawerOpen && level === 1 ? 1.25 : 1,
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
        }}
      >
        {menuIcon && (
          <ListItemIcon
            sx={{
              minWidth: 28,
              color: isSelected ? iconSelectedColor : textColor,
              ...(!drawerOpen && {
                borderRadius: 1.5,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
                '&:hover': { bgcolor: 'secondary.lighter' }
              })
            }}
          >
            {menuIcon}
          </ListItemIcon>
        )}
        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          <ListItemText
            primary={
              <Typography variant="h6" sx={{ color: isSelected ? iconSelectedColor : textColor }}>
                {menu.title}
              </Typography>
            }
          />
        )}
        {(drawerOpen || (!drawerOpen && level !== 1)) && (
          open ? <UpOutlined style={{ fontSize: '0.625rem', marginLeft: 1, color: theme.palette.secondary.main }} /> : <DownOutlined style={{ fontSize: '0.625rem', marginLeft: 1, color: theme.palette.secondary.main }} />
        )}
      </ListItemButton>
      <Collapse in={open} timeout="auto" unmountOnExit>
        <List component="div" disablePadding sx={{ position: 'relative', '&:after': { content: '""', position: 'absolute', left: '32px', top: 0, height: '100%', width: '1px', opacity: 1, background: theme.palette.primary.light } }}>
          {navCollapse}
        </List>
      </Collapse>
    </>
  );
}

NavCollapse.propTypes = {
  menu: PropTypes.object,
  level: PropTypes.number
};
