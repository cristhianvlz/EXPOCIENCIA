// material-ui
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <Stack
      direction="row"
      sx={{ alignItems: 'center', justifyContent: 'center', p: '24px 16px 24px', mt: 'auto' }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
        &copy; {currentYear} Universidad Autónoma Gabriel René Moreno
      </Typography>
    </Stack>
  );
}
