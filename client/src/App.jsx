
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import Home from './pages/Home'
import About from './pages/About'
import PublicLeadership from './pages/Leadership'
import PublicPrograms from './pages/Programs'
import News from './pages/News'
import Contact from './pages/Contact'

import Register from './pages/Register'
import Login from './pages/Login'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'

import PublicLayout from './components/PublicLayout'

import AdminRoute from './admin/AdminRoute'
import AdminLayout from './admin/AdminLayout'
import AdminDashboard from './admin/AdminDashboard'
import Students from './admin/Students'
import MembershipRecords from './admin/MembershipRecords'
import AdminAnnouncements from './components/AdminAnnouncements'
import Leadership from './admin/Leadership'
import NewsOpportunities from './admin/NewsOpportunities'
import Programs from './admin/Programs'
import ContactMessages from './admin/ContactMessages'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public pages share the common navigation and footer */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/leadership" element={<PublicLeadership />} />
          <Route path="/programs" element={<PublicPrograms />} />
          <Route path="/news" element={<News />} />
          <Route path="/contact" element={<Contact />} />

          {/* Future public pages */}
          {/* We'll add About, Leadership, Programs, News and Contact here */}
        </Route>

        {/* Authentication and student pages remain separate */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Protected administrator area */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="memberships" element={<MembershipRecords />} />
          <Route path="announcements" element={<AdminAnnouncements />} />
          <Route path="leadership" element={<Leadership />} />  
          <Route path="news-opportunities" element={<NewsOpportunities />} /> 
          <Route path="programs" element={<Programs />} />  
          <Route path="contact-messages" element={<ContactMessages />} /> 
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
