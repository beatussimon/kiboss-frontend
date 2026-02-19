import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './app/store';
import { setStore } from './services/api';
import { CurrencyProvider } from './context/CurrencyContext';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Set the store reference in api.ts to avoid circular dependency
setStore(store);

// Create router with future flags to suppress v7 warnings
const router = createBrowserRouter(
  [{ path: '*', Component: App }],
  {
    future: {
      v7_fetcherPersist: true,
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_partialHydration: true,
    } as Record<string, boolean>,
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <Provider store={store}>
        <CurrencyProvider>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </CurrencyProvider>
      </Provider>
    </ErrorBoundary>
  </React.StrictMode>
);
