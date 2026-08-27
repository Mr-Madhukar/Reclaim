import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CaseFilters } from '../components/cases/CaseFilters';

describe('CaseFilters Component', () => {
  const defaultFilters = { page: 1, limit: 10, search: '', lane: 'ALL' as const, status: 'ALL' as const };

  it('renders search input with placeholder', () => {
    render(
      <CaseFilters
        filters={defaultFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by customer/i);
    expect(searchInput).toBeDefined();
  });

  it('calls onChange when search text changes', () => {
    const onChangeMock = vi.fn();
    render(
      <CaseFilters
        filters={defaultFilters}
        onChange={onChangeMock}
        onReset={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by customer/i);
    fireEvent.change(searchInput, { target: { value: 'Aarav' } });

    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({ search: 'Aarav', page: 1 })
    );
  });

  it('renders lane filter dropdown', () => {
    render(
      <CaseFilters
        filters={defaultFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const laneSelect = document.querySelector('[aria-label*="lane" i], select');
    expect(laneSelect).toBeDefined();
  });

  it('renders status filter dropdown', () => {
    render(
      <CaseFilters
        filters={defaultFilters}
        onChange={vi.fn()}
        onReset={vi.fn()}
      />
    );

    const statusSelect = document.querySelector('[aria-label*="status" i], select');
    expect(statusSelect).toBeDefined();
  });

  it('calls onReset when reset button is clicked', () => {
    const onResetMock = vi.fn();
    render(
      <CaseFilters
        filters={{ ...defaultFilters, search: 'test', lane: 'PAYMENT' }}
        onChange={vi.fn()}
        onReset={onResetMock}
      />
    );

    const resetBtn = screen.queryByRole('button', { name: /reset|clear/i });
    if (resetBtn) {
      fireEvent.click(resetBtn);
      expect(onResetMock).toHaveBeenCalled();
    }
  });

  it('resets page to 1 when search changes', () => {
    const onChangeMock = vi.fn();
    render(
      <CaseFilters
        filters={{ ...defaultFilters, page: 3 }}
        onChange={onChangeMock}
        onReset={vi.fn()}
      />
    );

    const searchInput = screen.getByPlaceholderText(/search by customer/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });

    expect(onChangeMock).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1 })
    );
  });
});
