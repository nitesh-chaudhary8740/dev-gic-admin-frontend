import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Admin from '../pages/Admin'
import AdminLayout from '../layout/AdminLayout'
import {  Menu } from 'lucide-react'
import Languages from '../pages/Languages'
import Menus from '../pages/Menus'
import Pages from '../pages/Pages'
import Media from '../pages/media/Media'
import MediaFormats from '../pages/media/MediaFormats'

const AdminRoutes = () => {
  return (
    <Routes>
    <Route path='/admin' element={<AdminLayout/>} >
    <Route index element={<Admin/>} />
    <Route path='languages' element={<Languages/>} />
    <Route path='menus' element={<Menus/>} />
    <Route path='pages' element={<Pages/>} />
    <Route path='media' element={<Media/>} />
    <Route path='media/formats' element={<MediaFormats />} />
     </Route>
    </Routes>
  )
}
export default AdminRoutes
