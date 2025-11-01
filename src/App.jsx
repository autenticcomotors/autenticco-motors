// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import App from './App';
import Home from './pages/Home';
import Stock from './pages/Stock';
import SellCar from './pages/SellCar';
import About from './pages/About';
import Contact from './pages/Contact';
import CarDetails from './pages/CarDetails';
import Admin from './pages/Admin';           // tela de login /admin
import AdminDashboard from './pages/AdminDashboard';
import Checklist from './pages/Checklist';   // ✅ NOVA PÁGINA
import './index.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Home /> },
      { path: 'estoque', element: <Stock /> },
      { path: 'vender', element: <SellCar /> },
      { path: 'quem-somos', element: <About /> },
      { path: 'contato', element: <Contact /> },
      { path: 'carro/:slug', element: <CarDetails /> },

      // painel
      { path: 'dashboard', element: <AdminDashboard /> },

      // ✅ rota direta pro vistoriador
      { path: 'dashboard/checklist', element: <Checklist /> },

      // login
      { path: 'admin', element: <Admin /> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

