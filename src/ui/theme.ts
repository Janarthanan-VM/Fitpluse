/** Design tokens from the PRD, adjusted so every text pairing meets WCAG 2.2 AA. */
export const colors = {
  navy: '#122338',
  navyRaised: '#1C3350',
  accent: '#35C982', // fill only, always with navy text
  accentPressed: '#2AB271',
  accentStrong: '#1A7F4F', // progress, charts, text on white
  bg: '#FFFFFF',
  soft: '#F3F6F8',
  line: '#DCE3E9',
  text: '#122338',
  muted: '#55657A',
  onDarkMuted: '#A9B6C4',
  disabledBg: '#E3E8ED',
  disabledText: '#5F6E80',
  pause: '#FFD27A',
  success: { bg: '#E3F6EC', fg: '#1A6B44' },
  warning: { bg: '#FFF4DE', fg: '#6E4100' },
  error: { bg: '#FDECEA', fg: '#B42318' },
  info: { bg: '#E8F0FB', fg: '#183F73' },
};

export const radius = { sm: 8, md: 12, lg: 16, xl: 20 };
export const space = (n: number) => n * 8;

export const type = {
  title: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4, color: colors.text },
  section: { fontSize: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 16, color: colors.text, lineHeight: 23 },
  caption: { fontSize: 13, color: colors.muted, fontWeight: '600' as const },
  eyebrow: { fontSize: 13, color: colors.muted, fontWeight: '700' as const, letterSpacing: 0.4, textTransform: 'uppercase' as const },
  num: { fontVariant: ['tabular-nums' as const] },
};
