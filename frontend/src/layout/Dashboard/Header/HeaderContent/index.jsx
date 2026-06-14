// material-ui
import useMediaQuery from '@mui/material/useMediaQuery';
import IconButton from '@mui/material/IconButton';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import { useColorScheme } from '@mui/material/styles';

// project imports
import Search from './Search';
import Profile from './Profile';
import MobileSection from './MobileSection';

// project import
import { GithubOutlined, MoonOutlined, SunOutlined } from '@ant-design/icons';

// ==============================|| HEADER - CONTENT ||============================== //

export default function HeaderContent() {
  const downLG = useMediaQuery((theme) => theme.breakpoints.down('lg'));
  const { mode, setMode } = useColorScheme();

  return (
    <>
      {!downLG && <Search />}
      {downLG && <Box sx={{ width: '100%', ml: 1 }} />}

      <IconButton
        disableRipple
        color="secondary"
        title="Toggle Dark Mode"
        sx={{ color: 'text.primary', bgcolor: 'grey.100', ml: 1 }}
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
      >
        {mode === 'dark' ? <SunOutlined /> : <MoonOutlined />}
      </IconButton>

      {!downLG && <Profile />}
      {downLG && <MobileSection />}
    </>
  );
}
