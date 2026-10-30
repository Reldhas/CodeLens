import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './bundles/course/codelens/App';
import './bundles/course/codelens/styles.css';
createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
