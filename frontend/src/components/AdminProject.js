import React from 'react';
import { useLocation } from 'react-router-dom';
import AdminNavigationBar from './reusable/AdminNavigationBar';
import AdminProjectList from "./AdminProjectList";

export default function AdminProject() {
  const location = useLocation();

  return (
    <div>
      <AdminNavigationBar />
      <AdminProjectList />
    </div>
  );
}