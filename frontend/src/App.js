import React from "react";
import { BrowserRouter as Router, Route, Routes} from "react-router-dom";

import HomePage from "./components/HomePage";
import LoginForm from "./components/LoginForm";
import ProjectDetail from "./components/ProjectDetail";
import PreviousProjectDetail from "./components/PreviousProjectDetail";

import ForgotPassword from "./components/ForgotPassword";
import ForgotPasswordReset from "./components/ForgotPasswordReset";
import ResetPassword from "./components/ResetPassword";
import ResetCurrentPassword from "./components/reusable/ResetCurrentPassword";
import Profile from "./components/reusable/Profile";

import AdminUser from "./components/AdminUser";
import AdminProject from "./components/AdminProject";
import AdminProjectDetail from "./components/AdminProjectDetail";
import AdminProjectEdit from "./components/AdminProjectEdit";
import AdminSemester from "./components/AdminSemester";

import StudentHome from "./components/StudentHome";
import StudentProject from "./components/StudentProject";
import StudentProjectDetail from "./components/StudentProjectDetail";
import StudentProposal from "./components/StudentProposal";
import StudentProposalDetail from "./components/StudentProposalDetail";
import StudentProposalEdit from "./components/StudentProposalEdit";
import StudentSubmission from "./components/StudentSubmission";
import StudentPresentationTimeslot from "./components/StudentPresentationTimeslot";
import StudentPreviousProjectList from "./components/StudentPreviousProjectList";

import SupervisorHome from "./components/SupervisorHome";
import SupervisorProject from "./components/SupervisorProject";
import SupervisorProjectTemplate from "./components/SupervisorProjectTemplate";
import SupervisorProjectDetail from "./components/SupervisorProjectDetail";
import SupervisorProjectEdit from "./components/SupervisorProjectEdit";
import SupervisorApplication from "./components/SupervisorApplication";
import SupervisorProposalDetail from "./components/SupervisorProposalDetail";
import SupervisorEvaluation from "./components/SupervisorEvaluation";
import SupervisorEvaluation_Proposal from "./components/SupervisorEvaluation_Proposal";
import SupervisorEvaluation_Report from "./components/SupervisorEvaluation_Report";
import SupervisorEvaluation_Conduct from "./components/SupervisorEvaluation_Conduct";
import SupervisorPreviousProjectList from "./components/SupervisorPreviousProjectList";

import PanelPresentation from "./components/PanelPresentation";
import PanelEvaluation from "./components/PanelEvaluation";
import PanelEvaluationTemplate from "./components/PanelEvaluationTemplate";

import ProgramCoordinatorHome from "./components/ProgramCoordinatorHome";
import ProgramCoordinatorSchedulling from "./components/ProgramCoordinatorSchedulling";
import ProgramCoordinatorReport from "./components/ProgramCoordinatorReport";
import Dashboard from "./components/Dashboard";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} exact />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/projectdetail/:id" element={<ProjectDetail />} />
        <Route path="/previousprojectdetail/:id" element={<PreviousProjectDetail />} />

        <Route path="/forgotpassword" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ForgotPasswordReset />} />
        <Route path="/resetpassword" element={<ResetPassword />} />
        <Route path="/resetcurrentpassword" element={<ResetCurrentPassword />} />
        <Route path="/profile" element={<Profile />} />

        <Route path="/adminuser" element={<AdminUser />} />
        <Route path="/adminproject" element={<AdminProject />} />
        <Route path="/adminprojectdetail/:id" element={<AdminProjectDetail />}/>
        <Route path="/adminprojectedit/:id" element={<AdminProjectEdit />}/>
        <Route path="/adminsemester" element={<AdminSemester />}/>

        <Route path="/student" element={<StudentHome />} />
        <Route path="/studentproject" element={<StudentProject />} />
        <Route path="/studentprojectdetail" element={<StudentProjectDetail />} />
        <Route path="/studentproposal" element={<StudentProposal />} />
        <Route path="/studentproposaldetail" element={<StudentProposalDetail />} />
        <Route path="/studentproposaledit/:id" element={<StudentProposalEdit />} />
        <Route path="/studentsubmission" element={<StudentSubmission />} />
        <Route path="/studentpresentation" element={<StudentPresentationTimeslot />} />
        <Route path="/studentpreviousproject" element={<StudentPreviousProjectList />} />

        <Route path="/supervisor" element={<SupervisorHome />}  />
        <Route path="/supervisorproject" element={<SupervisorProject />} />
        <Route path="/supervisorprojecttemplate"element={<SupervisorProjectTemplate />}/>
        <Route path="/supervisorprojectdetail/:id" element={<SupervisorProjectDetail />}/>
        <Route path="/supervisorprojectedit/:id" element={<SupervisorProjectEdit />}/>
        <Route path="/supervisorapplication" element={<SupervisorApplication />}/>
        <Route path="/supervisorproposaldetail/:id" element={<SupervisorProposalDetail />}/>
        <Route path="/supervisorevaluation" element={<SupervisorEvaluation />}/>
        <Route path="/proposal_evaluation" element={<SupervisorEvaluation_Proposal />}/>
        <Route path="/report_evaluation" element={<SupervisorEvaluation_Report />}/>
        <Route path="/conduct_evaluation" element={<SupervisorEvaluation_Conduct />}/>
        <Route path="/dashboard" element={<Dashboard />}/>
        <Route path="/supervisorpreviousproject" element={<SupervisorPreviousProjectList />} />

        <Route path="/panelpresentation" element={<PanelPresentation />} /> 
        <Route path="/panelevaluation" element={<PanelEvaluation />} /> 
        <Route path="/panelevaluationtemplate" element={<PanelEvaluationTemplate />} /> 

        <Route path="/programcoordinator" element={<ProgramCoordinatorHome />} /> 
        <Route path="/programcoordinatorschedulling" element={<ProgramCoordinatorSchedulling />} />
        <Route path="/programcoordinatorreport" element={<ProgramCoordinatorReport />} /> 

      </Routes>
    </Router>
  );
}

export default App;