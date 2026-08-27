import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import {
  AuthResponse,
  CaseFilterParams,
  MetricSummary,
  PolicyConfig,
  RecoveryCase,
  AuditLog,
  BatchRunResult,
  LaneMetric,
  EvaluationBenchmark,
  StoppingRulesBreakdown,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor: attach token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('reclaim_auth_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle errors & silent auto-refresh / re-authentication on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<{ error?: { message?: string; code?: string } }>) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        let newToken: string | null = null;
        try {
          const { data } = await axios.post<{ accessToken: string }>(
            `${API_BASE_URL}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          newToken = data.accessToken;
        } catch {
          localStorage.removeItem('reclaim_auth_token');
          newToken = null;
        }

        if (newToken) {
          localStorage.setItem('reclaim_auth_token', newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          processQueue(null, newToken);
          return apiClient(originalRequest);
        } else {
          processQueue(new Error('Session expired'), null);
          return Promise.reject(error);
        }
      } catch (refreshErr) {
        processQueue(refreshErr instanceof Error ? refreshErr : new Error('Re-authentication failed'), null);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    const message = error.response?.data?.error?.message || error.message || 'An unexpected error occurred';
    return Promise.reject(new Error(message));
  }
);

// API Endpoints
export const api = {
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', { email, password });
      return data;
    },
    me: async (): Promise<AuthResponse['user']> => {
      const { data } = await apiClient.get<{ user: AuthResponse['user'] }>('/auth/me');
      return data.user;
    },
    logout: async (): Promise<void> => {
      await apiClient.post('/auth/logout');
    },
  },

  metrics: {
    getSummary: async (): Promise<MetricSummary> => {
      const { data } = await apiClient.get<MetricSummary | { data: MetricSummary }>('/metrics/summary');
      return ((data as { data?: MetricSummary }).data || data) as MetricSummary;
    },
    getByLane: async (): Promise<Record<string, LaneMetric>> => {
      const { data } = await apiClient.get<{ laneMetrics?: Record<string, LaneMetric>; data?: Record<string, LaneMetric> }>('/metrics/by-lane');
      return (data.laneMetrics || data.data || data) as Record<string, LaneMetric>;
    },
  },

  cases: {
    list: async (params?: CaseFilterParams): Promise<{ cases: RecoveryCase[]; total: number; page: number; limit: number }> => {
      const cleanParams = Object.fromEntries(
        Object.entries(params || {}).filter(([_, v]) => v !== undefined && v !== 'ALL')
      );
      const { data } = await apiClient.get<{
        items?: RecoveryCase[];
        cases?: RecoveryCase[];
        total?: number;
        page?: number;
        limit?: number;
        data?: { items?: RecoveryCase[]; cases?: RecoveryCase[]; total?: number; page?: number; limit?: number };
      }>('/cases', {
        params: cleanParams,
      });

      const rootData = data.data || data;
      const caseList = rootData.cases || rootData.items || (Array.isArray(rootData) ? rootData : []);
      const total = rootData.total !== undefined ? rootData.total : caseList.length;

      return {
        cases: caseList,
        total,
        page: rootData.page || 1,
        limit: rootData.limit || 20,
      };
    },
    getById: async (id: string): Promise<RecoveryCase> => {
      const { data } = await apiClient.get<{ case?: RecoveryCase; data?: { case?: RecoveryCase } }>(`/cases/${id}`);
      return (data.case || data.data?.case || data) as RecoveryCase;
    },
    triggerAction: async (
      id: string,
      options?: { locale?: 'en' | 'hinglish' | 'hi'; simulateOutage?: boolean }
    ): Promise<{ success: boolean; message: string; action?: unknown }> => {
      const { data } = await apiClient.post<{ success: boolean; message: string; action?: unknown; data?: { success: boolean; message: string; action?: unknown } }>(
        `/cases/${id}/trigger`,
        options
      );
      return data.data || data;
    },
    resolveEscalation: async (id: string, notes: string, outcome: 'RECOVERED' | 'EXPIRED' | 'UNRESOLVED'): Promise<void> => {
      await apiClient.post(`/cases/${id}/resolve`, { notes, outcome });
    },
    logPromiseToPay: async (id: string, promisedAmount: number, promisedDate: string): Promise<void> => {
      await apiClient.post(`/cases/${id}/promise-to-pay`, { promisedAmount, promisedDate });
    },
    customerAction: async (
      id: string,
      payload: {
        action: 'PAY_SUCCESS' | 'OPT_OUT' | 'PROMISE_TO_PAY' | 'ALT_PAYMENT' | 'GRACE_PERIOD' | 'UPDATE_PAYMENT_METHOD';
        promisedDate?: string;
        promisedAmount?: number;
        paymentMethod?: string;
        optOutReason?: string;
        paymentDetails?: { method: string; identifier: string };
      }
    ): Promise<{ success: boolean; message: string }> => {
      const { data } = await apiClient.post<{ success: boolean; message: string }>(`/cases/${id}/customer-action`, payload);
      return data;
    },
  },

  policies: {
    list: async (): Promise<PolicyConfig[]> => {
      const { data } = await apiClient.get<{ policies?: PolicyConfig[]; policyConfigs?: PolicyConfig[]; data?: { policyConfigs?: PolicyConfig[] } }>('/policy-configs');
      return (data.policies || data.policyConfigs || data.data?.policyConfigs || (Array.isArray(data) ? data : [])) as PolicyConfig[];
    },
    update: async (
      id: string,
      updates: Partial<Pick<PolicyConfig, 'maxAttempts' | 'cooldownMinutes' | 'maxIncentiveAmount' | 'dailyCapGlobal'>>
    ): Promise<PolicyConfig> => {
      const { data } = await apiClient.put<{ policy?: PolicyConfig; policyConfig?: PolicyConfig; data?: { policyConfig?: PolicyConfig } }>(`/policy-configs/${id}`, updates);
      return (data.policy || data.policyConfig || data.data?.policyConfig || data) as PolicyConfig;
    },
  },

  auditLogs: {
    list: async (params?: { entityType?: string; entityId?: string; limit?: number; page?: number }): Promise<{ auditLogs: AuditLog[]; total: number }> => {
      const { data } = await apiClient.get<{
        items?: AuditLog[];
        auditLogs?: AuditLog[];
        total?: number;
        data?: { items?: AuditLog[]; auditLogs?: AuditLog[]; total?: number };
      }>('/audit-logs', { params });

      const rootData = data.data || data;
      const logs = rootData.auditLogs || rootData.items || (Array.isArray(rootData) ? rootData : []);
      const total = rootData.total !== undefined ? rootData.total : logs.length;

      return {
        auditLogs: logs,
        total,
      };
    },
  },

  webhooks: {
    simulate: async (payload: {
      event?: string;
      amount?: number;
      failureCode?: string;
      failureReason?: string;
      customerEmail?: string;
      customerName?: string;
    }): Promise<{ simulated: boolean; signature: string; event: string; payload: unknown; result?: unknown }> => {
      const { data } = await apiClient.post<{ simulated: boolean; signature: string; event: string; payload: unknown; result?: unknown }>(
        '/webhooks/simulate',
        payload
      );
      return data;
    },
  },

  agent: {
    runBatch: async (options?: { dryRun?: boolean; limit?: number }): Promise<BatchRunResult & { metrics?: MetricSummary }> => {
      const { data } = await apiClient.post<BatchRunResult & { metrics?: MetricSummary }>('/agent/run-batch', options);
      return data;
    },
    getEvaluation: async (): Promise<{
      evaluation: EvaluationBenchmark;
      stoppingRulesBreakdown: StoppingRulesBreakdown;
      laneMetrics: MetricSummary['laneMetrics'];
      totalAtRisk: number;
      totalRecovered: number;
      netRecovered: number;
      totalIncentiveSpent: number;
    }> => {
      const { data } = await apiClient.get<{
        evaluation: EvaluationBenchmark;
        stoppingRulesBreakdown: StoppingRulesBreakdown;
        laneMetrics: MetricSummary['laneMetrics'];
        totalAtRisk: number;
        totalRecovered: number;
        netRecovered: number;
        totalIncentiveSpent: number;
      }>('/agent/evaluate');
      return data;
    },
  },
};
