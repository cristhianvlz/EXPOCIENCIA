// assets
import uagrmLogo from 'assets/images/uagrm-logo.png';

// ==============================|| LOGO ICONO UAGRM ||============================== //

export default function LogoIcon() {
  return (
    <img
      src={uagrmLogo}
      alt="UAGRM"
      style={{ height: 36, width: 36, objectFit: 'contain' }}
    />
  );
}
