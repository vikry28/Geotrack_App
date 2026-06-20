import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/src/core/store/store';
import { mockLogin, mockRegister, logout, clearError } from '../redux/authSlice';

/**
 * PRESENTATION LAYER — useAuth Hook
 * Encapsulates Redux auth state access and operations in a clean hook.
 * Simplifies and decouples React components from direct Redux selectors and actions.
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  
  const {
    isAuthenticated,
    token,
    userId,
    username,
    email,
    loading,
    error,
  } = useSelector((state: RootState) => state.auth);

  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    return dispatch(mockLogin({ email: emailInput, password: passwordInput })).unwrap();
  }, [dispatch]);

  const register = useCallback(async (usernameInput: string, emailInput: string, passwordInput: string) => {
    return dispatch(mockRegister({ username: usernameInput, email: emailInput, password: passwordInput })).unwrap();
  }, [dispatch]);

  const logoutUser = useCallback(async () => {
    return dispatch(logout()).unwrap();
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    isAuthenticated,
    token,
    userId,
    username,
    email,
    loading,
    error,
    login,
    register,
    logoutUser,
    clearAuthError,
  };
}
