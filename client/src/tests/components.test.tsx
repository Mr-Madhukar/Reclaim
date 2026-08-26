import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseFilters } from '../components/cases/CaseFilters';
import { KpiCardGrid } from '../components/dashboard/KpiCardGrid';
import { ExportReportModal } from '../components/scorecard/ExportReportModal';
import { MetricSummary } from '../types';

describe('Frontend Component Tests', () => {
  it('renders KpiCardGrid with formatted financial data', () => {
    const mockSummary: MetricSummary = {
      totalAtRisk: 50000,
      totalRecovered: 40000,
      netRecovered: 38000,
      recoveryRatePercent: 80,
      totalIncentiveSpent: 2000,
      activeCasesCount: 5,
      recoveredCasesCount: 12,
      stoppingRuleTriggersCount: 3,
      laneMetrics: {
        payment: { atRisk: 20000, recovered: 18000, rate: 90, caseCount: 6 },
        checkout: { atRisk: 15000, recovered: 12000, rate: 80, caseCount: 5 },
        receivable: { atRisk: 15000, recovered: 10000, rate: 66.7, caseCount: 6 },
      },
    };

    render(<KpiCardGrid summary={mockSummary} isLoading={false} />);

    expect(screen.getByText('₹ Total at Risk')).toBeDefined();
    expect(screen.getByText('₹ Measured Recovered')).toBeDefined();
    expect(screen.getByText('80.0%')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('updates search query when typing in CaseFilters', () => {
    const onChangeMock = vi.fn();
    const onResetMock = vi.fn();

    render(
      <CaseFilters
        filters={{ page: 1, limit: 10, search: '', lane: 'ALL', status: 'ALL' }}
        onChange={onChangeMock}
        onReset={onResetMock}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by customer/i);
    fireEvent.change(searchInput, { target: { value: 'Priya' } });

    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Priya', page: 1 })
    );
  });

  it('renders ExportReportModal with evaluation scorecard markdown', () => {
    render(<ExportReportModal isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/Submission Scorecard/i)).toBeDefined();
    expect(screen.getByText(/Copy Markdown/i)).toBeDefined();
    expect(screen.getByText(/Download .md Report/i)).toBeDefined();
  });
});
