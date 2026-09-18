import {
  Cloud,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from '@phosphor-icons/react';

function pick(id, night) {
  if (id >= 200 && id < 300) return { C: CloudLightning, sunny: false };
  if (id >= 300 && id < 600) return { C: CloudRain, sunny: false };
  if (id >= 600 && id < 700) return { C: CloudSnow, sunny: false };
  if (id >= 700 && id < 800) return { C: CloudFog, sunny: false };
  if (id === 800) return { C: night ? Moon : Sun, sunny: !night };
  if (id === 801) return { C: night ? CloudMoon : CloudSun, sunny: !night };
  return { C: Cloud, sunny: false };
}

/**
 * Day/night-aware vector condition icon.
 * id = OpenWeatherMap condition code, icon = OWM icon code (e.g. '10d').
 */
export default function WeatherIcon({ id, icon, size = 42, weight = 'regular', className = '', alt = '' }) {
  const night = typeof icon === 'string' && icon.endsWith('n');
  const { C, sunny } = pick(typeof id === 'number' ? id : 800, night);
  const cls = `${className}${sunny ? ' wicon-sun' : ''}`.trim();
  return <C size={size} weight={weight} className={cls || undefined} alt={alt} aria-hidden={alt ? undefined : true} />;
}
