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
  IconButton,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Alert,
  Backdrop
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { Edit as EditIcon, Delete as DeleteIcon } from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "./axios";
import AdminProjectEdit from "./AdminProjectEdit";

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

export default function AdminProjectList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [projects, setProjects] = useState([]);
  const [archivedProjects, setArchivedProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [selectedSemester, setSelectedSemester] = useState(null);  
  const [semesters, setSemesters] = useState([]);
  const [displayedProjects, setDisplayedProjects] = useState([]);
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  const columns = [
    { label: "No." },
    { label: "Project Title" },
    { label: "Supervisor", field: "created_by" },
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
  
          // Remove the deleted project from the state
          setDisplayedProjects((prevProjects) =>
            prevProjects.filter((project) => project.id !== selectedProject)
          );
  
          handleAlertOpen("Project deleted successfully", "success");
        })
        .catch((error) => {
          console.error("Error deleting project:", error);
          handleAlertOpen("Error deleting project", "error");
        })
        .finally(() => {
          setSelectedProject(null);
          setOpen(false);
        });
    }
  };
  

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
    const filtered = displayedProjects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [displayedProjects, searchTerm]);

  useEffect(() => {
    api.get("semester/")
      .then((response) => {
        const sortedSemesters = response.data.sort((a, b) => b.id - a.id);
        setSemesters(sortedSemesters);

        // Auto-select the semester based on navigation state or use the latest
        const navigateSemester = location.state?.navigateSemester;
        const selectedSemester = navigateSemester || sortedSemesters[0]?.id;

        if (selectedSemester) {
          setSelectedSemester(selectedSemester);
        }
      })
      .catch((error) => {
        console.error("Error fetching semesters:", error);
      });
  }, []);


  useEffect(() => {
    let endpoint;

    // Check if selectedSemester is not null
    if (!selectedSemester) {
      console.warn("No semester selected, aborting fetch.");
      return;
    }

    const isLatest = semesters.find(
      (s) => s.id === selectedSemester
    )?.is_latest;

    if (isLatest) {
      endpoint = `projects/?semester=${selectedSemester}`;
    } else {
      endpoint = `archived_projects/?semester=${selectedSemester}`;
    }

    api
      .get(endpoint)
      .then((response) => {
        setDisplayedProjects(response.data);
      })
      .catch((error) => {
        console.error(`Error fetching projects from ${endpoint}:`, error);
      });
  }, [selectedSemester, semesters]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProjects = filteredProjects.sort((a, b) => {
    const fieldA = a[sortField];
    const fieldB = b[sortField];

    if (fieldA === fieldB) {
      return 0;
    }

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sortDirection === "asc"
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }

    if (fieldA === undefined || fieldA === null) {
      return sortDirection === "asc" ? 1 : -1;
    }

    if (fieldB === undefined || fieldB === null) {
      return sortDirection === "asc" ? -1 : 1;
    }

    return 0;
  });

  const paginatedProjects = sortedProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  useEffect(() => {
    if (alert && alert.message) {
      handleAlertOpen(alert.message, alert.severity);
      // Clear the alert state so it doesn't show again on refresh
      location.state = null;
    }
  }, [alert]);

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

  return (
    <ThemeProvider theme={theme}>
      {selectedProjectId && (
        <AdminProjectEdit
          project={projects.find((project) => project.id === selectedProjectId)}
        />
      )}

      <Grid container spacing={5}>
        <Grid item xs={12}>
          <div style={{ margin: "1rem 1rem 0 1rem" }}>
            <InputLabel id="semester-label" style={{ marginBottom: "0.5rem" }}>
              Select Semester and Year
            </InputLabel>
            <Select
              fullWidth
              variant="outlined"
              labelId="semester-label"
              id="semester-select"
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
            >
              {semesters.map((semester) => (
                <MenuItem key={semester.id} value={semester.id}>
                  {`Semester ${semester.semester} - ${semester.academic_year}`}
                </MenuItem>
              ))}
            </Select>
          </div>
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Search Project"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              float: "right",
              marginTop: "-1rem",
              marginRight: "2.5rem",
              marginBottom: "1rem",
            }}
          />
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
                          <strong>
                            {column.label}
                            {column.field && (
                              <SortIcon
                                style={{
                                  verticalAlign: "middle",
                                  marginLeft: "0.2rem",
                                  fontSize: "1rem",
                                }}
                                className={
                                  sortField === column.field
                                    ? sortDirection === "asc"
                                      ? "asc"
                                      : "desc"
                                    : ""
                                }
                                onClick={() => handleSort(column.field)}
                              />
                            )}
                          </strong>
                        </StyledTableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedProjects
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
                            <StyledTableCell>
                              {row.original_creator_name
                                ? row.original_creator_name
                                : row.created_by.full_name}
                            </StyledTableCell>
                            <StyledTableCell>
                              {row.original_assigned_to_names
                                ? row.original_assigned_to_names.join(", ")
                                : row.assigned_to
                                    .map((user) => user.full_name)
                                    .join(", ")}
                            </StyledTableCell>
                            <StyledTableCell style={{ width: "20%" }}>
                              <Button
                                onClick={() => {
                                  if (row.original_creator_name) {
                                      // If original_creator_name is present, treat as archived
                                      navigate(`/previousprojectdetail/${row.id}`, {
                                        state: { navigateSemester: selectedSemester }
                                      });
                                  } else {
                                      navigate(`/adminprojectdetail/${row.id}`, {
                                        state: { navigateSemester: selectedSemester }
                                      });
                                  }
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
                                  navigate(`/adminprojectedit/${row.id}`, {
                                    state: { returnPath: '/adminproject' },
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
