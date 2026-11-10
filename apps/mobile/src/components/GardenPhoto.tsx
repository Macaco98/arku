import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/**
 * Ilustración de jardín (Figma › GardenPhoto). Se usa como miniatura mientras
 * las fotos privadas no se muestran en la lista. No es una foto real del cliente.
 */
export function GardenPhoto({ size = 72 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 106 106" accessible={false}>
      <Defs>
        <LinearGradient id="sky" x1="53" y1="0" x2="53" y2="106" gradientUnits="userSpaceOnUse">
          <Stop stopColor="#CFE6C4" />
          <Stop offset="1" stopColor="#6FA36A" />
        </LinearGradient>
      </Defs>
      <Rect width="106" height="106" fill="url(#sky)" />
      <Rect y="60" width="106" height="46" fill="#6FA36A" />
      <Circle cx="25" cy="47" r="17" fill="#2F6B4F" />
      <Circle cx="84" cy="54" r="14" fill="#2F6B4F" />
    </Svg>
  );
}
