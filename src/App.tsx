import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AppRoutes } from './routes';
import { TooltipProvider } from '@/components/ui/tooltip';

const App: React.FC = () => (
  <BrowserRouter>
    <TooltipProvider>
      <AppRoutes />
    </TooltipProvider>
  </BrowserRouter>
);

export default App;
