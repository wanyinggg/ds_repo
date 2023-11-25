import React, { useState, useEffect } from "react";
import Theme from "./reusable/Theme";
import AdminNavigationBar from "./reusable/AdminNavigationBar";
import {
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "./axios";

export default function AdminProjectEdit() {
  const [projectTitle, setProjectTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [supervisorList, setSupervisorList] = useState([]);
  const [numStudents, setNumStudents] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [tools, setTools] = useState("");
  const [projects, setProjects] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const handleBack = () => {
    navigate(-1); // Navigate back by one step in the history
  };

  const storedUser = (sessionStorage.getItem("user") || localStorage.getItem("user"));
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    fetchSupervisors();
    getProjects();
  }, []);

  useEffect(() => {
    setProjectTitle(projects.title);
    setSupervisor(projects.created_by);
    setNumStudents(projects.num_of_student);
    setDescription(projects.description);
    setCollaborators(projects.collaborator);
    setTools(projects.tool);
    setSupervisorList(projects.supervisor_list);
  }, [projects]);

  const getProjects = () => {
    api
      .get(`/projects/${id}/`)
      .then((response) => {
        const projects = response.data;
        setProjectTitle(projects.title);
        setSupervisor(projects.created_by.full_name); 
        setNumStudents(projects.num_of_student);
        setDescription(projects.description);
        setCollaborators(projects.collaborator);
        setTools(projects.tool);
        console.log(projects.created_by)
      })
      .catch((error) => {
        console.log(error);
      });
  };
  

  const fetchSupervisors = () => {
    api
      .get(`/users/`)
      .then((response) => {
        const supervisors = response.data.filter((user) => user.groups.includes(2));
        setSupervisorList(supervisors);
        console.log(supervisors);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  
  

  const handleSubmit = (e) => {
    e.preventDefault();

    const selectedSupervisor = supervisorList.find(
      (item) => item.full_name === supervisor
    );

    const updatedProject = {
      title: projectTitle,
      created_by_id: selectedSupervisor.id,
      created_by: supervisor,
      num_of_student: 1,
      description: description,
      collaborator: collaborators,
      tool: tools,
    };

    // Send a request to update the project details
    api
      .patch(`projects/${id}/`, updatedProject)
      .then((response) => {
        console.log("Project details updated successfully!");
        navigate(location.state.returnPath, {
          state: { message: "Project details updated successfully", severity: "success" },
        });      
      })
      .catch((error) => {
        console.error("Error:", error);
        console.log(error.response.data);
      });
  };

  return (
    <ThemeProvider theme={Theme}>
      <AdminNavigationBar />
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "grid", gap: "1rem", padding: "1rem" }}>
          <TextField
            label="Project Title"
            fullWidth
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />
          <FormControl fullWidth>
            <InputLabel id="supervisor-label">Supervisor</InputLabel>
            <Select
              label="Supervisor"
              labelId="supervisor-label"
              id="supervisor"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
            >
              {supervisorList &&
                supervisorList.map((supervisor) => (
                  <MenuItem key={supervisor.id} value={supervisor.full_name}>
                    {supervisor.full_name}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Description"
            fullWidth
            multiline
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <TextField
            label="Potential Collaborators"
            fullWidth
            multiline
            rows={2}
            value={collaborators}
            onChange={(e) => setCollaborators(e.target.value)}
          />
          <TextField
            label="Tools"
            fullWidth
            multiline
            rows={2}
            value={tools}
            onChange={(e) => setTools(e.target.value)}
          />
        </Box>
        <Button
          type="submit"
          variant="contained"
          color="primary"
          sx={{
            marginLeft: "1rem",
            marginBottom: "1rem",
            fontWeight: "bold",
            textTransform: "none",
          }}
        >
          Submit
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          sx={{
            marginLeft: "1rem",
            marginBottom: "1rem",
            fontWeight: "bold",
            textTransform: "none",
          }}
          onClick={handleBack}
        >
          Cancel
        </Button>
      </form>
    </ThemeProvider>
  );
}
