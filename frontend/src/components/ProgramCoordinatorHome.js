import React from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemText,
  Chip,
  Alert, Backdrop, 
  CircularProgress,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import { useEffect, useState } from "react";
import CoordinatorNavigationBar from "./reusable/CoordinatorNavigationBar";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import api from "./axios";

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

export default function ProgramCoordinatorHome() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [supervisorList, setSupervisorList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedPanels, setSelectedPanels] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [selectedSupervisorId, setSelectedSupervisorId] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPanels, setProjectPanels] = useState({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const columns = [
    { label: "No." },
    { label: "Project Title", field: "title" },
    { label: "Student", field: "assigned_to" },
    { label: "Matric Number", field: "matric" },
    { label: "Supervisor", field: "created_by" },
    { label: "Panels" },
    { label: "", format: (value) => <Button>Assign Panels</Button> },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProjects = filteredProjects.sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    // Handle nested properties for sorting
    if (sortField === "assigned_to") {
      fieldA = a.student_fullname; // Using the flattened property
      fieldB = b.student_fullname; // Using the flattened property
    } else if (sortField === "created_by") {
      fieldA = fieldA.full_name;
      fieldB = fieldB.full_name;
    } else if (sortField === "matric") {
      fieldA = a.student_username.match(/\d+/)
        ? parseInt(a.student_username.match(/\d+/)[0], 10)
        : 0;
      fieldB = b.student_username.match(/\d+/)
        ? parseInt(b.student_username.match(/\d+/)[0], 10)
        : 0;

      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
    }

    // The remaining sorting logic
    if (fieldA === fieldB) {
      return 0;
    }

    if (typeof fieldA === "number" && typeof fieldB === "number") {
      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
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

  const fetchData = () => {
    // Fetch projects
    api
      .get("projects/")
      .then((response) => {
        console.log("Projects", response.data);
        setProjects(response.data);

        const flattened = response.data.flatMap((project) => {
          return project.assigned_to.map((student) => ({
            ...project,
            student_fullname: student.full_name,
            student_username: student.username,
            student: student,
          }));
        });

        const filtered = flattened.filter((project) =>
          project.title.toLowerCase().includes(searchTerm.toLowerCase())
        );

        setFilteredProjects(filtered);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error.response.data);
      });

    // Fetch the panels
    api.get("student_project_panel/?role=coordinator").then((response) => {
      const panelsData = response.data.reduce((acc, item) => {
        if (!acc[item.project.id]) {
          acc[item.project.id] = {};
        }
        acc[item.project.id][item.student.id] = {
          panels: item.panels,
          assignmentId: item.id,
        };
        return acc;
      }, {});
      setProjectPanels(panelsData);
    });
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);


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

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedPanels([]);
  };

  const fetchSupervisors = () => {
    api
      .get(`/users/`)
      .then((response) => {
        const supervisors = response.data.filter((user) =>
          user.groups.includes(2)
        );
        setSupervisorList(supervisors);
        console.log(supervisors);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const assignPanels = () => {
    setLoading(true);

    const data = {
      student_id: parseInt(selectedStudent),
      project_id: parseInt(selectedProjectId),
      panels_id: selectedPanels,
    };

    const existingAssignment =
      projectPanels[data.project_id] &&
      projectPanels[data.project_id][data.student_id];
    const assignmentId = existingAssignment
      ? existingAssignment.assignmentId
      : null;

    if (assignmentId) {
      // Use PATCH if the assignment already exists
      api
        .patch(`student_project_panel/${assignmentId}/?role=coordinator`, data)
        .then((response) => {
          console.log("Panels updated successfully:", response.data);
          handleAlertOpen("Panels updated successfully");
          handleCloseDialog();
          fetchData();
          setLoading(false);
        })
        .catch((error) => {
          console.error(`Error updating panels: ${assignmentId}/`, error.response.data);
          setLoading(false);
        });
    } else {
      // Use POST if it's a new assignment
      api
        .post("student_project_panel/", data)
        .then((response) => {
          console.log("Panels assigned successfully:", response.data);
          handleAlertOpen("Panels assigned successfully");
          handleCloseDialog();
          fetchData();
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error assigning panels:", error.response.data);
          setLoading(false);
        });
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CoordinatorNavigationBar />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid item xs={12}>
            <TextField
              label="Search Project"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                float: "right",
                marginTop: "2rem",
                marginRight: "2.5rem",
                marginBottom: "1rem",
              }}
            />
          </Grid>
          <Box sx={{ margin: "30px", marginTop: "0.2rem" }}>
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <Grid container justifyContent="flex-end"></Grid>
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
                    {paginatedProjects.map((row, index) => {
                      const projectNumber = index + 1;
                      return (
                        <StyledTableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={`${row.id}-${index}`}
                        >
                          <StyledTableCell>{projectNumber}</StyledTableCell>
                          <StyledTableCell>{row.title}</StyledTableCell>
                          <StyledTableCell>
                            {row.student_fullname}
                          </StyledTableCell>
                          <StyledTableCell>
                            {row.student_username}
                          </StyledTableCell>
                          <StyledTableCell>
                            {row.created_by.full_name}
                          </StyledTableCell>
                          <StyledTableCell>
                            {projectPanels[row.id] &&
                            projectPanels[row.id][row.student.id] &&
                            projectPanels[row.id][row.student.id].panels
                              ? projectPanels[row.id][
                                  row.student.id
                                ].panels.map((panel, idx, arr) => (
                                  <span key={idx}>
                                    {panel.full_name}
                                    {idx !== arr.length - 1 ? ", " : ""}
                                    <br />
                                  </span>
                                ))
                              : null}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Button
                              onClick={() => {
                                setSelectedStudent(row.student.id);
                                setSelectedStudentName(row.student_fullname);
                                setSelectedSupervisorId(row.created_by.id);
                                setSelectedProjectId(row.id);
                                setSelectedPanels(
                                  projectPanels[row.id] &&
                                  projectPanels[row.id][row.student.id]
                                    ? projectPanels[row.id][row.student.id].panels.map((panel) => panel.id)
                                    : []
                                );
                                
                                setOpenDialog(true);
                              }}
                              variant="text"
                            >
                              {projectPanels[row.id] &&
                              projectPanels[row.id][row.student.id] &&
                              projectPanels[row.id][row.student.id].panels &&
                              projectPanels[row.id][row.student.id].panels
                                .length > 0
                                ? "Re-assign Panels"
                                : "Assign Panels"}
                            </Button>
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={filteredProjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Box>
        </Grid>
      </Grid>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        aria-labelledby="assign-panels-dialog"
      >
        <DialogTitle id="assign-panels-dialog-title">Assign Panels</DialogTitle>
        <DialogContent style={{ maxHeight: "200px", overflowY: "auto" }}>
          <DialogContentText style={{marginBottom:'20px'}}>
            Select panels for {selectedStudentName}.
          </DialogContentText>
          <FormControl
            fullWidth
            variant="outlined"
            style={{ marginBottom: "20px" }}
          >
            <InputLabel id="panels-select-label">Panels</InputLabel>
            <Select
              labelId="panels-select-label"
              id="panels-select"
              multiple
              value={selectedPanels}
              onChange={(event) => {
                if (event.target.value.length <= 2) {
                  setSelectedPanels(event.target.value);
                } else {
                  handleAlertOpen("You can only select a maximum of 2 panels.","error");
                }
              }}
              label="Panels"
              renderValue={(selected) => (
                <div>
                  {selected.map((value) => {
                    const supervisor = supervisorList.find(
                      (s) => s.id === value
                    );
                    return (
                      <Chip
                        key={value}
                        label={supervisor ? supervisor.full_name : ""}
                        style={{
                          margin: "2px",
                          backgroundColor: "#bbdefb",
                          fontSize: "1rem",
                          borderRadius: "13px",
                        }}
                      />
                    );
                  })}
                </div>
              )}
            >
              {supervisorList.map((supervisor) => (
                <MenuItem
                  key={supervisor.id}
                  value={supervisor.id}
                  disabled={supervisor.id === selectedSupervisorId}
                >
                  <Checkbox
                    checked={selectedPanels.indexOf(supervisor.id) > -1}
                  />
                  <ListItemText primary={supervisor.full_name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            color="primary"
            disabled={loading}
          >
            Close
          </Button>
          <Button
            onClick={() => {
              console.log("Selected Panels:", selectedPanels);
              assignPanels();
            }}
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : "Save Changes"}
          </Button>
        </DialogActions>
      </Dialog>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.modal + 1  }}
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
