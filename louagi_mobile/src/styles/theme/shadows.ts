// 📁 src/styles/theme/shadows.ts
export const shadows = {
  // Card shadows
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  cardLarge: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  
  // Button shadows
  button: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Header shadows
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  // Light shadows
  light: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  // No shadow
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
};

export const borderRadius = {
  none: 0,
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  circle: 50,
  
  // Component-specific
  button: 8,
  card: 12,
  input: 8,
  badge: 12,
  tab: 20,
};

export const opacity = {
  transparent: 0,
  light: 0.1,
  medium: 0.5,
  heavy: 0.8,
  opaque: 1,
  
  disabled: 0.6,
  overlay: 0.4,
  backdrop: 0.3,
}; 