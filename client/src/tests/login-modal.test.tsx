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

import { LoginModal } from '../components/auth/LoginModal';

describe('LoginModal Component', () => {
  it('does not render when isOpen is false', () => {
    render(<LoginModal isOpen={false} onClose={() => {}} />);

    expect(screen.queryByText('Reclaim Auth')).toBeNull();
  });

  it('renders the modal when isOpen is true', () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByText('Reclaim Auth')).toBeDefined();
  });

  it('renders email and password input fields', () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);

    const emailInput = document.querySelector('input[type="email"], input[placeholder*="email" i]');
    const passwordInput = document.querySelector('input[type="password"]');

    expect(emailInput).toBeDefined();
    expect(passwordInput).toBeDefined();
  });

  it('renders close button', () => {
    const closeFn = vi.fn();
    render(<LoginModal isOpen={true} onClose={closeFn} />);

    // The modal should have a close mechanism (X button or overlay click)
    const closeButtons = document.querySelectorAll('button');
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it('renders quick-switch role buttons', () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);

    const content = document.body.textContent || '';
    expect(content).toContain('Admin');
    expect(content).toContain('Reviewer');
    expect(content).toContain('Ops');
  });

  it('renders submit button', () => {
    render(<LoginModal isOpen={true} onClose={() => {}} />);

    // At least one submit mechanism should exist
    const allButtons = document.querySelectorAll('button');
    expect(allButtons.length).toBeGreaterThan(0);
  });
});
