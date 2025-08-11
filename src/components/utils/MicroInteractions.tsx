import React, { useState, useEffect } from 'react';
import { CheckCircle, Sparkles, Heart, Zap } from 'lucide-react';

interface PulseButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export function PulseButton({ 
  children, 
  onClick, 
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button'
}: PulseButtonProps) {
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    if (disabled) return;
    
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 200);
    
    if (onClick) onClick();
  };

  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white',
    secondary: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    success: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white'
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative px-6 py-3 rounded-lg font-medium transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transform hover:scale-105 active:scale-95
        ${variants[variant]}
        ${isPressed ? 'animate-pulse' : ''}
        ${className}
      `}
    >
      {children}
      {isPressed && (
        <div className="absolute inset-0 rounded-lg bg-white bg-opacity-20 animate-ping" />
      )}
    </button>
  );
}

interface SuccessToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: 'success' | 'info' | 'warning';
  showConfetti?: boolean;
}

export function SuccessToast({ 
  message, 
  isVisible, 
  onClose, 
  type = 'success',
  showConfetti = false 
}: SuccessToastProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShouldAnimate(true);
      const timer = setTimeout(() => {
        onClose();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  useEffect(() => {
    if (isVisible) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const icons = {
    success: CheckCircle,
    info: Sparkles,
    warning: Zap
  };

  const colors = {
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  };

  const Icon = icons[type];

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border flex items-center space-x-3
        transition-all duration-500 transform
        ${shouldAnimate ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}
        ${colors[type]}
        max-w-sm
      `}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      
      {showConfetti && type === 'success' && (
        <div className="absolute -top-2 -right-2">
          <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full animate-bounce">
            <Sparkles className="h-4 w-4 text-white m-1" />
          </div>
        </div>
      )}
      
      <button
        onClick={onClose}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: 'blue' | 'purple' | 'green';
  text?: string;
}

export function LoadingSpinner({ 
  size = 'medium', 
  color = 'blue',
  text 
}: LoadingSpinnerProps) {
  const sizes = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const colors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600'
  };

  return (
    <div className="flex items-center space-x-2">
      <div 
        className={`animate-spin ${sizes[size]} ${colors[color]}`}
        role="status"
        aria-label="Loading"
      >
        <svg 
          className="w-full h-full" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor"
        >
          <circle 
            cx="12" 
            cy="12" 
            r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
            className="opacity-25"
          />
          <path 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            className="opacity-75"
          />
        </svg>
      </div>
      {text && (
        <span className={`text-sm ${colors[color]}`}>
          {text}
        </span>
      )}
    </div>
  );
}

interface ProgressBarProps {
  progress: number; // 0-100
  showText?: boolean;
  color?: 'blue' | 'purple' | 'green';
  className?: string;
  animated?: boolean;
}

export function ProgressBar({ 
  progress, 
  showText = true, 
  color = 'blue',
  className = '',
  animated = true 
}: ProgressBarProps) {
  const [displayProgress, setDisplayProgress] = useState(0);

  useEffect(() => {
    if (animated) {
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else {
      setDisplayProgress(progress);
    }
  }, [progress, animated]);

  const colors = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600', 
    green: 'bg-green-600'
  };

  const bgColors = {
    blue: 'bg-blue-100',
    purple: 'bg-purple-100',
    green: 'bg-green-100'
  };

  return (
    <div className={`w-full ${className}`}>
      {showText && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{Math.round(displayProgress)}%</span>
        </div>
      )}
      
      <div className={`w-full h-2 ${bgColors[color]} rounded-full overflow-hidden`}>
        <div 
          className={`h-full ${colors[color]} rounded-full transition-all duration-1000 ease-out`}
          style={{ width: `${Math.max(0, Math.min(100, displayProgress))}%` }}
          role="progressbar"
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
}

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  label: string;
  position?: 'bottom-right' | 'bottom-left';
  color?: 'blue' | 'purple' | 'green';
}

export function FloatingActionButton({
  icon,
  onClick,
  label,
  position = 'bottom-right',
  color = 'blue'
}: FloatingActionButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  const positions = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6'
  };

  const colors = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    green: 'bg-green-600 hover:bg-green-700'
  };

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        fixed ${positions[position]} z-40
        w-14 h-14 ${colors[color]} text-white rounded-full shadow-lg
        flex items-center justify-center
        transform transition-all duration-200 hover:scale-110 active:scale-95
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
        group
      `}
      aria-label={label}
      title={label}
    >
      {icon}
      
      {/* Tooltip */}
      <div 
        className={`
          absolute ${position.includes('right') ? 'right-16' : 'left-16'} 
          bg-gray-800 text-white text-sm px-2 py-1 rounded whitespace-nowrap
          transform transition-all duration-200
          ${isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2'}
          pointer-events-none
        `}
      >
        {label}
        <div 
          className={`
            absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-gray-800 rotate-45
            ${position.includes('right') ? '-right-1' : '-left-1'}
          `} 
        />
      </div>
    </button>
  );
}

// Hook for managing toast notifications
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'info' | 'warning';
    showConfetti?: boolean;
  }>>([]);

  const showToast = (
    message: string, 
    type: 'success' | 'info' | 'warning' = 'success',
    showConfetti = false
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, showConfetti }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const ToastContainer = () => (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <SuccessToast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          isVisible={true}
          showConfetti={toast.showConfetti}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );

  return {
    showToast,
    ToastContainer
  };
}