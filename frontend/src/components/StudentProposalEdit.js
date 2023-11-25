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
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import api from "./axios";

export default function StudentProposalEdit() {
  const [projectTitle, setProjectTitle] = useState("");
  const [Supervisor, setSupervisor] = useState("");
  const [supervisorList, setSupervisorList] = useState([]);
  const [numStudents, setNumStudents] = useState("");
  const [description, setDescription] = useState("");
  const [collaborators, setCollaborators] = useState("");
  const [tools, setTools] = useState("");
  const [proposals, setProposals] = useState([]);
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
    getProposals();
  }, []);

  useEffect(() => {
    setProjectTitle(proposals.title);
    setSupervisor(proposals.supervisor);
    setNumStudents(proposals.num_of_student);
    setDescription(proposals.description);
    setCollaborators(proposals.collaborator);
    setTools(proposals.tool);
    setSupervisorList(proposals.supervisor_list);
  }, [proposals]);

  const getProposals = () => {
    api
      .get(`/proposals/${id}/`)
      .then((response) => {
        const proposals = response.data;
        setProjectTitle(proposals.title);
        setSupervisor(proposals.supervisor.full_name); 
        setNumStudents(proposals.num_of_student);
        setDescription(proposals.description);
        setCollaborators(proposals.collaborator);
        setTools(proposals.tool);
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
      (item) => item.full_name === Supervisor
    );

    const updatedProposal = {
      title: projectTitle,
      supervisor_id: selectedSupervisor.id,
      supervisor: Supervisor,
      num_of_student: 1,
      description: description,
      collaborator: collaborators,
      tool: tools,
    };

    console.log("Updated Proposal:", updatedProposal);
    
    // Send a request to update the proposal details
    api
      .patch(`proposals/${id}/`, updatedProposal)
      .then((response) => {
        console.log("Proposal details updated successfully!");
        navigate("/studentproject", {
          state: {
            alertMessage: "Proposal details updated successfully",
            severity: "success"
          },
        });
      })
      .catch((error) => {
        console.error("Error:", error.response.data);
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
          <FormControl fullWidth>
            <InputLabel id="supervisor-label">Supervisor</InputLabel>
            <Select
              labelId="supervisor-label"
              id="supervisor"
              value={Supervisor}
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
