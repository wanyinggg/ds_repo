import React, { useState, useEffect } from "react";
import Theme from "./reusable/Theme";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import { TextField, Button, Box,  } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./axios"; 

export default function SupervisorProjectTemplate() {
  const [projectTitle, setProjectTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [numStudents, setNumStudents] = useState(1);
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [tools, setTools] = useState("");
  const location = useLocation();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/supervisorproject", { state: {} }); 
  };  

  const storedUser = (sessionStorage.getItem("user") || localStorage.getItem("user"));
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    // If user data exists, set the supervisor field with the user's full name
    if (user && user.groups.includes(2)) {
      setSupervisor(user.full_name);
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();

    const project = {
      title: projectTitle,
      created_by: user.full_name,
      num_of_student: 1,
      description: description,
      collaborator: collaborators,
      tool: tools,
      created_by_id: user.id,
      state: null,
      assigned_to: [], // Initially, these fields are null
      assigned_to_id: [], // These will be updated when a student is approved
    };

    api
      .post("projects/", project)
      .then((response) => {
        console.log("Project created successfully!");

        setSupervisor(user.full_name);

        setProjectTitle("");
        setNumStudents("");
        setDescription("");
        setCollaborators("");
        setTools("");

        navigate("/supervisorproject", { state: { alertMessage: "Project added successfully" } });
      })
      .catch((error) => {
        console.error("Error:", error);
        console.log(error.response.data);
      });
  };


  return (
    <ThemeProvider theme={Theme}>
      <SupervisorNavigationBar />
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
          sx={{ margin: "1rem", fontWeight: "bold", textTransform: "none" }}
        >
          Submit
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          sx={{ margin: "1rem", fontWeight: "bold", textTransform: "none" }}
          onClick={handleBack}
        >
          Cancel
        </Button>
      </form>
    </ThemeProvider>
  );
}
