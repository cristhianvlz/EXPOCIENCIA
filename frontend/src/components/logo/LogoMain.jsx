// assets
import uagrmLogo from 'assets/images/uagrm-logo.png';

export default function LogoMain() {
  return (
    <img
      src={uagrmLogo}
      alt="UAGRM"
      style={{
        height: 42,
        objectFit: 'contain',
        filter:
          'drop-shadow(0 0 6px rgba(255,255,255,0.35)) drop-shadow(0 2px 14px rgba(0,0,0,0.5))',
        transition: 'filter 0.3s ease'
      }}
    />
  );
}
