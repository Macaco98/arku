import { color, text, type TextStyleName } from '@arku/ui';
import { Text, type TextProps } from 'react-native';

interface Props extends TextProps {
  variant?: TextStyleName;
  tone?: 'primary' | 'body' | 'secondary' | 'danger' | 'success' | 'on-brand';
}

/** Texto con los estilos de Figma (Display/32 … Caption/12). */
export function AppText({ variant = 'Body/16', tone = 'body', style, ...rest }: Props) {
  return <Text {...rest} style={[text[variant], { color: color[`text/${tone}`] }, style]} />;
}
