// frontend/src/components.jsx
/**
 * Veridoc AI - Component Library
 * All reusable UI components for the application
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, forwardRef, Children, cloneElement, isValidElement } from 'react';
import { 
  // Layout & Navigation
  Menu, X, ChevronDown, ChevronRight, ChevronLeft, ChevronsRight, ChevronsLeft,
  LayoutDashboard, FileText, MessageSquare, Settings, Home, FolderOpen, 
  Folder, File, FilePlus, Upload, Download, Trash2, Edit2, Eye, EyeOff,
  Plus, Minus, Search, Bell, User, LogOut, HelpCircle, BookOpen, 
  BarChart3, Users, Database, Server, Cpu, HardDrive, Activity,
  Sparkles, Zap, Shield, Clock, Calendar, Tag, Link, Paperclip,
  
  // Actions
  Check, X as XIcon, CheckCircle, AlertCircle, AlertTriangle, Info,
  ThumbsUp, ThumbsDown, Copy, Share2, Bookmark, MoreHorizontal,
  RefreshCw, ArrowRight, ArrowLeft, ArrowUp, ArrowDown,
  Maximize2, Minimize2, XCircle, CheckSquare, Square,
  
  // Status
  Loader2, Wifi, WifiOff, Power, PowerOff, Signal, SignalLow, SignalMedium,
  SignalHigh, Battery, BatteryCharging, BatteryWarning, BatteryFull,
  
  // File Types
  FilePdf, FileWord, FileText as FileTextIcon, FileSpreadsheet,
  FileImage, FileVideo, FileAudio, FileArchive, FileCode,
  
  // Communication
  Send, Mic, Phone, Mail, MessageCircle, MessageSquare as MessageSquareIcon,
  
  // Media
  Image, Video, Music, Camera, Play, Pause, Stop, SkipForward, SkipBack,
  
  // Charts & Data
  PieChart, LineChart, AreaChart, BarChart, ScatterChart, Radar,
  TrendingUp, TrendingDown, DollarSign, Percent, Gauge,
  
  // UI Elements
  Sliders, ToggleLeft, ToggleRight, Grid, List, Columns, Rows,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  
  // Misc
  Command, Keyboard, Globe, MailOpen, PhoneCall, MapPin, Navigation,
  Compass, Target, Flag, Feather, Layers, Grid3x3,
  Indent, Outdent, ListOrdered, ListChecks,
  MinusCircle, PlusCircle, Help, Info as InfoIcon,
  Cloud, CloudOff, CloudUpload, CloudDownload,
  Sun, Moon, Wind, Droplets, Thermometer,
  EyeOff as EyeOffIcon, Lock, Unlock, Key,
  CalendarDays, Clock8, Users2, UserPlus, UserCheck, UserMinus,
  
  // Dark Mode Icons (additional)
  MoonStar, SunMedium, Sunset, Sunrise,
} from 'lucide-react';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

export const LoadingSpinner = ({ size = 'md', className = '', color = 'primary' }) => {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };
  
  const colorMap = {
    primary: 'text-primary',
    white: 'text-white',
    gray: 'text-text-muted',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning'
  };
  
  return (
    <Loader2 className={`animate-spin ${sizeMap[size] || sizeMap.md} ${colorMap[color] || colorMap.primary} ${className}`} />
  );
};

export const Skeleton = ({ className = '', variant = 'text' }) => {
  const variants = {
    text: 'h-4 rounded bg-surface-elevated animate-pulse',
    title: 'h-8 rounded-lg bg-surface-elevated animate-pulse',
    card: 'h-32 rounded-xl bg-surface-elevated animate-pulse',
    avatar: 'h-10 w-10 rounded-full bg-surface-elevated animate-pulse',
    badge: 'h-6 w-16 rounded-full bg-surface-elevated animate-pulse',
    button: 'h-10 rounded-lg bg-surface-elevated animate-pulse',
    input: 'h-10 rounded-lg bg-surface-elevated animate-pulse',
  };
  
  return <div className={`${variants[variant] || variants.text} ${className}`} />;
};

export const Divider = ({ className = '', orientation = 'horizontal', label = null }) => {
  if (orientation === 'vertical') {
    return <div className={`w-px bg-border ${className}`} />;
  }
  
  if (label) {
    return (
      <div className={`relative flex items-center ${className}`}>
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-xs text-text-muted">{label}</span>
        <div className="flex-grow border-t border-border"></div>
      </div>
    );
  }
  
  return <div className={`border-t border-border ${className}`} />;
};

// ============================================================================
// TYPOGRAPHY COMPONENTS
// ============================================================================

export const Heading = ({ 
  level = 1, 
  children, 
  className = '', 
  weight = 'bold',
  color = 'primary'
}) => {
  const levels = {
    1: 'text-4xl',
    2: 'text-3xl',
    3: 'text-2xl',
    4: 'text-xl',
    5: 'text-lg',
    6: 'text-base'
  };
  
  const weights = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    extrabold: 'font-extrabold'
  };
  
  const colors = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    white: 'text-white'
  };
  
  const Tag = `h${Math.min(Math.max(level, 1), 6)}`;
  
  return (
    <Tag className={`${levels[level] || levels[1]} ${weights[weight] || weights.bold} ${colors[color] || colors.primary} ${className}`}>
      {children}
    </Tag>
  );
};

export const Text = ({ 
  children, 
  className = '', 
  size = 'base',
  weight = 'normal',
  color = 'secondary',
  as = 'p'
}) => {
  const sizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };
  
  const weights = {
    thin: 'font-thin',
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };
  
  const colors = {
    primary: 'text-text-primary',
    secondary: 'text-text-secondary',
    muted: 'text-text-muted',
    white: 'text-white',
    success: 'text-success',
    error: 'text-error',
    warning: 'text-warning'
  };
  
  const Tag = as;
  
  return (
    <Tag className={`${sizes[size] || sizes.base} ${weights[weight] || weights.normal} ${colors[color] || colors.secondary} ${className}`}>
      {children}
    </Tag>
  );
};

export const Label = ({ children, htmlFor, className = '', required = false }) => {
  return (
    <label htmlFor={htmlFor} className={`text-sm font-medium text-text-secondary ${className}`}>
      {children}
      {required && <span className="text-error ml-1">*</span>}
    </label>
  );
};

// ============================================================================
// BUTTON COMPONENTS
// ============================================================================

export const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  onClick,
  type = 'button',
  fullWidth = false,
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:bg-primary/50',
    secondary: 'bg-surface-elevated text-text-primary border border-border hover:bg-surface active:bg-surface/80 disabled:opacity-50',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface/50 active:bg-surface/80 disabled:opacity-50',
    danger: 'bg-error text-white hover:bg-error/90 active:bg-error/80 disabled:opacity-50',
    success: 'bg-success text-white hover:bg-success/90 active:bg-success/80 disabled:opacity-50',
    warning: 'bg-warning text-white hover:bg-warning/90 active:bg-warning/80 disabled:opacity-50',
    outline: 'border-2 border-primary text-primary hover:bg-primary/10 active:bg-primary/20 disabled:opacity-50'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg'
  };
  
  const IconComponent = icon;
  
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${fullWidth ? 'w-full' : ''}
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background
        disabled:cursor-not-allowed
        ${className}
      `}
      {...props}
    >
      {loading && <LoadingSpinner size="sm" color="white" />}
      {!loading && IconComponent && iconPosition === 'left' && <IconComponent size={size === 'sm' ? 16 : 20} />}
      <span>{children}</span>
      {!loading && IconComponent && iconPosition === 'right' && <IconComponent size={size === 'sm' ? 16 : 20} />}
    </button>
  );
});

Button.displayName = 'Button';

export const IconButton = forwardRef(({
  icon: IconComponent,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled = false,
  loading = false,
  label = '',
  onClick,
  type = 'button',
  ...props
}, ref) => {
  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-hover active:bg-primary-active disabled:opacity-50',
    secondary: 'bg-surface-elevated text-text-primary border border-border hover:bg-surface active:bg-surface/80 disabled:opacity-50',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface/50 active:bg-surface/80 disabled:opacity-50',
    danger: 'text-error hover:bg-error/10 active:bg-error/20 disabled:opacity-50',
    success: 'text-success hover:bg-success/10 active:bg-success/20 disabled:opacity-50',
  };
  
  const sizes = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };
  
  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };
  
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${variants[variant] || variants.ghost}
        ${sizes[size] || sizes.md}
        rounded-lg
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-primary/50
        disabled:cursor-not-allowed
        relative
        ${className}
      `}
      aria-label={label}
      title={label}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size={size} color="current" />
      ) : (
        <IconComponent size={iconSizes[size] || iconSizes.md} />
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';

// ============================================================================
// INPUT COMPONENTS
// ============================================================================

export const Input = forwardRef(({
  label,
  error,
  helper,
  className = '',
  icon: IconComponent,
  iconPosition = 'left',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const inputId = useMemo(() => `input-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label htmlFor={inputId} required={required} className="mb-1.5">
          {label}
        </Label>
      )}
      <div className="relative">
        {IconComponent && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
            <IconComponent size={18} />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          className={`
            w-full
            px-4 py-2.5
            bg-surface-elevated
            border border-border
            rounded-lg
            text-text-primary
            placeholder-text-muted
            transition-colors
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
            ${IconComponent && iconPosition === 'left' ? 'pl-10' : ''}
            ${IconComponent && iconPosition === 'right' ? 'pr-10' : ''}
          `}
          {...props}
        />
        {IconComponent && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
            <IconComponent size={18} />
          </div>
        )}
        {error && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className="text-error" size={18} />
          </div>
        )}
      </div>
      {error && <Text size="sm" color="error" className="mt-1">{error}</Text>}
      {helper && !error && <Text size="sm" color="muted" className="mt-1">{helper}</Text>}
    </div>
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({
  label,
  error,
  helper,
  className = '',
  rows = 4,
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const textareaId = useMemo(() => `textarea-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label htmlFor={textareaId} required={required} className="mb-1.5">
          {label}
        </Label>
      )}
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        disabled={disabled}
        className={`
          w-full
          px-4 py-2.5
          bg-surface-elevated
          border border-border
          rounded-lg
          text-text-primary
          placeholder-text-muted
          transition-colors
          resize-y min-h-[80px]
          focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
        `}
        {...props}
      />
      {error && <Text size="sm" color="error" className="mt-1">{error}</Text>}
      {helper && !error && <Text size="sm" color="muted" className="mt-1">{helper}</Text>}
    </div>
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({
  label,
  error,
  helper,
  className = '',
  options = [],
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const selectId = useMemo(() => `select-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <div className={`w-full ${className}`}>
      {label && (
        <Label htmlFor={selectId} required={required} className="mb-1.5">
          {label}
        </Label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          disabled={disabled}
          className={`
            w-full
            px-4 py-2.5
            pr-10
            bg-surface-elevated
            border border-border
            rounded-lg
            text-text-primary
            appearance-none
            transition-colors
            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-error focus:border-error focus:ring-error/20' : ''}
          `}
          {...props}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={18} />
      </div>
      {error && <Text size="sm" color="error" className="mt-1">{error}</Text>}
      {helper && !error && <Text size="sm" color="muted" className="mt-1">{helper}</Text>}
    </div>
  );
});

Select.displayName = 'Select';

export const Checkbox = forwardRef(({
  label,
  error,
  className = '',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const checkboxId = useMemo(() => `checkbox-${Math.random().toString(36).substr(2, 9)}`, []);
  
  return (
    <div className={`${className}`}>
      <div className="flex items-start gap-3">
        <div className="relative flex items-center">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            disabled={disabled}
            className={`
              w-4 h-4
              mt-0.5
              bg-surface-elevated
              border border-border
              rounded
              text-primary
              focus:ring-2 focus:ring-primary/20 focus:ring-offset-2 focus:ring-offset-background
              disabled:opacity-50 disabled:cursor-not-allowed
              ${error ? 'border-error' : ''}
              transition-colors
            `}
            {...props}
          />
        </div>
        {label && (
          <Label htmlFor={checkboxId} required={required} className="cursor-pointer select-none text-sm">
            {label}
          </Label>
        )}
      </div>
      {error && <Text size="sm" color="error" className="mt-1 ml-7">{error}</Text>}
    </div>
  );
});

Checkbox.displayName = 'Checkbox';

// ============================================================================
// CARD COMPONENTS
// ============================================================================

export const Card = ({ children, className = '', hover = false, padding = true }) => {
  return (
    <div className={`
      bg-surface-elevated
      border border-border
      rounded-xl
      ${padding ? 'p-4 md:p-6' : ''}
      ${hover ? 'hover:border-primary/30 transition-colors cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
};

export const CardHeader = ({ children, className = '' }) => {
  return <div className={`flex items-center justify-between mb-4 ${className}`}>{children}</div>;
};

export const CardTitle = ({ children, className = '' }) => {
  return <Heading level={4} className={className}>{children}</Heading>;
};

export const CardDescription = ({ children, className = '' }) => {
  return <Text size="sm" color="muted" className={className}>{children}</Text>;
};

export const CardContent = ({ children, className = '' }) => {
  return <div className={className}>{children}</div>;
};

export const CardFooter = ({ children, className = '' }) => {
  return <div className={`mt-4 pt-4 border-t border-border ${className}`}>{children}</div>;
};

// ============================================================================
// BADGE COMPONENTS
// ============================================================================

export const Badge = ({ 
  children, 
  variant = 'default', 
  size = 'md',
  className = '',
  icon = null,
  ...props 
}) => {
  const variants = {
    default: 'bg-surface-elevated text-text-secondary border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    success: 'bg-success/10 text-success border border-success/20',
    error: 'bg-error/10 text-error border border-error/20',
    warning: 'bg-warning/10 text-warning border border-warning/20',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  };
  
  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };
  
  const IconComponent = icon;
  
  return (
    <span className={`
      inline-flex items-center gap-1.5
      rounded-full font-medium
      ${variants[variant] || variants.default}
      ${sizes[size] || sizes.md}
      ${className}
    `} {...props}>
      {IconComponent && <IconComponent size={size === 'sm' ? 12 : 14} />}
      {children}
    </span>
  );
};

// ============================================================================
// STATUS INDICATORS
// ============================================================================

export const StatusDot = ({ status = 'healthy', size = 'md', label = '' }) => {
  const statuses = {
    healthy: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error',
    offline: 'bg-text-muted',
    processing: 'bg-primary animate-pulse',
    idle: 'bg-text-muted'
  };
  
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`rounded-full ${statuses[status] || statuses.idle} ${sizes[size] || sizes.md}`} />
      {label && <Text size="sm" color="muted">{label}</Text>}
    </div>
  );
};

// ============================================================================
// AVATAR COMPONENTS
// ============================================================================

export const Avatar = ({ 
  src, 
  name, 
  size = 'md', 
  className = '',
  status = null,
  onClick,
  ...props 
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };
  
  const statusSizes = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };
  
  const initials = name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  
  const statusColors = {
    online: 'bg-success',
    offline: 'bg-text-muted',
    away: 'bg-warning',
    busy: 'bg-error'
  };
  
  return (
    <div 
      className={`
        relative flex-shrink-0
        rounded-full overflow-hidden
        bg-surface-elevated border-2 border-border
        ${sizes[size] || sizes.md}
        ${onClick ? 'cursor-pointer hover:border-primary transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
      {...props}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-medium">
          {initials}
        </div>
      )}
      {status && (
        <div className={`absolute bottom-0 right-0 rounded-full border-2 border-background ${statusColors[status] || statusColors.online} ${statusSizes[size] || statusSizes.md}`} />
      )}
    </div>
  );
};

// ============================================================================
// PROGRESS BAR COMPONENTS
// ============================================================================

export const ProgressBar = ({ 
  value = 0, 
  max = 100, 
  label = '',
  showLabel = false,
  size = 'md',
  variant = 'default',
  className = '',
  animate = true,
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variants = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  };
  
  return (
    <div className={`w-full ${className}`}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-1.5">
          {label && <Text size="sm" className="font-medium">{label}</Text>}
          {showLabel && <Text size="sm" color="muted">{percentage.toFixed(1)}%</Text>}
        </div>
      )}
      <div className={`w-full bg-surface rounded-full overflow-hidden ${sizes[size] || sizes.md}`}>
        <div 
          className={`
            ${variants[variant] || variants.default}
            rounded-full transition-all duration-700 ease-out
            ${animate ? 'transition-all' : ''}
            ${sizes[size] || sizes.md}
          `}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// TABS COMPONENTS
// ============================================================================

export const Tabs = ({ 
  tabs = [], 
  activeTab, 
  onTabChange,
  variant = 'default',
  className = '',
  ...props 
}) => {
  const variants = {
    default: 'border-b border-border',
    pills: 'gap-1'
  };
  
  const tabVariants = {
    default: (isActive) => `
      px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
      ${isActive 
        ? 'text-primary border-primary' 
        : 'text-text-secondary hover:text-text-primary border-transparent hover:border-border'
      }
    `,
    pills: (isActive) => `
      px-4 py-2 text-sm font-medium rounded-lg transition-colors
      ${isActive 
        ? 'bg-primary text-white' 
        : 'text-text-secondary hover:text-text-primary hover:bg-surface'
      }
    `
  };
  
  return (
    <div className={`${className}`} {...props}>
      <div className={`flex ${variants[variant] || variants.default}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={tabVariants[variant || 'default'](activeTab === tab.id)}
            disabled={tab.disabled}
          >
            <div className="flex items-center gap-2">
              {tab.icon && <tab.icon size={18} />}
              {tab.label}
              {tab.badge && (
                <Badge size="sm" variant="primary" className="ml-1">{tab.badge}</Badge>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// TOOLTIP COMPONENTS
// ============================================================================

export const Tooltip = ({ children, content, position = 'top', className = '' }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [positionStyle, setPositionStyle] = useState({});
  const tooltipRef = useRef(null);
  const targetRef = useRef(null);
  
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  };
  
  useEffect(() => {
    if (isVisible && targetRef.current) {
      const rect = targetRef.current.getBoundingClientRect();
      setPositionStyle({
        position: 'fixed',
        top: rect.top,
        left: rect.left
      });
    }
  }, [isVisible]);
  
  return (
    <div 
      ref={targetRef}
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && content && (
        <div 
          ref={tooltipRef}
          className={`
            absolute z-50
            px-3 py-2
            bg-surface-elevated border border-border
            rounded-lg shadow-xl
            text-sm text-text-primary
            whitespace-nowrap
            ${positions[position] || positions.top}
            ${className}
          `}
        >
          {content}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MODAL / DIALOG COMPONENTS
// ============================================================================

export const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  className = '',
  showClose = true,
  closeOnOverlayClick = true,
  ...props 
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };
  
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeOnOverlayClick ? onClose : undefined}
      />
      <div 
        className={`
          relative
          w-full
          ${sizes[size] || sizes.md}
          max-h-[90vh]
          bg-surface-elevated
          border border-border
          rounded-2xl
          shadow-2xl
          overflow-hidden
          animate-slide-up
          ${className}
        `}
        {...props}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <Heading level={4}>{title}</Heading>
            {showClose && (
              <IconButton
                icon={XIcon}
                variant="ghost"
                size="sm"
                onClick={onClose}
                label="Close modal"
              />
            )}
          </div>
        )}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {children}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// DROP ZONE COMPONENT
// ============================================================================

export const DropZone = ({
  onDrop,
  onFileSelect,
  accept = '*/*',
  maxSize = 20 * 1024 * 1024, // 20MB
  className = '',
  label = 'Drop files here',
  subLabel = 'or click to browse',
  icon = Upload,
  multiple = false,
  disabled = false,
  ...props
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const IconComponent = icon;
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };
  
  const handleFiles = (files) => {
    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`${file.name} is too large (max ${maxSize / 1024 / 1024}MB)`);
        return false;
      }
      return true;
    });
    
    if (validFiles.length > 0) {
      if (onDrop) onDrop(validFiles);
      if (onFileSelect) onFileSelect(validFiles);
    }
  };
  
  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
    e.target.value = '';
  };
  
  return (
    <div
      className={`
        relative
        border-2 border-dashed
        rounded-xl
        p-8
        text-center
        transition-all
        ${isDragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      {...props}
    >
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleFileInputChange}
      />
      <div className="flex flex-col items-center gap-3">
        <div className={`
          p-4 rounded-full
          ${isDragOver ? 'bg-primary/20 text-primary' : 'bg-surface text-text-secondary'}
        `}>
          <IconComponent size={40} />
        </div>
        <div>
          <Text weight="medium" className="text-lg">{label}</Text>
          <Text size="sm" color="muted">{subLabel}</Text>
          <Text size="sm" color="muted" className="mt-1 text-xs">
            Supported: PDF, DOCX, TXT (Max {maxSize / 1024 / 1024}MB)
          </Text>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TABLE COMPONENTS
// ============================================================================

export const Table = ({ children, className = '', ...props }) => {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-sm ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHead = ({ children, className = '' }) => {
  return (
    <thead className={`bg-surface/50 border-b border-border ${className}`}>
      {children}
    </thead>
  );
};

export const TableHeader = ({ children, className = '' }) => {
  return (
    <th className={`px-4 py-3 text-left text-xs font-medium text-text-muted uppercase tracking-wider ${className}`}>
      {children}
    </th>
  );
};

export const TableBody = ({ children, className = '' }) => {
  return <tbody className={className}>{children}</tbody>;
};

export const TableRow = ({ children, className = '', hover = true, ...props }) => {
  return (
    <tr className={`
      border-b border-border/50
      ${hover ? 'hover:bg-surface/50 transition-colors' : ''}
      ${className}
    `} {...props}>
      {children}
    </tr>
  );
};

export const TableCell = ({ children, className = '' }) => {
  return (
    <td className={`px-4 py-3 text-text-secondary ${className}`}>
      {children}
    </td>
  );
};

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

export const EmptyState = ({
  icon: IconComponent = Inbox,
  title = 'No data yet',
  description = 'Get started by adding your first item.',
  action = null,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="p-4 rounded-full bg-surface">
        <IconComponent size={48} className="text-text-muted" />
      </div>
      <Heading level={3} className="mt-4">{title}</Heading>
      <Text color="muted" className="mt-2 max-w-sm">{description}</Text>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// ============================================================================
// TOAST NOTIFICATIONS (re-export from react-hot-toast)
// ============================================================================

// Re-export toast functionality
export { toast, Toaster } from 'react-hot-toast';

// ============================================================================
// EXPORT ALL COMPONENTS
// ============================================================================

export default {
  // Layout
  Divider,
  
  // Typography
  Heading,
  Text,
  Label,
  
  // Buttons
  Button,
  IconButton,
  
  // Inputs
  Input,
  Textarea,
  Select,
  Checkbox,
  
  // Cards
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  
  // Badges & Status
  Badge,
  StatusDot,
  
  // Avatar
  Avatar,
  
  // Progress
  ProgressBar,
  
  // Tabs
  Tabs,
  
  // Tooltip
  Tooltip,
  
  // Modal
  Modal,
  
  // DropZone
  DropZone,
  
  // Table
  Table,
  TableHead,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  
  // Empty State
  EmptyState,
  
  // Loading
  LoadingSpinner,
  Skeleton,
  
  // Toast
  Toaster,
};