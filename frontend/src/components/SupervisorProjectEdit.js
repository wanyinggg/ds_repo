import React, { useState, useEffect } from "react";
import Theme from "./reusable/Theme";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import { TextField, Button, Box,  } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "./axios"; 

export default function SupervisorProjectEdit() {
  const [projectTitle, setProjectTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [numStudents, setNumStudents] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [tools, setTools] = useState("");
  const [projects, setProjects] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();

  const handleBack = () => {
    navigate(-1);
  };

  const storedUser = (sessionStorage.getItem("user") || localStorage.getItem("user"));
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    getProjects();
  }, []);

  useEffect(() => {
    // If user data exists, set the supervisor field with the user's full name
    setProjectTitle(projects.title);
    setSupervisor(user.full_name);
    setNumStudents(projects.num_of_student);
    setDescription(projects.description);
    setCollaborators(projects.collaborator);
    setTools(projects.tool);
  }, [projects]);

  const getProjects = () => {
    api
      .get(`projects/${id}/`, { params: { user_projects: true } })
      .then((response) => {
        console.log("Projects retrieved successfully!");
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Error:", error);
        console.log(error.response.data);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent the default form submission behavior

    // Create an object with the updated project details
    const updatedProject = {
      title: projectTitle,
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
      <SupervisorNavigationBar/>
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "grid", gap: "1rem", padding: "1rem" }}>
          <TextField
            label="Project Title"
            fullWidth
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />
          <TextField
            label="Supervisor"
            fullWidth
            value={supervisor}
            onChange={(e) => setSupervisor(user.full_name)}
            disabled
          />
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
