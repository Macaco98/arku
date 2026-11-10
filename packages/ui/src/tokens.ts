import figma from '../tokens/figma-variables.json';

/**
 * Tokens de Arku. Fuente única: las variables de Figma exportadas en
 * tokens/figma-variables.json. Los nombres siguen los de Figma.
 */
type Primitive = keyof typeof figma.vars.Primitivos;
type SemanticName = keyof typeof figma.vars.Color;

export const palette = figma.vars.Primitivos as Record<Primitive, string>;

function resolveSemantic(): Record<SemanticName, string> {
  const out = {} as Record<SemanticName, string>;
  for (const [name, value] of Object.entries(figma.vars.Color) as [SemanticName, { alias: string }][]) {
    const hex = palette[value.alias as Primitive];
    if (!hex) throw new Error(`Token sin resolver: ${name} → ${value.alias}`);
    out[name] = hex;
  }
  return out;
}

/** Colores semánticos, p. ej. color['bg/canvas'] o color['action/primary']. */
export const color = resolveSemantic();

const v = figma.vars;
export const space = {
  xs: v.Espaciado['space/xs'],
  sm: v.Espaciado['space/sm'],
  md: v.Espaciado['space/md'],
  lg: v.Espaciado['space/lg'],
  xl: v.Espaciado['space/xl'],
  '2xl': v.Espaciado['space/2xl'],
  '3xl': v.Espaciado['space/3xl'],
} as const;

/** Área táctil mínima (WCAG / guías de plataforma). */
export const touchMin = v.Espaciado['size/touch-min'];

export const radius = {
  sm: v.Radio['radius/sm'],
  md: v.Radio['radius/md'],
  lg: v.Radio['radius/lg'],
  xl: v.Radio['radius/xl'],
  full: v.Radio['radius/full'],
} as const;

export const fontFamily = v['Tipografía']['font/family'];

/** Nombres de las fuentes cargadas con @expo-google-fonts/plus-jakarta-sans. */
export const fontFiles = {
  Regular: 'PlusJakartaSans_400Regular',
  Medium: 'PlusJakartaSans_500Medium',
  SemiBold: 'PlusJakartaSans_600SemiBold',
  Bold: 'PlusJakartaSans_700Bold',
} as const;

export type TextStyleName =
  | 'Display/32'
  | 'Heading/24'
  | 'Title/20'
  | 'Body/16'
  | 'Body/16 Strong'
  | 'Body/14'
  | 'Label/14'
  | 'Caption/12';

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
}

/** Estilos de texto de Figma, listos para StyleSheet de React Native. */
export const text = Object.fromEntries(
  figma.styles.map((s) => [
    s.name,
    {
      fontFamily: fontFiles[s.weight as keyof typeof fontFiles],
      fontSize: s.size,
      lineHeight: s.lh,
    },
  ]),
) as Record<TextStyleName, TextStyleToken>;

/** Sombras Elevación/1–3 en formato React Native (boxShadow). */
export const elevation = Object.fromEntries(
  figma.effects.map((e, i) => {
    const alpha = Math.round(e.opacity * 255).toString(16).padStart(2, '0');
    return [i + 1, `0px ${e.y}px ${e.radius}px 0px ${e.color}${alpha}`];
  }),
) as Record<1 | 2 | 3, string>;
