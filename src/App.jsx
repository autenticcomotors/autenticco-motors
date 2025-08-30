import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Home from '@/pages/Home';
import Stock from '@/pages/Stock';
import SellCar from '@/pages/SellCar';
import About from '@/pages/About';
import Contact from '@/pages/Contact';
import AdminLogin from '@/pages/AdminLogin';
import AdminDashboard from '@/pages/AdminDashboard';
import PrivateRoute from '@/components/PrivateRoute';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black text-white">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/estoque" element={<Stock />} />
            <Route path="/vender" element={<SellCar />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/contato" element={<Contact />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route 
              path="/admin/dashboard" 
              element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
