import React from "react";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import ProjectList from "./ProjectList";

export default function SupervisorHome() {

  return (
    <div>
      <SupervisorNavigationBar  />
      <ProjectList />
    </div>
  );
}
