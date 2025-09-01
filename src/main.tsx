import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Dashboard } from './pages/Dashboard'
import { Projects } from './pages/Projects'
import { ProjectDetail } from './pages/ProjectDetail'
import { Users } from './pages/Users'
import { useAuthStore } from './store/auth'
import { Navbar } from './components/Navbar'

function PrivateRoute({ children }:{ children: JSX.Element }){
  const isAuth = useAuthStore(s=>!!s.token)
  return isAuth ? (
    <div>
      <Navbar />
      <main>{children}</main>
    </div>
  ) : <Navigate to='/login' replace />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<Login/>} />
        <Route path='/register' element={<Register/>} />
        <Route path='/forgot-password' element={<ForgotPassword/>} />
        <Route path='/reset-password' element={<ResetPassword/>} />
        <Route path='/' element={<PrivateRoute><Dashboard/></PrivateRoute>} />
        <Route path='/projects' element={<PrivateRoute><Projects/></PrivateRoute>} />
        <Route path='/projects/:id' element={<PrivateRoute><ProjectDetail/></PrivateRoute>} />
        <Route path='/users' element={<PrivateRoute><Users/></PrivateRoute>} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  </React.StrictMode>
)
