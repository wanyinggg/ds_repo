import React from 'react';
import { useLocation } from 'react-router-dom';
import StudentNavigationBar from './reusable/StudentNavigationBar';
import ProjectList from "./ProjectList";

export default function StudentHome() {
  const location = useLocation();

  return (
    <div>
      <StudentNavigationBar/>
      <ProjectList showApplyButton={true}/>
    </div>
  );
}