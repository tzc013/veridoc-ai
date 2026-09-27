// frontend/src/pages.jsx
/**
 * Veridoc AI - Page Components
 * All main application pages: Dashboard, Documents, DocumentDetails, Chat, Settings
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  // Icons
  LayoutDashboard, FileText, MessageSquare, Settings, 
  Upload, Plus, Search, Filter, Download, Trash2, Edit2, Eye,
  CheckCircle, AlertCircle, AlertTriangle, Info, X,
  Loader2, RefreshCw, ChevronDown, ChevronRight, 
  Calendar, Clock, Tag, Link as LinkIcon, Paperclip,
  File, FilePdf, FileWord, FileText as FileTextIcon,
  Send, Mic, Sparkles, Zap, Shield, Database, Server,
  BarChart3, TrendingUp, TrendingDown, Users, FolderOpen,
  Check, XCircle, HelpCircle, BookOpen, Copy, Share2,
  ArrowLeft, ArrowRight, MoreHorizontal, 
  Maximize2, Minimize2, ExternalLink, DownloadCloud,
  Clock as ClockIcon, User, Mail, Phone, MapPin, Building,
  Star, Award, Crown, Flame, Gauge, Percent,
  Activity, Wifi, HardDrive, Cpu, 
  Sun, Moon, Cloud, Wind, Droplets,
  PieChart, LineChart, AreaChart, ScatterChart,
  Grid, List, Columns, Rows,
  Sliders, ToggleLeft, ToggleRight,
  Command, Keyboard, Globe,
  CalendarDays, Clock8, Users2, UserPlus,
  EyeOff, Lock, Unlock, Key,
  Folder, FolderPlus, FolderTree,
  FileArchive, FileCode, FileJson,
  Image, Video, Music, Camera, Play, Pause, Stop,
  CloudOff, CloudUpload, CloudDownload,
  Navigation, Compass, Target, Flag,
  Layers, Grid3x3, Indent, Outdent,
  ListOrdered, ListChecks, CheckSquare, Square,
  MinusCircle, PlusCircle, Help, Info as InfoIcon,
  SunMedium, MoonStar, Sunset, Sunrise,
} from 'lucide-react';

// Import components
import {
  Heading, Text, Button, IconButton, Card, CardHeader, CardTitle, 
  CardDescription, CardContent, CardFooter, Input, Textarea, Select,
  Badge, StatusDot, Avatar, ProgressBar, Tabs, Modal, DropZone,
  Table, TableHead, TableHeader, TableBody, TableRow, TableCell,
  EmptyState, LoadingSpinner, Skeleton, Divider, Tooltip,
  toast
} from './components';

// Import services
import { api } from './services/api';
import { useDocuments } from './hooks/useDocuments';
import { useChat } from './hooks/useChat';
import { useStats } from './hooks/useStats';

// ============================================================================
// DASHBOARD PAGE
// ============================================================================

export const Dashboard = () => {
  const navigate = useNavigate();
  const { stats, isLoading: statsLoading, refetch: refetchStats } = useStats();
  const { documents, isLoading: docsLoading } = useDocuments();
  const [recentActivity, setRecentActivity] = useState([]);
  const [showWelcome, setShowWelcome] = useState(true);
  
  // Stat cards configuration
  const statCards = useMemo(() => {
    if (!stats) return [];
    
    return [
      {
        id: 'documents',
        label: 'Documents',
        value: stats.total_documents || 0,
        icon: FileText,
        change: '+2 this week',
        changeType: 'positive',
        color: 'primary',
      },
      {
        id: 'chunks',
        label: 'Knowledge Chunks',
        value: stats.total_chunks || 0,
        icon: Database,
        change: 'All systems healthy',
        changeType: 'neutral',
        color: 'success',
      },
      {
        id: 'queries',
        label: 'Questions Answered',
        value: stats.total_queries || 0,
        icon: MessageSquare,
        change: `↑ ${stats.query_change_percent || 0}% this week`,
        changeType: 'positive',
        color: 'warning',
      },
      {
        id: 'health',
        label: 'Processing Health',
        value: `${stats.indexing_health || 0}%`,
        icon: Activity,
        change: `${stats.indexed_documents || 0} / ${stats.total_documents || 0} indexed`,
        changeType: stats.indexing_health === 100 ? 'positive' : 'warning',
        color: 'info',
      },
    ];
  }, [stats]);

  // Recent documents
  const recentDocuments = useMemo(() => {
    if (!documents) return [];
    return documents.slice(0, 5);
  }, [documents]);

  // Dismiss welcome banner
  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem('veridoc_welcome_dismissed', 'true');
  };

  // Check if welcome was dismissed previously
  useEffect(() => {
    const dismissed = localStorage.getItem('veridoc_welcome_dismissed');
    if (dismissed === 'true') {
      setShowWelcome(false);
    }
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      {showWelcome && (
        <div className="bg-gradient-to-r from-primary/10 via-surface-elevated to-primary/5 border border-primary/20 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/20">
                <Sparkles className="text-primary" size={24} />
              </div>
              <div>
                <Heading level={4} className="text-text-primary">
                  Welcome to Veridoc AI
                </Heading>
                <Text color="muted" className="mt-1">
                  Upload your documents to start asking questions and building your knowledge base.
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                variant="primary"
                size="sm"
                icon={Upload}
                onClick={() => navigate('/documents')}
                className="flex-1 md:flex-none"
              >
                Upload Documents
              </Button>
              <IconButton
                icon={X}
                variant="ghost"
                size="sm"
                onClick={dismissWelcome}
                label="Dismiss welcome"
              />
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))
        ) : (
          statCards.map((stat) => {
            const IconComponent = stat.icon;
            const ChangeIcon = stat.changeType === 'positive' ? TrendingUp : 
                             stat.changeType === 'negative' ? TrendingDown : null;
            
            return (
              <Card key={stat.id} className="p-6 hover:border-primary/20 transition-all">
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-${stat.color}/10`}>
                    <IconComponent className={`text-${stat.color}`} size={24} />
                  </div>
                  {ChangeIcon && (
                    <Badge 
                      variant={stat.changeType === 'positive' ? 'success' : 'warning'}
                      size="sm"
                    >
                      <ChangeIcon size={12} className="mr-1" />
                      {stat.change}
                    </Badge>
                  )}
                </div>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-text-primary">
                    {stat.value}
                  </div>
                  <Text size="sm" color="muted" className="mt-1">
                    {stat.label}
                  </Text>
                  {stat.changeType === 'neutral' && (
                    <Text size="xs" color="muted" className="mt-1">
                      {stat.change}
                    </Text>
                  )}
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Knowledge Base Status */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
            <CardDescription>Processing health and document status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overall Progress */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Text size="sm" weight="medium">Overall Indexing</Text>
                <Text size="sm" color="muted">
                  {stats?.indexed_documents || 0} / {stats?.total_documents || 0} documents
                </Text>
              </div>
              <ProgressBar 
                value={stats?.indexed_documents || 0} 
                max={stats?.total_documents || 1}
                size="lg"
                variant={stats?.indexing_health === 100 ? 'success' : 'default'}
              />
            </div>

            {/* Document Status Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-surface rounded-lg border border-border">
                <div className="text-2xl font-bold text-text-primary">
                  {stats?.total_documents || 0}
                </div>
                <Text size="xs" color="muted">Total</Text>
              </div>
              <div className="text-center p-4 bg-success/5 rounded-lg border border-success/20">
                <div className="text-2xl font-bold text-success">
                  {stats?.indexed_documents || 0}
                </div>
                <Text size="xs" color="muted">Indexed</Text>
              </div>
              <div className="text-center p-4 bg-warning/5 rounded-lg border border-warning/20">
                <div className="text-2xl font-bold text-warning">
                  {stats?.processing_documents || 0}
                </div>
                <Text size="xs" color="muted">Processing</Text>
              </div>
              <div className="text-center p-4 bg-error/5 rounded-lg border border-error/20">
                <div className="text-2xl font-bold text-error">
                  {stats?.failed_documents || 0}
                </div>
                <Text size="xs" color="muted">Failed</Text>
              </div>
            </div>

            {/* Progress Note */}
            {stats?.indexing_health === 100 && (
              <div className="flex items-center gap-2 p-3 bg-success/5 border border-success/20 rounded-lg">
                <CheckCircle className="text-success" size={18} />
                <Text size="sm" color="success" weight="medium">
                  All documents are successfully indexed and ready for queries.
                </Text>
              </div>
            )}
            {stats?.indexing_health < 100 && stats?.indexing_health > 0 && (
              <div className="flex items-center gap-2 p-3 bg-warning/5 border border-warning/20 rounded-lg">
                <AlertCircle className="text-warning" size={18} />
                <Text size="sm" color="warning" weight="medium">
                  Some documents are still processing. Please wait or check for errors.
                </Text>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="ghost"
              size="sm"
              icon={RefreshCw}
              onClick={() => refetchStats()}
            >
              Refresh
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={ArrowRight}
              iconPosition="right"
              onClick={() => navigate('/documents')}
            >
              View All Documents
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Activity / Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              icon={Upload}
              onClick={() => navigate('/documents')}
            >
              Upload Document
            </Button>
            <Button
              variant="secondary"
              fullWidth
              icon={MessageSquare}
              onClick={() => navigate('/chat')}
            >
              Start New Chat
            </Button>
            <Button
              variant="secondary"
              fullWidth
              icon={Search}
              onClick={() => {
                const event = new KeyboardEvent('keydown', { key: 'k', metaKey: true });
                window.dispatchEvent(event);
              }}
            >
              Search Knowledge Base
              <Badge size="sm" variant="default" className="ml-auto">⌘K</Badge>
            </Button>
          </CardContent>
          <Divider className="my-4" />
          <CardHeader>
            <CardTitle>Recent Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {docsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : recentDocuments.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No documents yet"
                description="Upload your first document to get started"
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Upload}
                    onClick={() => navigate('/documents')}
                  >
                    Upload
                  </Button>
                }
              />
            ) : (
              recentDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-2 hover:bg-surface/50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <div className="p-1.5 rounded bg-surface">
                    {doc.file_type === 'pdf' && <FilePdf size={16} className="text-error" />}
                    {doc.file_type === 'docx' && <FileWord size={16} className="text-primary" />}
                    {doc.file_type === 'txt' && <FileTextIcon size={16} className="text-text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium" className="truncate">
                      {doc.filename}
                    </Text>
                    <Text size="xs" color="muted">
                      {doc.chunk_count || 0} chunks
                    </Text>
                  </div>
                  <StatusDot status={doc.status === 'indexed' ? 'healthy' : doc.status === 'processing' ? 'processing' : 'error'} size="sm" />
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Query Activity Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Query Activity</CardTitle>
          <CardDescription>Questions asked over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">
            <div className="flex items-center gap-4 text-text-muted">
              <BarChart3 size={48} className="opacity-20" />
              <div>
                <Text>Total queries: {stats?.total_queries || 0}</Text>
                <Text size="sm" color="muted">
                  {stats?.queries_this_week || 0} this week
                </Text>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// DOCUMENTS PAGE
// ============================================================================

export const Documents = () => {
  const navigate = useNavigate();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  
  const { documents, isLoading, refetch, deleteDocument, reprocessDocument } = useDocuments();
  const fileInputRef = useRef(null);

  // Filter and sort documents
  const filteredDocuments = useMemo(() => {
    if (!documents) return [];

    let filtered = [...documents];

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.filename.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortBy] || '';
      const bValue = b[sortBy] || '';
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortOrder === 'asc' 
        ? (aValue || 0) - (bValue || 0)
        : (bValue || 0) - (aValue || 0);
    });

    return filtered;
  }, [documents, searchQuery, selectedFilter, sortBy, sortOrder]);

  // Stats
  const stats = useMemo(() => {
    if (!documents) return { total: 0, indexed: 0, processing: 0, failed: 0 };
    return {
      total: documents.length,
      indexed: documents.filter(d => d.status === 'indexed').length,
      processing: documents.filter(d => d.status === 'processing').length,
      failed: documents.filter(d => d.status === 'failed').length,
    };
  }, [documents]);

  // Handle file upload
  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setUploading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading...');

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(((i) / files.length) * 50);
        setUploadStatus(`Uploading ${file.name}...`);
        
        await api.documents.upload(file);
        
        setUploadProgress(((i + 1) / files.length) * 50);
      }

      setUploadStatus('Processing...');
      setUploadProgress(80);
      
      // Wait a moment for processing
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUploadProgress(100);
      setUploadStatus('Complete!');
      
      toast.success(`Successfully uploaded ${files.length} document${files.length > 1 ? 's' : ''}`);
      
      await refetch();
      setIsUploadModalOpen(false);
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  // Handle document deletion
  const handleDelete = async (documentId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    
    try {
      await deleteDocument(documentId);
      toast.success(`Deleted "${filename}"`);
      await refetch();
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
    }
  };

  // Handle document reprocess
  const handleReprocess = async (documentId, filename) => {
    try {
      await reprocessDocument(documentId);
      toast.success(`Reprocessing "${filename}"...`);
      await refetch();
    } catch (error) {
      toast.error(`Failed to reprocess: ${error.message}`);
    }
  };

  // Status filter options
  const filterOptions = [
    { value: 'all', label: 'All Documents' },
    { value: 'indexed', label: 'Indexed' },
    { value: 'processing', label: 'Processing' },
    { value: 'failed', label: 'Failed' },
  ];

  // Sort options
  const sortOptions = [
    { value: 'created_at', label: 'Date Uploaded' },
    { value: 'filename', label: 'Name' },
    { value: 'chunk_count', label: 'Chunks' },
    { value: 'page_count', label: 'Pages' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Heading level={3}>Documents</Heading>
          <Text color="muted">
            Manage the knowledge powering your AI assistant.
          </Text>
        </div>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() => setIsUploadModalOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap gap-4 p-4 bg-surface-elevated rounded-xl border border-border">
        <div className="flex items-center gap-2">
          <FileText size={20} className="text-text-muted" />
          <span className="font-medium text-text-primary">{stats.total}</span>
          <span className="text-text-muted text-sm">Total</span>
        </div>
        <Divider orientation="vertical" className="h-8" />
        <div className="flex items-center gap-2">
          <CheckCircle size={18} className="text-success" />
          <span className="font-medium text-text-primary">{stats.indexed}</span>
          <span className="text-text-muted text-sm">Indexed</span>
        </div>
        <Divider orientation="vertical" className="h-8" />
        <div className="flex items-center gap-2">
          <Loader2 size={18} className="text-warning animate-spin" />
          <span className="font-medium text-text-primary">{stats.processing}</span>
          <span className="text-text-muted text-sm">Processing</span>
        </div>
        <Divider orientation="vertical" className="h-8" />
        <div className="flex items-center gap-2">
          <AlertCircle size={18} className="text-error" />
          <span className="font-medium text-text-primary">{stats.failed}</span>
          <span className="text-text-muted text-sm">Failed</span>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={Search}
          />
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            options={filterOptions}
            className="w-40"
          />
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={sortOptions}
            className="w-40"
          />
          <IconButton
            icon={sortOrder === 'asc' ? ArrowUp : ArrowDown}
            variant="secondary"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            label={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
          />
          <IconButton
            icon={viewMode === 'list' ? Grid : List}
            variant="secondary"
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            label={viewMode === 'list' ? 'Grid view' : 'List view'}
          />
        </div>
      </div>

      {/* Document List/Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-5 w-48 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <Skeleton className="h-8 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : filteredDocuments.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={searchQuery ? 'No matching documents' : 'No documents uploaded'}
          description={searchQuery 
            ? 'Try adjusting your search or filters'
            : 'Upload your first document to start building your knowledge base'
          }
          action={
            !searchQuery && (
              <Button
                variant="primary"
                icon={Upload}
                onClick={() => setIsUploadModalOpen(true)}
              >
                Upload Document
              </Button>
            )
          }
        />
      ) : viewMode === 'list' ? (
        <Card className="overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Document</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Chunks</TableHeader>
                <TableHeader>Pages</TableHeader>
                <TableHeader>Uploaded</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {filteredDocuments.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <div 
                      className="flex items-center gap-3 cursor-pointer"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                    >
                      <div className="p-1.5 rounded bg-surface">
                        {doc.file_type === 'pdf' && <FilePdf size={20} className="text-error" />}
                        {doc.file_type === 'docx' && <FileWord size={20} className="text-primary" />}
                        {doc.file_type === 'txt' && <FileTextIcon size={20} className="text-text-muted" />}
                      </div>
                      <div className="min-w-0">
                        <Text weight="medium" className="truncate">
                          {doc.filename}
                        </Text>
                        <Text size="xs" color="muted">
                          {doc.file_type.toUpperCase()} · {(doc.file_size / 1024 / 1024).toFixed(1)} MB
                        </Text>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusDot 
                      status={doc.status === 'indexed' ? 'healthy' : doc.status === 'processing' ? 'processing' : 'error'} 
                      label={doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                    />
                  </TableCell>
                  <TableCell>{doc.chunk_count || 0}</TableCell>
                  <TableCell>{doc.page_count || 0}</TableCell>
                  <TableCell>
                    <Text size="sm" color="muted">
                      {new Date(doc.created_at * 1000).toLocaleDateString()}
                    </Text>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Tooltip content="View details">
                        <IconButton
                          icon={Eye}
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/documents/${doc.id}`)}
                          label="View"
                        />
                      </Tooltip>
                      <Tooltip content="Reprocess">
                        <IconButton
                          icon={RefreshCw}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReprocess(doc.id, doc.filename)}
                          label="Reprocess"
                          disabled={doc.status === 'processing'}
                        />
                      </Tooltip>
                      <Tooltip content="Delete">
                        <IconButton
                          icon={Trash2}
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(doc.id, doc.filename)}
                          label="Delete"
                        />
                      </Tooltip>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((doc) => (
            <Card key={doc.id} className="p-4 hover:border-primary/30 transition-colors cursor-pointer" hover>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-surface">
                    {doc.file_type === 'pdf' && <FilePdf size={24} className="text-error" />}
                    {doc.file_type === 'docx' && <FileWord size={24} className="text-primary" />}
                    {doc.file_type === 'txt' && <FileTextIcon size={24} className="text-text-muted" />}
                  </div>
                  <div>
                    <Text weight="medium" className="truncate max-w-[150px]">
                      {doc.filename}
                    </Text>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge size="sm" variant={doc.status === 'indexed' ? 'success' : doc.status === 'processing' ? 'warning' : 'error'}>
                        {doc.status}
                      </Badge>
                    </div>
                  </div>
                </div>
                <IconButton
                  icon={MoreHorizontal}
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Show menu
                  }}
                  label="More"
                />
              </div>
              <div className="mt-4 flex items-center gap-4 text-sm text-text-muted">
                <span>📄 {doc.chunk_count || 0} chunks</span>
                <span>📑 {doc.page_count || 0} pages</span>
                <span>📅 {new Date(doc.created_at * 1000).toLocaleDateString()}</span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => !uploading && setIsUploadModalOpen(false)}
        title="Upload Documents"
        size="lg"
      >
        <div className="space-y-4">
          {uploading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="text-primary animate-spin" size={24} />
                <div>
                  <Text weight="medium">{uploadStatus}</Text>
                  <Text size="sm" color="muted">Please wait while your document is processed</Text>
                </div>
              </div>
              <ProgressBar value={uploadProgress} max={100} showLabel size="lg" />
              <div className="flex justify-center">
                <div className="flex items-center gap-2 text-text-muted">
                  <Database size={16} />
                  <Text size="sm">Extracting text → Chunking → Embedding → Indexing</Text>
                </div>
              </div>
            </div>
          ) : (
            <DropZone
              onDrop={handleFileUpload}
              accept=".pdf,.docx,.txt"
              maxSize={20 * 1024 * 1024}
              multiple
              label="Drop documents here"
              subLabel="or click to browse"
              icon={Upload}
            />
          )}
        </div>
      </Modal>
    </div>
  );
};

// ============================================================================
// DOCUMENT DETAILS PAGE
// ============================================================================

export const DocumentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contentPreview, setContentPreview] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load document details
  useEffect(() => {
    const loadDocument = async () => {
      if (!id) return;
      
      setIsLoading(true);
      try {
        const data = await api.documents.getById(id);
        setDocument(data);
        setContentPreview(data.content_preview || []);
      } catch (error) {
        toast.error(`Failed to load document: ${error.message}`);
        navigate('/documents');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [id, navigate]);

  // Handle reprocess
  const handleReprocess = async () => {
    if (!document) return;
    
    setIsReprocessing(true);
    try {
      await api.documents.reprocess(document.id);
      toast.success('Document reprocessing started');
      
      // Refresh document
      const data = await api.documents.getById(id);
      setDocument(data);
    } catch (error) {
      toast.error(`Failed to reprocess: ${error.message}`);
    } finally {
      setIsReprocessing(false);
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!document) return;
    
    if (!confirm(`Are you sure you want to delete "${document.filename}"?`)) return;
    
    setIsDeleting(true);
    try {
      await api.documents.delete(document.id);
      toast.success('Document deleted successfully');
      navigate('/documents');
    } catch (error) {
      toast.error(`Failed to delete: ${error.message}`);
      setIsDeleting(false);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'content', label: 'Content Preview' },
    { id: 'sources', label: 'Sources' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-12 w-64" />
        <Card className="p-6 space-y-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </Card>
      </div>
    );
  }

  if (!document) {
    return (
      <EmptyState
        icon={FileText}
        title="Document not found"
        description="The document you're looking for doesn't exist"
        action={
          <Button
            variant="primary"
            icon={ArrowLeft}
            onClick={() => navigate('/documents')}
          >
            Back to Documents
          </Button>
        }
      />
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'indexed': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4">
        <IconButton
          icon={ArrowLeft}
          variant="ghost"
          onClick={() => navigate('/documents')}
          label="Back"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-surface">
              {document.file_type === 'pdf' && <FilePdf size={32} className="text-error" />}
              {document.file_type === 'docx' && <FileWord size={32} className="text-primary" />}
              {document.file_type === 'txt' && <FileTextIcon size={32} className="text-text-muted" />}
            </div>
            <div>
              <Heading level={3} className="truncate">{document.filename}</Heading>
              <div className="flex items-center gap-3 mt-1">
                <Badge variant={getStatusColor(document.status)}>
                  {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                </Badge>
                <Text size="sm" color="muted">
                  {document.file_type.toUpperCase()} · {(document.file_size / 1024 / 1024).toFixed(1)} MB
                </Text>
                <Text size="sm" color="muted">
                  Uploaded {new Date(document.created_at * 1000).toLocaleDateString()}
                </Text>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip content="Reprocess document">
            <Button
              variant="secondary"
              size="sm"
              icon={RefreshCw}
              onClick={handleReprocess}
              loading={isReprocessing}
              disabled={document.status === 'processing'}
            >
              Reprocess
            </Button>
          </Tooltip>
          <Tooltip content="Delete document">
            <Button
              variant="danger"
              size="sm"
              icon={Trash2}
              onClick={handleDelete}
              loading={isDeleting}
            >
              Delete
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Content based on active tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Document Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">File Name</Text>
                <Text weight="medium">{document.filename}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">File Type</Text>
                <Text weight="medium">{document.file_type.toUpperCase()}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">File Size</Text>
                <Text weight="medium">{(document.file_size / 1024 / 1024).toFixed(2)} MB</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">Pages</Text>
                <Text weight="medium">{document.page_count || 0}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">Chunks</Text>
                <Text weight="medium">{document.chunk_count || 0}</Text>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <Text color="muted">Status</Text>
                <Badge variant={getStatusColor(document.status)}>
                  {document.status}
                </Badge>
              </div>
              <div className="flex justify-between py-2">
                <Text color="muted">Uploaded</Text>
                <Text weight="medium">
                  {new Date(document.created_at * 1000).toLocaleString()}
                </Text>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Processing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Database size={18} className="text-primary" />
                  <Text weight="medium">Embedding Model</Text>
                </div>
                <Text size="sm" color="muted">all-MiniLM-L6-v2</Text>
              </div>
              <div className="p-4 bg-surface rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <Server size={18} className="text-primary" />
                  <Text weight="medium">Chunking Strategy</Text>
                </div>
                <Text size="sm" color="muted">
                  Size: 800 tokens · Overlap: 150 tokens
                </Text>
              </div>
              {document.status === 'indexed' && (
                <div className="p-4 bg-success/5 border border-success/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={18} className="text-success" />
                    <Text weight="medium" color="success">
                      Document successfully indexed and ready for queries
                    </Text>
                  </div>
                </div>
              )}
              {document.status === 'failed' && document.error_message && (
                <div className="p-4 bg-error/5 border border-error/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={18} className="text-error mt-0.5" />
                    <div>
                      <Text weight="medium" color="error">
                        Processing failed
                      </Text>
                      <Text size="sm" color="muted" className="mt-1">
                        {document.error_message}
                      </Text>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'content' && (
        <Card>
          <CardHeader>
            <CardTitle>Extracted Content Preview</CardTitle>
            <CardDescription>
              Preview of the extracted text from your document
            </CardDescription>
          </CardHeader>
          <CardContent>
            {contentPreview.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No content preview available"
                description="The document content hasn't been extracted yet or is empty"
              />
            ) : (
              <div className="space-y-4">
                {contentPreview.map((chunk, index) => (
                  <div key={index} className="p-4 bg-surface rounded-lg border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge size="sm" variant="primary">
                        Page {chunk.page_number || 1}
                      </Badge>
                      <Badge size="sm" variant="default">
                        Chunk {index + 1}
                      </Badge>
                    </div>
                    <Text size="sm" className="whitespace-pre-wrap">
                      {chunk.text || 'No text content available'}
                    </Text>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'sources' && (
        <Card>
          <CardHeader>
            <CardTitle>Source References</CardTitle>
            <CardDescription>
              Documents and chunks that have been referenced in answers
            </CardDescription>
          </CardHeader>
          <CardContent>
            {document.source_count === 0 ? (
              <EmptyState
                icon={LinkIcon}
                title="No sources yet"
                description="This document hasn't been referenced in any answers yet"
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-4 bg-surface rounded-lg border border-border">
                  <Database size={18} className="text-text-muted" />
                  <Text>
                    This document has been referenced in <strong>{document.source_count}</strong> answers
                  </Text>
                </div>
                {/* Source list would go here */}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ============================================================================
// CHAT PAGE
// ============================================================================

export const Chat = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await api.chat.getSessions();
      setSessions(data);
      
      // If no sessionId, create or select first
      if (!sessionId && data.length > 0) {
        navigate(`/chat/${data[0].id}`);
      }
    } catch (error) {
      toast.error(`Failed to load sessions: ${error.message}`);
    }
  }, [navigate, sessionId]);

  // Load session messages
  const loadSession = useCallback(async (id) => {
    if (!id) return;
    
    try {
      const data = await api.chat.getSession(id);
      setCurrentSession(data);
      setMessages(data.messages || []);
    } catch (error) {
      toast.error(`Failed to load session: ${error.message}`);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId);
    }
  }, [sessionId, loadSession]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Create new session
  const createNewSession = async () => {
    try {
      const data = await api.chat.createSession({ title: 'New Chat' });
      setSessions([data, ...sessions]);
      navigate(`/chat/${data.id}`);
      setMessages([]);
      setCurrentSession(data);
    } catch (error) {
      toast.error(`Failed to create session: ${error.message}`);
    }
  };

  // Delete session
  const deleteSession = async (id) => {
    if (!confirm('Delete this chat session?')) return;
    
    try {
      await api.chat.deleteSession(id);
      setSessions(sessions.filter(s => s.id !== id));
      
      if (id === sessionId) {
        const remaining = sessions.filter(s => s.id !== id);
        if (remaining.length > 0) {
          navigate(`/chat/${remaining[0].id}`);
        } else {
          navigate('/chat');
          setMessages([]);
          setCurrentSession(null);
        }
      }
      
      toast.success('Chat session deleted');
    } catch (error) {
      toast.error(`Failed to delete session: ${error.message}`);
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    if (!sessionId) {
      await createNewSession();
      // Wait for session creation then send
      setTimeout(() => sendMessage(), 100);
      return;
    }

    const question = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setIsLoading(true);

    try {
      const response = await api.chat.sendMessage(sessionId, { question });
      
      // Add assistant message
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.answer,
        sources: response.sources || []
      }]);

      // Update session list
      await loadSessions();

      // Show sources in toast
      if (response.sources && response.sources.length > 0) {
        toast.success(`Found ${response.sources.length} source${response.sources.length > 1 ? 's' : ''}`, {
          duration: 3000
        });
      }

    } catch (error) {
      toast.error(`Failed to send message: ${error.message}`);
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.content !== question || m.role !== 'user'));
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for session grouping
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString();
  };

  // Group sessions by date
  const groupedSessions = useMemo(() => {
    const groups = {};
    sessions.forEach(session => {
      const date = formatDate(session.created_at);
      if (!groups[date]) groups[date] = [];
      groups[date].push(session);
    });
    return groups;
  }, [sessions]);

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6 animate-fade-in">
      {/* Session List */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <Card className="h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <Button
              variant="primary"
              fullWidth
              icon={Plus}
              onClick={createNewSession}
              size="sm"
            >
              New Chat
            </Button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            {Object.entries(groupedSessions).map(([date, sessionList]) => (
              <div key={date}>
                <Text size="xs" color="muted" className="px-3 py-1 uppercase font-semibold">
                  {date}
                </Text>
                {sessionList.map(session => (
                  <div
                    key={session.id}
                    className={`
                      group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all
                      ${session.id === sessionId 
                        ? 'bg-primary/10 text-primary' 
                        : 'hover:bg-surface text-text-secondary hover:text-text-primary'
                      }
                    `}
                    onClick={() => {
                      if (session.id !== sessionId) {
                        navigate(`/chat/${session.id}`);
                      }
                    }}
                  >
                    <MessageSquare size={16} className="flex-shrink-0" />
                    <span className="flex-1 truncate text-sm">
                      {session.title || 'New Chat'}
                    </span>
                    <IconButton
                      icon={Trash2}
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      label="Delete"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                ))}
              </div>
            ))}
            {sessions.length === 0 && (
              <div className="text-center py-8">
                <MessageSquare size={32} className="text-text-muted mx-auto mb-2" />
                <Text size="sm" color="muted">No chat sessions yet</Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={createNewSession}
                  className="mt-2"
                >
                  Start a new chat
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Card className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <Text weight="medium">
                  {currentSession?.title || 'Veridoc AI Assistant'}
                </Text>
                <Text size="xs" color="muted">
                  {messages.length > 0 ? `${messages.length} messages` : 'Ask anything about your documents'}
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge size="sm" variant="success" className="hidden sm:flex">
                <div className="w-1.5 h-1.5 rounded-full bg-success mr-1.5 animate-pulse" />
                Online
              </Badge>
              <IconButton
                icon={RefreshCw}
                variant="ghost"
                size="sm"
                onClick={() => loadSession(sessionId)}
                label="Refresh"
              />
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-6 rounded-full bg-primary/5 mb-4">
                  <Sparkles size={48} className="text-primary" />
                </div>
                <Heading level={4}>How can I help you?</Heading>
                <Text color="muted" className="max-w-md mt-2">
                  Ask questions about your documents and I'll find the answers with sources.
                </Text>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInput('What properties are available below PKR 50 million?');
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    🔍 Find properties under 50M
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInput('What is the property sales commission?');
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    💰 Check commission
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setInput('What services does Northstar Estates offer?');
                      setTimeout(() => sendMessage(), 100);
                    }}
                  >
                    🏢 Company services
                  </Button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`
                    flex gap-3 animate-fade-in
                    ${msg.role === 'user' ? 'justify-end' : 'justify-start'}
                  `}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`
                      max-w-[85%] rounded-2xl px-4 py-3
                      ${msg.role === 'user' 
                        ? 'bg-primary text-white rounded-br-sm' 
                        : 'bg-surface-elevated border border-border rounded-bl-sm'
                      }
                    `}
                  >
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <Text size="xs" color="muted" className="mb-2">
                          Sources:
                        </Text>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, si) => (
                            <span
                              key={si}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-surface rounded text-xs text-text-muted border border-border"
                            >
                              <FileText size={12} />
                              {source.document_name}
                              {source.page_number && ` · p.${source.page_number}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <Text size="xs" color="muted" className="mt-1 opacity-50 text-right">
                      {formatTime(msg.created_at)}
                    </Text>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-text-muted" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="bg-surface-elevated border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2 items-end">
              <Textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your knowledge base..."
                className="flex-1"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
              />
              <Button
                variant="primary"
                size="lg"
                icon={Send}
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                className="flex-shrink-0"
              >
                Send
              </Button>
            </div>
            <Text size="xs" color="muted" className="mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </Text>
          </div>
        </Card>
      </div>
    </div>
  );
};

// ============================================================================
// SETTINGS PAGE
// ============================================================================

export const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    theme: 'dark',
    language: 'en',
    notifications: true,
    autoSave: true,
    showSources: true,
    model: 'gemini-1.5-flash',
    temperature: 0.2,
    maxTokens: 1000,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load settings from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('veridoc_settings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }
  }, []);

  // Save settings
  const saveSettings = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('veridoc_settings', JSON.stringify(settings));
      toast.success('Settings saved successfully');
    } catch (error) {
      toast.error(`Failed to save settings: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'llm', label: 'AI & Model' },
    { id: 'documents', label: 'Documents' },
    { id: 'privacy', label: 'Privacy & Security' },
    { id: 'about', label: 'About' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <Heading level={3}>Settings</Heading>
        <Text color="muted">Configure your application preferences</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1">
          <Card>
            <div className="p-2 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                    ${activeTab === tab.id 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'text-text-secondary hover:bg-surface hover:text-text-primary'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <Card>
            {activeTab === 'general' && (
              <div className="space-y-6">
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Basic application preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Theme</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Button
                        variant={settings.theme === 'dark' ? 'primary' : 'secondary'}
                        size="sm"
                        icon={Moon}
                        onClick={() => setSettings({ ...settings, theme: 'dark' })}
                      >
                        Dark
                      </Button>
                      <Button
                        variant={settings.theme === 'light' ? 'primary' : 'secondary'}
                        size="sm"
                        icon={Sun}
                        onClick={() => setSettings({ ...settings, theme: 'light' })}
                      >
                        Light
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>Language</Label>
                    <Select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      options={[
                        { value: 'en', label: 'English' },
                        { value: 'es', label: 'Spanish' },
                        { value: 'fr', label: 'French' },
                        { value: 'de', label: 'German' },
                      ]}
                      className="mt-1.5"
                    />
                  </div>
                </CardContent>
              </div>
            )}

            {activeTab === 'llm' && (
              <div className="space-y-6">
                <CardHeader>
                  <CardTitle>AI & Model Settings</CardTitle>
                  <CardDescription>Configure the AI model and generation parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Model</Label>
                    <Select
                      value={settings.model}
                      onChange={(e) => setSettings({ ...settings, model: e.target.value })}
                      options={[
                        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
                        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
                        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
                        { value: 'gpt-4', label: 'GPT-4' },
                      ]}
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label>Temperature: {settings.temperature}</Label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.temperature}
                      onChange={(e) => setSettings({ ...settings, temperature: parseFloat(e.target.value) })}
                      className="w-full mt-1.5"
                    />
                    <Text size="xs" color="muted">Lower = more focused, Higher = more creative</Text>
                  </div>
                  <div>
                    <Label>Max Tokens: {settings.maxTokens}</Label>
                    <input
                      type="range"
                      min="100"
                      max="4000"
                      step="100"
                      value={settings.maxTokens}
                      onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) })}
                      className="w-full mt-1.5"
                    />
                  </div>
                </CardContent>
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-6">
                <CardHeader>
                  <CardTitle>Document Settings</CardTitle>
                  <CardDescription>Configure document processing preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Text weight="medium">Show Sources</Text>
                      <Text size="sm" color="muted">Display source references in answers</Text>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, showSources: !settings.showSources })}
                      className={`p-2 rounded-lg transition-colors ${settings.showSources ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'}`}
                    >
                      {settings.showSources ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Text weight="medium">Auto-Save</Text>
                      <Text size="sm" color="muted">Automatically save chat history</Text>
                    </div>
                    <button
                      onClick={() => setSettings({ ...settings, autoSave: !settings.autoSave })}
                      className={`p-2 rounded-lg transition-colors ${settings.autoSave ? 'bg-primary/20 text-primary' : 'bg-surface text-text-muted'}`}
                    >
                      {settings.autoSave ? <Check size={18} /> : <X size={18} />}
                    </button>
                  </div>
                </CardContent>
              </div>
            )}

            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <CardHeader>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>Manage your data and privacy settings</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Text weight="medium">Data Collection</Text>
                      <Text size="sm" color="muted">Allow anonymous usage data collection</Text>
                    </div>
                    <button className="p-2 rounded-lg bg-success/20 text-success">
                      <Check size={18} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-border/50">
                    <div>
                      <Text weight="medium">Share Data with AI Models</Text>
                      <Text size="sm" color="muted">Allow document data to be processed by AI models</Text>
                    </div>
                    <button className="p-2 rounded-lg bg-surface text-text-muted">
                      <X size={18} />
                    </button>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={Trash2}
                    onClick={() => {
                      if (confirm('Delete all your data? This cannot be undone.')) {
                        toast.success('Data deletion requested');
                      }
                    }}
                  >
                    Delete All Data
                  </Button>
                </CardContent>
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <CardHeader>
                  <CardTitle>About Veridoc AI</CardTitle>
                  <CardDescription>Version information and resources</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-surface rounded-lg border border-border">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <Sparkles size={32} className="text-primary" />
                    </div>
                    <div>
                      <Heading level={5}>Veridoc AI</Heading>
                      <Text size="sm" color="muted">Version 1.0.0</Text>
                      <Text size="sm" color="muted">Ask your documents. Trust the answer.</Text>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Text weight="medium">Tech Stack</Text>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="primary">React 18</Badge>
                      <Badge variant="primary">Vite</Badge>
                      <Badge variant="primary">FastAPI</Badge>
                      <Badge variant="primary">ChromaDB</Badge>
                      <Badge variant="primary">Gemini</Badge>
                      <Badge variant="primary">Tailwind</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="secondary" size="sm" icon={ExternalLink}>
                      Documentation
                    </Button>
                    <Button variant="secondary" size="sm" icon={Github}>
                      GitHub
                    </Button>
                  </div>
                </CardContent>
              </div>
            )}

            {/* Save Button */}
            <div className="p-4 border-t border-border">
              <Button
                variant="primary"
                onClick={saveSettings}
                loading={isSaving}
                icon={Check}
              >
                Save Settings
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  Dashboard,
  Documents,
  DocumentDetails,
  Chat,
  Settings,
};