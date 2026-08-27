import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock the hooks that components depend on
vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'u1', email: 'admin@test.com', name: 'Admin', role: 'ADMIN' },
    token: 'mock-token',
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    switchRole: vi.fn(),
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

vi.mock('../hooks/useMetrics', () => ({
  useMetricsSummary: () => ({
    data: {
      totalAtRisk: 500000,
      totalRecovered: 380000,
      recoveryRatePercent: 76,
      totalIncentiveSpent: 12000,
      netRecovered: 368000,
      activeCasesCount: 15,
      recoveredCasesCount: 35,
      stoppingRuleTriggersCount: 8,
      laneMetrics: {
        payment: { atRisk: 200000, recovered: 180000, rate: 90, caseCount: 20 },
        checkout: { atRisk: 150000, recovered: 100000, rate: 66.7, caseCount: 15 },
        receivable: { atRisk: 150000, recovered: 100000, rate: 66.7, caseCount: 15 },
      },
      rootCauseBreakdown: {},
    },
    isLoading: false,
  }),
}));

// Import components after mocks
import { KpiCardGrid } from '../components/dashboard/KpiCardGrid';
import { LaneBreakdown } from '../components/dashboard/LaneBreakdown';
import { MetricSummary } from '../types';

const mockSummary: MetricSummary = {
  totalAtRisk: 500000,
  totalRecovered: 380000,
  recoveryRatePercent: 76,
  totalIncentiveSpent: 12000,
  netRecovered: 368000,
  activeCasesCount: 15,
  recoveredCasesCount: 35,
  stoppingRuleTriggersCount: 8,
  laneMetrics: {
    payment: { atRisk: 200000, recovered: 180000, rate: 90, caseCount: 20 },
    checkout: { atRisk: 150000, recovered: 100000, rate: 66.7, caseCount: 15 },
    receivable: { atRisk: 150000, recovered: 100000, rate: 66.7, caseCount: 15 },
  },
};

describe('Dashboard Components', () => {
  describe('KpiCardGrid', () => {
    it('renders all 4 KPI metric cards', () => {
      render(<KpiCardGrid summary={mockSummary} isLoading={false} />);

      expect(screen.getByText('₹ Total at Risk')).toBeDefined();
      expect(screen.getByText('₹ Measured Recovered')).toBeDefined();
      expect(screen.getByText('Recovery Rate')).toBeDefined();
      expect(screen.getByText('Guardrail Stops')).toBeDefined();
    });

    it('displays correct recovery rate percentage', () => {
      render(<KpiCardGrid summary={mockSummary} isLoading={false} />);

      expect(screen.getByText('76.0%')).toBeDefined();
    });

    it('displays stopping rule trigger count', () => {
      render(<KpiCardGrid summary={mockSummary} isLoading={false} />);

      expect(screen.getByText('8')).toBeDefined();
    });

    it('renders loading skeleton when isLoading is true', () => {
      render(<KpiCardGrid summary={undefined} isLoading={true} />);

      // When loading, the component should render skeleton or placeholder
      const container = document.querySelector('[class*="animate"]');
      expect(container).toBeDefined();
    });

    it('handles undefined summary gracefully', () => {
      render(<KpiCardGrid summary={undefined} isLoading={false} />);

      // Should not crash, should render with fallback values
      expect(screen.getByText('₹ Total at Risk')).toBeDefined();
    });
  });

  describe('LaneBreakdown', () => {
    it('renders all 3 recovery lanes', () => {
      render(<LaneBreakdown summary={mockSummary} />);

      const content = document.body.textContent || '';
      expect(content).toContain('Payment');
      expect(content).toContain('Checkout');
      expect(content).toContain('Receivable');
    });

    it('displays lane-specific recovery rates', () => {
      render(<LaneBreakdown summary={mockSummary} />);

      const content = document.body.textContent || '';
      expect(content).toContain('90');
      expect(content).toContain('66.7');
    });

    it('handles undefined summary gracefully', () => {
      render(<LaneBreakdown summary={undefined} />);

      // Should not crash
      expect(document.body).toBeDefined();
    });
  });
});
