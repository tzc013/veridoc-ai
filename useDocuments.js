// frontend/src/hooks/useDocuments.js
/**
 * Veridoc AI - Document Management Hooks
 * Custom hooks for document operations
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useDocuments = (options = {}) => {
  const queryClient = useQueryClient();
  
  const {
    autoFetch = true,
    initialFilters = {},
    staleTime = 5 * 60 * 1000, // 5 minutes
  } = options;

  // ==========================================================================
  // STATE
  // ==========================================================================

  const [filters, setFilters] = useState(initialFilters);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  // Get all documents
  const {
    data: documents = [],
    isLoading: isLoadingDocuments,
    isError: isErrorDocuments,
    error: documentsError,
    refetch: refetchDocuments,
    isFetching: isFetchingDocuments,
  } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => api.documents.getAll(filters),
    staleTime,
    enabled: autoFetch,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('Failed to fetch documents:', error);
      toast.error('Failed to load documents');
    },
  });

  // Get document stats
  const {
    data: stats = null,
    isLoading: isLoadingStats,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['document-stats'],
    queryFn: () => api.documents.getStats(),
    staleTime: 60 * 1000, // 1 minute
    enabled: autoFetch,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch document stats:', error);
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
  // MUTATIONS
  // ==========================================================================

  // Upload document
  const uploadMutation = useMutation({
    mutationFn: async ({ file, onProgress }) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const onUploadProgress = (progress) => {
        setUploadProgress(progress);
        if (onProgress) onProgress(progress);
      };
      
      const result = await api.documents.upload(file, onUploadProgress);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`"${data.filename}" uploaded successfully`);
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document-stats']);
      setUploadProgress(100);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
      setIsUploading(false);
    },
  });

  // Upload multiple documents
  const uploadMultipleMutation = useMutation({
    mutationFn: async ({ files, onProgress }) => {
      setIsUploading(true);
      setUploadProgress(0);
      
      const onUploadProgress = (progress) => {
        setUploadProgress(progress);
        if (onProgress) onProgress(progress);
      };
      
      const result = await api.documents.uploadMultiple(files, onUploadProgress);
      return result;
    },
    onSuccess: (data) => {
      toast.success(`${data.length || 'Documents'} uploaded successfully`);
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document-stats']);
      setUploadProgress(100);
      setIsUploading(false);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
      setIsUploading(false);
    },
  });

  // Delete document
  const deleteMutation = useMutation({
    mutationFn: (id) => api.documents.delete(id),
    onSuccess: (_, id) => {
      toast.success('Document deleted successfully');
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document-stats']);
      setSelectedDocuments(prev => prev.filter(docId => docId !== id));
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Reprocess document
  const reprocessMutation = useMutation({
    mutationFn: (id) => api.documents.reprocess(id),
    onSuccess: (data) => {
      toast.success(`Document reprocessing started`);
      queryClient.invalidateQueries(['documents']);
      queryClient.invalidateQueries(['document-stats']);
      // Invalidate specific document
      queryClient.invalidateQueries(['document', data.id]);
    },
    onError: (error) => {
      toast.error(`Failed to reprocess: ${error.message}`);
    },
  });

  // Get single document
  const useDocument = (id) => {
    return useQuery({
      queryKey: ['document', id],
      queryFn: () => api.documents.getById(id),
      enabled: !!id,
      staleTime: 2 * 60 * 1000, // 2 minutes
      retry: 2,
      onError: (error) => {
        console.error(`Failed to fetch document ${id}:`, error);
        toast.error('Failed to load document details');
      },
    });
  };

  // Get document status
  const useDocumentStatus = (id) => {
    return useQuery({
      queryKey: ['document-status', id],
      queryFn: () => api.documents.getStatus(id),
      enabled: !!id,
      staleTime: 5 * 1000, // 5 seconds - frequently updated
      refetchInterval: (data) => {
        // Refetch while processing
        if (data?.status === 'processing') {
          return 2000; // Every 2 seconds
        }
        return false;
      },
      onError: (error) => {
        console.error(`Failed to fetch document status ${id}:`, error);
      },
    });
  };

  // ==========================================================================
  // SELECTION MANAGEMENT
  // ==========================================================================

  const toggleSelection = useCallback((id) => {
    setSelectedDocuments(prev => {
      if (prev.includes(id)) {
        return prev.filter(docId => docId !== id);
      } else {
        return [...prev, id];
      }
    });
  }, []);

  const selectAll = useCallback(() => {
    if (selectedDocuments.length === documents.length) {
      setSelectedDocuments([]);
    } else {
      setSelectedDocuments(documents.map(doc => doc.id));
    }
  }, [documents, selectedDocuments]);

  const clearSelection = useCallback(() => {
    setSelectedDocuments([]);
  }, []);

  // ==========================================================================
  // FILTER HELPERS
  // ==========================================================================

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ==========================================================================
  // DERIVED DATA
  // ==========================================================================

  const indexedCount = useMemo(() => {
    return documents.filter(doc => doc.status === 'indexed').length;
  }, [documents]);

  const processingCount = useMemo(() => {
    return documents.filter(doc => doc.status === 'processing').length;
  }, [documents]);

  const failedCount = useMemo(() => {
    return documents.filter(doc => doc.status === 'failed').length;
  }, [documents]);

  const totalChunks = useMemo(() => {
    return documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0);
  }, [documents]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Data
    documents,
    stats,
    processingInfo,
    
    // Loading states
    isLoading: isLoadingDocuments || isFetchingDocuments,
    isLoadingStats,
    isLoadingProcessingInfo,
    isUploading,
    uploadProgress,
    
    // Error states
    isError: isErrorDocuments,
    error: documentsError,
    
    // Selection
    selectedDocuments,
    toggleSelection,
    selectAll,
    clearSelection,
    isAllSelected: selectedDocuments.length === documents.length && documents.length > 0,
    selectedCount: selectedDocuments.length,
    
    // Filters
    filters,
    updateFilters,
    resetFilters,
    
    // Refetch
    refetch: refetchDocuments,
    refetchStats,
    
    // Mutations
    upload: uploadMutation.mutate,
    uploadMultiple: uploadMultipleMutation.mutate,
    deleteDocument: deleteMutation.mutate,
    reprocessDocument: reprocessMutation.mutate,
    
    // Mutation states
    isUploading,
    isDeleting: deleteMutation.isPending,
    isReprocessing: reprocessMutation.isPending,
    
    // Statistics
    total: documents.length,
    indexedCount,
    processingCount,
    failedCount,
    totalChunks,
    
    // Hooks
    useDocument,
    useDocumentStatus,
    
    // Utility
    isUploading,
  };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useDocuments;