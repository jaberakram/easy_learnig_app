// easy_learning_app/constants/theme.js
import { Dimensions } from 'react-native';
const { width, height } = Dimensions.get('window');

// আপনার নির্বাচিত কালার প্যালেট
export const COLORS = {
  // Brand Colors
  background: '#F4F1DE', // Light Cream/Beige
  primary: '#E07A5F', // Coral/Burnt Orange (Button/CTA)
  accent: '#3D405B', // Dark Navy Blue (Text, Headings)
  progress: '#81B29A', // Muted Teal/Green (Progress Bar)
  promoBg: '#F2CC8F', // Muted Gold/Mustard (Promotion Card)

  // Standard/Utility Colors
  text: '#3D405B', 
  textLight: '#6B7280', 
  white: '#FFFFFF', 
  border: '#D1C8B4', 
  disabled: '#A5A6A2', 
  error: '#dc3545', // Error Red

  // Notice/Promo Specific
  noticeText: '#3D405B',
  noticeBg: '#FFFFFF',
  promoText: '#3D405B',
  promoButtonText: '#FFFFFF',
  
  // Legacy/Greys
  gray: '#6B7280',
  lightGray: '#f5f5f5',
  blue: '#007bff',
  green: '#28a745',
  yellow: '#ffc107',
};

// অ্যাপের সাইজ
export const SIZES = {
  // global sizes
  base: 8,
  font: 14,
  radius: 10,
  padding: 15,

  // font sizes
  h1: 28,
  h2: 24,
  h3: 20,
  h4: 18,
  body1: 16,
  body2: 14,
  body3: 12,

  // app dimensions
  width,
  height,
};

// ফন্ট (প্রয়োজনে)
export const FONTS = {
  h1: { fontSize: SIZES.h1, fontWeight: 'bold', color: COLORS.accent, lineHeight: 36 },
  h2: { fontSize: SIZES.h2, fontWeight: 'bold', color: COLORS.accent, lineHeight: 30 },
  h3: { fontSize: SIZES.h3, fontWeight: 'bold', color: COLORS.accent, lineHeight: 26 },
  h4: { fontSize: SIZES.h4, fontWeight: '600', color: COLORS.accent, lineHeight: 24 },
  body1: { fontSize: SIZES.body1, color: COLORS.text, lineHeight: 24 },
  body2: { fontSize: SIZES.body2, color: COLORS.textLight, lineHeight: 22 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;