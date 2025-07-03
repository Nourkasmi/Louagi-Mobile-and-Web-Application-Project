// 📁 src/styles/theme/spacing.ts
export const spacing = {
  // Base spacing units (4px scale)
  xs: 4,     // 4px
  sm: 8,     // 8px  
  md: 12,    // 12px
  lg: 16,    // 16px
  xl: 20,    // 20px
  xxl: 24,   // 24px
  xxxl: 32,  // 32px
  
  // Semantic spacing
  tiny: 2,
  small: 8,
  medium: 16,
  large: 24,
  huge: 48,
  
  // Component-specific spacing
  container: {
    horizontal: 16,
    vertical: 20,
    paddingTop: 60,  // For status bar
  },
  
  card: {
    padding: 16,
    paddingLarge: 20,
    margin: 16,
    marginSmall: 8,
    marginBottom: 12,
  },
  
  button: {
    horizontal: 16,
    vertical: 12,
    verticalSmall: 8,
    verticalLarge: 14,
  },
  
  input: {
    horizontal: 12,
    vertical: 12,
    margin: 12,
    marginTop: 18,
  },
  
  header: {
    padding: 16,
    paddingTop: 60,
    paddingVertical: 20,
  },
  
  list: {
    padding: 16,
    paddingBottom: 32,
    itemMargin: 12,
  },
  
  section: {
    marginBottom: 16,
    marginTop: 20,
  },
}; 