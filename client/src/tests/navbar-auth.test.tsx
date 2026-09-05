import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Navbar } from '../components/layout/Navbar';
import { User } from '../types';

let mockUser: User | null = null;
const mockLogout = vi.fn();
const mockSwitchRole = vi.fn();

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    token: mockUser ? 'mock-token' : null,
    isLoading: false,
    login: vi.fn(),
    logout: mockLogout,
    switchRole: mockSwitchRole,
    hasRole: (roles: string[]) => (mockUser ? roles.includes(mockUser.role) : false),
  }),
}));

describe('Navbar Dynamic Role & Auth Flow', () => {
  it('renders only Showcase tab and Login / Sign Up button when unauthenticated', () => {
    mockUser = null;

    render(
      <Navbar
        activeTab="landing"
        onSelectTab={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onNavigateToLogin={vi.fn()}
      />
    );

    // Should show branding
    expect(screen.getByText('RECLAIM')).toBeDefined();

    // Should show Login / Sign Up button
    expect(screen.getByRole('button', { name: /Login \/ Sign Up/i })).toBeDefined();

    // Center tabs: only Showcase tab should be present
    expect(screen.getByRole('button', { name: /^Showcase$/i })).toBeDefined();
    expect(screen.queryByRole('button', { name: /^Dashboard$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Workbench$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Policies$/i })).toBeNull();
  });

  it('renders Admin role badge and full tabs when authenticated as ADMIN', () => {
    mockUser = {
      id: 'admin-1',
      name: 'Vikram Admin',
      email: 'admin@reclaim.demo',
      role: 'ADMIN',
      merchantId: 'm1',
    };

    render(
      <Navbar
        activeTab="overview"
        onSelectTab={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onNavigateToLogin={vi.fn()}
      />
    );

    // Login / Sign Up should NOT be displayed
    expect(screen.queryByRole('button', { name: /Login \/ Sign Up/i })).toBeNull();

    // Admin role badge should be visible
    expect(screen.getByText('ADMIN')).toBeDefined();
    expect(screen.getByText('Vikram Admin')).toBeDefined();

    // Full tabs should be visible for ADMIN
    expect(screen.getByRole('button', { name: /^Showcase$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Dashboard$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Workbench$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Sandbox$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Policies$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Audit$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Scorecard$/i })).toBeDefined();
  });

  it('filters tabs according to RBAC when authenticated as REVIEWER', () => {
    mockUser = {
      id: 'rev-1',
      name: 'Rohan Reviewer',
      email: 'reviewer@reclaim.demo',
      role: 'REVIEWER',
      merchantId: 'm1',
    };

    render(
      <Navbar
        activeTab="overview"
        onSelectTab={vi.fn()}
        onOpenMobileMenu={vi.fn()}
        onNavigateToLogin={vi.fn()}
      />
    );

    // Reviewer badge visible
    expect(screen.getByText('REVIEWER')).toBeDefined();

    // Permitted tabs
    expect(screen.getByRole('button', { name: /^Showcase$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Dashboard$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Workbench$/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /^Sandbox$/i })).toBeDefined();

    // Restricted tabs should not appear
    expect(screen.queryByRole('button', { name: /^Policies$/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Audit$/i })).toBeNull();
  });

  it('opens profile dropdown and allows logging out', async () => {
    mockUser = {
      id: 'admin-1',
      name: 'Vikram Admin',
      email: 'admin@reclaim.demo',
      role: 'ADMIN',
      merchantId: 'm1',
    };
    const onSelectTab = vi.fn();

    render(
      <Navbar
        activeTab="overview"
        onSelectTab={onSelectTab}
        onOpenMobileMenu={vi.fn()}
        onNavigateToLogin={vi.fn()}
      />
    );

    // Click profile dropdown pill
    const profileBtn = screen.getByRole('button', { name: /User profile for Vikram Admin/i });
    fireEvent.click(profileBtn);

    // Log Out button should now be visible
    const logoutBtn = screen.getByRole('button', { name: /Log Out/i });
    expect(logoutBtn).toBeDefined();

    fireEvent.click(logoutBtn);
    expect(mockLogout).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => {
      expect(onSelectTab).toHaveBeenCalledWith('landing');
    });
  });
});
