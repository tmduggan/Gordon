import React from 'react';
import ReactDOM from 'react-dom/client';
import FoodTracker from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <FoodTracker />
  </React.StrictMode>
); 