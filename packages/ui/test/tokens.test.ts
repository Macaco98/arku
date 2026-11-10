import { describe, expect, it } from 'vitest';
import { color, elevation, fontFamily, palette, text, touchMin } from '../src';

describe('tokens desde Figma', () => {
  it('resuelve todos los colores semánticos a hex', () => {
    for (const [name, hex] of Object.entries(color)) {
      expect(hex, name).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('mantiene la identidad de marca', () => {
    expect(palette['forest/950']).toBe('#0F2D28');
    expect(color['bg/brand-deep']).toBe('#0F2D28');
    expect(color['bg/canvas']).toBe('#FAF8F2');
    expect(fontFamily).toBe('Plus Jakarta Sans');
  });

  it('define los 8 estilos de texto con una fuente cargable', () => {
    expect(Object.keys(text)).toHaveLength(8);
    for (const style of Object.values(text)) expect(style.fontFamily).toMatch(/^PlusJakartaSans_/);
  });

  it('respeta el área táctil mínima y las elevaciones', () => {
    expect(touchMin).toBe(44);
    expect(elevation[2]).toBe('0px 4px 14px 0px #10342D1a');
  });
});
