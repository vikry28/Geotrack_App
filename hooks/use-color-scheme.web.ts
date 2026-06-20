import { useSelector } from 'react-redux';
import { RootState } from '@/src/core/store/store';

export function useColorScheme(): 'light' | 'dark' {
  try {
    const themeMode = useSelector((state: RootState) => state.theme?.mode);
    return themeMode || 'light';
  } catch (error) {
    return 'light';
  }
}
