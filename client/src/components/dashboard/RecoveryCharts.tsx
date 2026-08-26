import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { MetricSummary } from '../../types';
import { useTheme } from '../../hooks/useTheme';
import { formatINR } from '../../lib/utils';

interface RecoveryChartsProps {
  summary?: MetricSummary;
}

export const RecoveryCharts: React.FC<RecoveryChartsProps> = ({ summary }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const laneData = [
    {
      name: 'Payment Degradation',
      atRisk: summary?.laneMetrics?.payment?.atRisk || 0,
      recovered: summary?.laneMetrics?.payment?.recovered || 0,
    },
    {
      name: 'Checkout Drop-off',
      atRisk: summary?.laneMetrics?.checkout?.atRisk || 0,
      recovered: summary?.laneMetrics?.checkout?.recovered || 0,
    },
    {
      name: 'B2B Receivables',
      atRisk: summary?.laneMetrics?.receivable?.atRisk || 0,
      recovered: summary?.laneMetrics?.receivable?.recovered || 0,
    },
  ];

  const rootCauses = [
    { name: 'Bank Timeout', count: 18, fill: '#ff7828' },
    { name: 'Insufficient Funds', count: 14, fill: '#fb923c' },
    { name: 'Mandate Expired', count: 9, fill: '#6366f1' },
    { name: 'OTP Drop-off', count: 7, fill: '#818cf8' },
    { name: 'Risk Decline', count: 6, fill: '#f59e0b' },
  ];

  const tooltipBg = isDark ? '#0d1117' : '#ffffff';
  const tooltipBorder = isDark ? '#202b3d' : '#e2e8f0';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
      {/* Chart 1: Rupee Yield Comparison */}
      <div className="lg:col-span-7 glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              ₹ Financial Yield by Recovery Lane
            </h4>
            <p className="text-xs text-cream-700 dark:text-slate-400">
              Measured revenue recovered vs revenue at risk
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={laneData}
              margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
              />
              <YAxis
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
                tickFormatter={(v) => `₹${v / 1000}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '1rem',
                  color: textColor,
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)',
                }}
                formatter={(value) => [formatINR(typeof value === 'number' || typeof value === 'string' ? value : 0), ''] as [string, string]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="atRisk" name="₹ At Risk" fill="#ef4444" radius={[6, 6, 0, 0]} />
              <Bar dataKey="recovered" name="₹ Recovered" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Root Cause Classification Distribution */}
      <div className="lg:col-span-5 glass-card rounded-3xl p-6 border-cream-300 dark:border-surface-750">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Root-Cause Diagnosis Distribution
            </h4>
            <p className="text-xs text-cream-700 dark:text-slate-400">
              AI classified categories across the case batch
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rootCauses}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 30, bottom: 10 }}
            >
              <XAxis
                type="number"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 10 }}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: isDark ? '#94a3b8' : '#64748b', fontSize: 11 }}
                axisLine={{ stroke: isDark ? '#334155' : '#cbd5e1' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: tooltipBg,
                  borderColor: tooltipBorder,
                  borderRadius: '1rem',
                  color: textColor,
                  fontSize: '12px',
                }}
                formatter={(val) => [`${val} Cases`, 'Frequency'] as [string, string]}
              />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {rootCauses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
