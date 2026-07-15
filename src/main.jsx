import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import * as localAuth from './services/localAuth.js';
import { DomainProvider } from './store/DomainContext.jsx';
import { PortalProvider } from './store/PortalContext.jsx';
import { MessagesProvider } from './store/MessagesContext.jsx';
import './styles/index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <DomainProvider initialScope={localAuth.getCurrentUser()?.accountId}>
        <PortalProvider defaultDark={false}>
          <MessagesProvider>
            <App accentColor="#008fd1" />
          </MessagesProvider>
        </PortalProvider>
      </DomainProvider>
    </ErrorBoundary>
  </StrictMode>
);
