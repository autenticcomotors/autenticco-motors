// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './pages/Home';
import Stock from './pages/Stock';
import SellCar from './pages/SellCar';
import About from './pages/About';
import Contact from './pages/Contact';
import CarDetail from './pages/car-detail';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import Checklist from './pages/Checklist';
import AccessControl from './pages/AccessControl'; // 👈 a página que você criou
import { Toaster } from './components/ui/toaster';
import PrivateRoute from './components/PrivateRoute';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/estoque', element: <Stock /> },
      { path: '/vender', element: <SellCar /> },
      { path: '/sobre', element: <About /> },
      { path: '/contato', element: <Contact /> },
      { path: '/carro/:slug', element: <CarDetail /> },

      // LOGIN
      { path: '/admin', element: <AdminLogin /> },

      // DASHBOARD PRINCIPAL (protegido)
      {
        path: '/dashboard',
        element: (
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        ),
      },

      // CHECKLIST direto (protegido)
      {
        path: '/dashboard/checklist',
        element: (
          <PrivateRoute>
            <Checklist />
          </PrivateRoute>
        ),
      },

      // NOVO: Gestão de Acessos (protegido)
      {
        path: '/dashboard/acessos',
        element: (
          <PrivateRoute>
            <AccessControl />
          </PrivateRoute>
        ),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
    <Toaster />
  </React.StrictMode>
);

