import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ConfirmProvider } from './context/ConfirmContext';

function App() {
  return (
    <ConfirmProvider>
      <RouterProvider router={router} />
    </ConfirmProvider>
  );
}

export default App;
