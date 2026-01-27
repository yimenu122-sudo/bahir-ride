import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import { router } from './routes';
import '../styles/global.css';
import '../i18n/i18n';

function App() {
  return (
    <Suspense fallback={<div className="loading-screen">Loading...</div>}>
      <RouterProvider router={router} />
    </Suspense>
  );
}

export default App;
