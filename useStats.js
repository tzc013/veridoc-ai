// frontend/src/hooks/useStats.js
/**
 * Veridoc AI - Statistics Hooks
 * Custom hooks for dashboard statistics
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useStats = (options = {}) => {
  const queryClient = useQueryClient();
  
  const {
    autoFetch = true,
    refreshInterval = 30000, // 30 seconds
    staleTime = 10000, // 10 seconds
  } = options;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [historicalData, setHistoricalData] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  // Get dashboard stats
  const {
    data: stats = null,
    isLoading: isLoadingStats,
    isError: isErrorStats,
    error: statsError,
    refetch: refetchStats,
    isFetching: isFetchingStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime,
    enabled: autoFetch,
    refetchInterval: refreshInterval,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    onError: (error) => {
      console.error('Failed to fetch dashboard stats:', error);
    },
  });

  // Get activity data
  const {
    data: activity = null,
    isLoading: isLoadingActivity,
    refetch: refetchActivity,
  } = useQuery({
    queryKey: ['dashboard-activity', timeRange],
    queryFn: () => api.dashboard.getActivity(timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365),
    staleTime: 60 * 1000, // 1 minute
    enabled: autoFetch,
    onError: (error) => {
      console.error('Failed to fetch activity data:', error);
    },
  });

  // Get processing info
  const {
    data: processingInfo = null,
    isLoading: isLoadingProcessingInfo,
  } = useQuery({
    queryKey: ['processing-info'],
    queryFn: () => api.documents.getProcessingInfo(),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: autoFetch,
    retry: 1,
  });

  // ==========================================================================
  // DERIVED DATA
  // ==========================================================================

  // Document stats
  const documentStats = useMemo(() => {
    if (!stats) return null;
    return {
      total: stats.total_documents || 0,
      indexed: stats.indexed_documents || 0,
      processing: stats.processing_documents || 0,
      failed: stats.failed_documents || 0,
      indexingHealth: stats.indexing_health || 0,
      totalChunks: stats.total_chunks || 0,
      totalQueries: stats.total_queries || 0,
      queriesThisWeek: stats.queries_this_week || 0,
      queryChangePercent: stats.query_change_percent || 0,
      documentsThisWeek: stats.documents_this_week || 0,
    };
  }, [stats]);

  // Query stats
  const queryStats = useMemo(() => {
    if (!stats) return null;
    return {
      total: stats.total_queries || 0,
      thisWeek: stats.queries_this_week || 0,
      changePercent: stats.query_change_percent || 0,
      isPositive: (stats.query_change_percent || 0) >= 0,
    };
  }, [stats]);

  // Health status
  const healthStatus = useMemo(() => {
    if (!stats) return { status: 'unknown', level: 0 };
    const health = stats.indexing_health || 0;
    if (health === 100) return { status: 'healthy', level: 100 };
    if (health >= 80) return { status: 'warning', level: health };
    return { status: 'critical', level: health };
  }, [stats]);

  // Activity chart data
  const chartData = useMemo(() => {
    if (!activity) return [];
    return activity.map(item => ({
      date: item.date,
      queries: item.queries || 0,
      documents: item.documents || 0,
      users: item.users || 0,
    }));
  }, [activity]);

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  // Refresh all stats
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        refetchStats(),
        refetchActivity(),
      ]);
      return true;
    } catch (error) {
      console.error('Failed to refresh stats:', error);
      return false;
    }
  }, [refetchStats, refetchActivity]);

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Store historical data
  useEffect(() => {
    if (stats) {
      setHistoricalData(prev => {
        const newData = [...prev, {
          timestamp: Date.now(),
          stats,
        }];
        // Keep last 100 data points
        if (newData.length > 100) {
          return newData.slice(-100);
        }
        return newData;
      });
    }
  }, [stats]);

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  const getTrend = useCallback((current, previous) => {
    if (!previous || previous === 0) {
      return { direction: 'neutral', percentage: 0 };
    }
    const change = ((current - previous) / previous) * 100;
    return {
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      percentage: Math.abs(change),
    };
  }, []);

  const formatDate = useCallback((timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, []);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Data
    stats,
    documentStats,
    queryStats,
    processingInfo,
    activity,
    chartData,
    historicalData,
    healthStatus,
    
    // Loading states
    isLoading: isLoadingStats || isFetchingStats,
    isLoadingActivity,
    isLoadingProcessingInfo,
    
    // Error states
    isError: isErrorStats,
    error: statsError,
    
    // Time range
    timeRange,
    setTimeRange,
    
    // Actions
    refresh: refreshAll,
    refetchStats,
    refetchActivity,
    getTrend,
    formatDate,
    
    // Utility
    isHealthy: healthStatus.status === 'healthy',
    isWarning: healthStatus.status === 'warning',
    isCritical: healthStatus.status === 'critical',
  };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useStats;