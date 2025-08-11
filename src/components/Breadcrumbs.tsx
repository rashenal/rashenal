import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  name: string;
  href: string;
  current: boolean;
}

interface BreadcrumbsProps {
  customItems?: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ customItems, className = '' }: BreadcrumbsProps) {
  const location = useLocation();
  
  const pathMapping: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/tasks': 'Smart Tasks',
    '/habits': 'Habits',
    '/goals': 'Goals',
    '/jobs': 'Job Finder',
    '/coach': 'AI Coach',
    '/profile': 'Profile Settings',
    '/preferences': 'Preferences',
    '/integrations': 'Integrations',
    '/help': 'Help',
    '/debug': 'Debug',
    '/admin': 'Admin Dashboard',
    '/auth': 'Sign In',
  };

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    if (customItems) return customItems;

    const pathnames = location.pathname.split('/').filter((x) => x);
    const items: BreadcrumbItem[] = [];

    // Always start with MyRashenal (home) - but avoid duplicate if we're already on dashboard
    if (location.pathname !== '/dashboard') {
      items.push({
        name: 'MyRashenal',
        href: '/dashboard',
        current: false,
      });
    }

    // Add current path
    if (pathnames.length > 0) {
      const currentPath = `/${pathnames[0]}`;
      const currentName = pathMapping[currentPath] || pathnames[0];
      
      items.push({
        name: currentName,
        href: currentPath,
        current: true,
      });

      // Handle nested paths (e.g., /tasks/project-123)
      if (pathnames.length > 1) {
        for (let i = 1; i < pathnames.length; i++) {
          const href = `/${pathnames.slice(0, i + 1).join('/')}`;
          const name = pathnames[i].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
          
          items.push({
            name,
            href,
            current: i === pathnames.length - 1,
          });
        }
      }
    }

    return items;
  };

  const breadcrumbs = generateBreadcrumbs();

  // Don't show breadcrumbs on home page or auth pages
  if (location.pathname === '/' || location.pathname === '/auth') {
    return null;
  }

  // Don't show if only one item (MyRashenal)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center space-x-2 text-sm text-gray-500 py-3 ${className}`}
      aria-label="Breadcrumb"
    >
      <Home className="h-4 w-4" />
      
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={item.href}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
          )}
          
          {item.current ? (
            <span 
              className="font-medium text-gray-900"
              aria-current="page"
            >
              {item.name}
            </span>
          ) : (
            <Link
              to={item.href}
              className="hover:text-gray-700 transition-colors focus:outline-none focus:underline"
            >
              {item.name}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// Hook for custom breadcrumb management
export const useBreadcrumbs = () => {
  const [customBreadcrumbs, setCustomBreadcrumbs] = React.useState<BreadcrumbItem[] | null>(null);

  const setBreadcrumbs = React.useCallback((items: BreadcrumbItem[]) => {
    setCustomBreadcrumbs(items);
  }, []);

  const clearBreadcrumbs = React.useCallback(() => {
    setCustomBreadcrumbs(null);
  }, []);

  return {
    customBreadcrumbs,
    setBreadcrumbs,
    clearBreadcrumbs,
  };
};