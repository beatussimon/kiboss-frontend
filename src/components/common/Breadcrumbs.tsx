import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  if (pathnames.length === 0) return null;

  return (
    <nav className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 overflow-x-auto no-scrollbar whitespace-nowrap px-1 py-2" aria-label="Breadcrumb">
      <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center">
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const last = index === pathnames.length - 1;
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const title = value.charAt(0).toUpperCase() + value.slice(1).replace(/-/g, ' ');

        return (
          <div key={to} className="flex items-center">
            <ChevronRight className="h-3.5 w-3.5 mx-1 text-gray-400 dark:text-gray-600 flex-shrink-0" />
            {last ? (
              <span className="text-gray-900 dark:text-white font-bold max-w-[120px] truncate">{title}</span>
            ) : (
              <Link to={to} className="hover:text-primary-600 transition-colors max-w-[100px] truncate">
                {title}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
