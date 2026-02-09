import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import App from './App';
import { store } from './app/store';
import { setStore } from './services/api';
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
      // @ts-expect-error - v7_startTransition is available in React Router v7
      v7_startTransition: true,
    },
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
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
    </Provider>
  </React.StrictMode>
);
