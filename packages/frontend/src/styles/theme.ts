export const theme = {
  colors: {
    primary: '#FF5F00',
    primaryHover: '#E55500',
    secondary: '#000000',
    white: '#FFFFFF',
    background: '#F5F5F5',
    surface: '#FFFFFF',
    border: '#E0E0E0',
    textPrimary: '#1A1A1A',
    textSecondary: '#666666',
    textLight: '#999999',
    success: '#28A745',
    danger: '#DC3545',
    warning: '#FFC107',
    info: '#17A2B8',
  },
  fonts: {
    body: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  borderRadius: '6px',
  shadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  shadowHover: '0 4px 16px rgba(0, 0, 0, 0.12)',
} as const;

export type Theme = typeof theme;
