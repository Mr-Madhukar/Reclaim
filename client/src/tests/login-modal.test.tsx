import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock hooks
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' },
    token: 'mock-token',
    isLoading: false,
    login: vi.fn().mockResolvedValue(undefined),
    logout: vi.fn(),
    switchRole: vi.fn().mockResolvedValue(undefined),
    hasRole: (roles: string[]) => roles.includes('ADMIN'),
  }),
}));

vi.mock('../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'dark' as const,
    toggleTheme: vi.fn(),
    setTheme: vi.fn(),
  }),
}));

import { LoginPage } from '../components/auth/LoginPage';

describe('LoginPage Component', () => {
  it('renders RECLAIM branding and logo', () => {
    render(<LoginPage />);

    expect(screen.getByText('RECLAIM')).toBeDefined();
    const logoImg = document.querySelector('img[alt="Reclaim Brand Logo"]');
    expect(logoImg).toBeDefined();
    expect(logoImg?.getAttribute('src')).toBe('/android-chrome-192x192.png');
  });

  it('renders Sign In and Sign Up options', () => {
    render(<LoginPage />);

    expect(screen.getAllByText('Sign In').length).toBeGreaterThan(0);
    expect(screen.getByText('Sign Up')).toBeDefined();
  });

  it('renders email and password input fields', () => {
    render(<LoginPage />);

    const emailInput = document.querySelector('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = document.querySelector('input[type="password"]');

    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('renders quick-switch role buttons', () => {
    render(<LoginPage />);

    const content = document.body.textContent || '';
    expect(content).toContain('Admin');
    expect(content).toContain('Reviewer');
    expect(content).toContain('Ops');
  });

  it('renders submit button', () => {
    render(<LoginPage />);

    const allButtons = document.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThan(0);
  });
});
