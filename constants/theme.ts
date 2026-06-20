/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    background: '#f4f6f9',
    card: '#ffffff',
    text: '#1e293b',
    textMuted: '#64748b',
    border: '#e2e8f0',
    inputBg: '#f8fafc',
    inputTextColor: '#0f172a',
    inputBorder: '#cbd5e1',
    primary: '#00a8ff',
    primaryBg: '#e0f2fe',
    success: '#00c896',
    successBg: '#dcfce7',
    danger: '#ff4d4d',
    dangerBg: '#fee2e2',
    tabBarBg: '#ffffff',
    tabBarActive: '#00a8ff',
    tabBarInactive: '#64748b',
    tint: '#00a8ff',
    icon: '#64748b',
    tabIconDefault: '#64748b',
    tabIconSelected: '#00a8ff',
    shadow: '#000000',
  },
  dark: {
    background: '#050a12',
    card: '#0d1827',
    text: '#e2e8f0',
    textMuted: '#7090b0',
    border: '#1a2d45',
    inputBg: '#0a1520',
    inputTextColor: '#ffffff',
    inputBorder: '#1e3050',
    primary: '#00a8ff',
    primaryBg: '#0b253a',
    success: '#00c896',
    successBg: '#073328',
    danger: '#ff4d4d',
    dangerBg: '#331212',
    tabBarBg: '#0d1827',
    tabBarActive: '#00a8ff',
    tabBarInactive: '#4a6080',
    tint: '#00a8ff',
    icon: '#7090b0',
    tabIconDefault: '#4a6080',
    tabIconSelected: '#00a8ff',
    shadow: '#000000',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
