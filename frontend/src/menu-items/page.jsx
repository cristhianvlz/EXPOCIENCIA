import { LogoutOutlined, ProfileOutlined } from '@ant-design/icons';

// icons
const icons = {
  LogoutOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const pages = {
  id: 'authentication',
  title: 'Sesión',
  type: 'group',
  children: [
    {
      id: 'logout',
      title: 'Cerrar Sesión',
      type: 'item',
      url: '',
      icon: icons.LogoutOutlined,
      target: false
    }
  ]
};

export default pages;
