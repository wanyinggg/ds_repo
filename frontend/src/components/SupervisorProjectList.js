import * as React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  IconButton, Alert, Backdrop 
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate,useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./axios"; 
import SupervisorProjectEdit from "./SupervisorProjectEdit";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8950fc",
    },
  },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: "white",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function SupervisorProjectList() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  const columns = [
    { label: "No." },
    { label: "Project Title" },
    { label: "Student" },
    {
      label: "",
      format: (value) => <Button>Details</Button>,
    },
  ];

  const deleteProject = (projectId) => {
    setSelectedProject(projectId);
    setOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedProject) {
      api
        .delete(`projects/${selectedProject}/`)
        .then((response) => {
          console.log("Project deleted successfully");
          handleAlertOpen("Project deleted successfully", "success");
          setProjects((prevProjects) =>
            prevProjects.filter((project) => project.id !== selectedProject)
          );
        })
        .catch((error) => {
          console.error("Error deleting project:", error);
        })
        .finally(() => {
          setSelectedProject(null);
          setOpen(false);
        });
    }
  };
  

  const handleAlertOpen = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    setTimeout(() => {
      setAlertOpen(false);
    }, 1500); 
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  useEffect(() => {
    const message = location.state?.alertMessage;
    if (message) {
      handleAlertOpen(message, alert.severity);
      // Clear the alert state so it doesn't show again on refresh
      location.state = null;
    }
  }, [location]);  
  
  const handleClose = () => {
    setSelectedProject(null);
    setOpen(false);
  };

  const ConfirmationDialog = ({ open, onClose, onConfirm }) => {
    return (
      <Dialog open={open} onClose={onClose}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the project?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>No</Button>
          <Button onClick={onConfirm} color="error">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  useEffect(() => {
    api
      .get("projects/", { params: { user_projects: true } })
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
      });
  }, []);

  return (
    <ThemeProvider theme={theme}>
      {selectedProjectId && (
        <SupervisorProjectEdit
          project={projects.find((project) => project.id === selectedProjectId)}
        />
      )}

      <Grid container spacing={5}>
        <Grid item xs={12}></Grid>
        <Grid item xs={12}>
          <Box sx={{ margin: "30px" }}>
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledTableCell
                          key={column.id}
                          align={column.align}
                          style={{ minWidth: column.minWidth }}
                        >
                          <strong>{column.label}</strong>
                        </StyledTableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {projects
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => {
                        const projectNumber = index + 1;
                        return (
                          <StyledTableRow
                            hover
                            role="checkbox"
                            tabIndex={-1}
                            key={row.id}
                          >
                            <StyledTableCell>{projectNumber}</StyledTableCell>
                            <StyledTableCell>{row.title}</StyledTableCell>
                            <StyledTableCell>{row.assigned_to.map(user => user.full_name).join(', ')}</StyledTableCell>
                            <StyledTableCell style={{ width: "20%" }}>
                              <Button
                                onClick={() => {
                                  navigate(
                                    `/supervisorprojectdetail/${row.id}`
                                  );
                                }}
                                variant="text"
                                style={{ textTransform: "none" }}
                              >
                                Details
                              </Button>
                              <IconButton
                                aria-label="edit"
                                color="primary"
                                sx={{ marginRight: "0.5rem" }}
                                onClick={() => {
                                  navigate(`/supervisorprojectedit/${row.id}`, {
                                    state: { returnPath: '/supervisorproject' },
                                  });
                                }}
                              >
                                <EditIcon />
                              </IconButton>

                              <IconButton
                                aria-label="delete"
                                color="secondary"
                                sx={{ marginRight: "0.5rem" }}
                                onClick={() => deleteProject(row.id)} // Call deleteProject with the project ID
                              >
                                <DeleteIcon />
                              </IconButton>
                            </StyledTableCell>
                          </StyledTableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Grid>
      </Grid>
      <ConfirmationDialog
        open={open}
        onClose={handleClose}
        onConfirm={handleConfirmDelete}
      />
 <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={alertOpen}
      >
        <Alert
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{
            boxShadow: 24, 
            p: 2, 
            minWidth: '20%', 
            display: 'flex', 
          }}
        >
          {alertMessage}
        </Alert>
      </Backdrop>
    </ThemeProvider>
  );
}
