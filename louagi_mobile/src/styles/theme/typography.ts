// 📁 src/styles/theme/typography.ts
export const typography = {
  // Font Sizes
  fontSize: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 20,
    xxxl: 24,
    huge: 28,
    massive: 32,
    giant: 36,
  },
  
  // Font Weights  
  fontWeight: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
  
  // Line Heights
  lineHeight: {
    tight: 16,
    normal: 20,
    relaxed: 24,
    loose: 28,
  },
  
  // Text Styles (Complete style objects)
  heading1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 32,
    color: '#333',
  },
  
  heading2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 28,
    color: '#333',
  },
  
  heading3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
    color: '#333',
  },
  
  heading4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
    color: '#333',
  },
  
  subtitle1: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 20,
    color: '#666',
  },
  
  subtitle2: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 18,
    color: '#666',
  },
  
  body1: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    color: '#333',
  },
  
  body2: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    color: '#333',
  },
  
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
    color: '#666',
  },
  
  overline: {
    fontSize: 10,
    fontWeight: '500' as const,
    lineHeight: 14,
    color: '#888',
    textTransform: 'uppercase' as const,
  },
  
  // Button text styles
  buttonLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#fff',
  },
  
  buttonMedium: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#fff',
  },
  
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#fff',
  },
  
  // Link styles
  link: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: '#0066cc',
    textDecorationLine: 'underline' as const,
  },
  
  linkSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: '#0066cc',
  },
}; 