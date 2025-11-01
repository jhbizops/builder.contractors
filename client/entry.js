// Simple entry point for the application
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './src/App';
import './src/index.css';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(React.createElement(App));
}