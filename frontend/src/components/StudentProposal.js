import React, { useState, useEffect } from "react";
import Theme from "./reusable/Theme";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import {
  TextField,
  Button,
  Box,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./axios";

export default function StudentProposal() {
  const [projectTitle, setProjectTitle] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [numStudents, setNumStudents] = useState(1);
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [tools, setTools] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [supervisorList, setSupervisorList] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    navigate(-1); // Navigate back by one step in the history
  };

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const fetchSupervisors = () => {
    api
      .get(`/users/`)
      .then((response) => {
        const supervisors = response.data.filter((user) =>
          user.groups.includes(2)
        );
        setSupervisorList(supervisors);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setLoading(true);

    const selectedSupervisor = supervisorList.find(
      (item) => item.full_name === supervisor
    );

    const project = {
      title: projectTitle,
      num_of_student: 1,
      description: description,
      collaborator: collaborators,
      tool: tools,
      student: user,
      student_id: user.id,
      state: "Pending",
      supervisor: selectedSupervisor,
      supervisor_id: selectedSupervisor.id,
    };

    api
      .post("proposals/", project)
      .then((response) => {
        console.log("Proposal submitted!");

        setSupervisor("");
        setProjectTitle("");
        setNumStudents("");
        setDescription("");
        setCollaborators("");
        setTools("");

        navigate("/studentproject", {
          state: {
            state: project.state,
            alertMessage: "Proposal submitted",
            severity: "success"
          },
        });
      })
      .catch((error) => {
        console.error("Error:", error);
        console.log(error.response.data);
      })
      .finally(() => {
        setLoading(false);
      });
  };


  return (
    <ThemeProvider theme={Theme}>
      <StudentNavigationBar />
      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "grid", gap: "1rem", padding: "1rem" }}>
          <TextField
            label="Project Title"
            fullWidth
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
            required
          />
          <FormControl fullWidth required>
            <InputLabel id="supervisor-label">Supervisor</InputLabel>
            <Select
              label="Supervisor"
              labelId="supervisor-label"
              id="supervisor"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              required
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
          sx={{ margin: "1rem", fontWeight: "bold", textTransform: "none" }}
          disabled={loading} 
        >
          {loading ? <CircularProgress size={24} /> : "Submit"}
        </Button>
        <Button
          type="button"
          variant="contained"
          color="primary"
          sx={{ margin: "1rem", fontWeight: "bold", textTransform: "none" }}
          onClick={handleBack}
          disabled={loading} 
        >
          Cancel
        </Button>
      </form>
    </ThemeProvider>
  );
}
