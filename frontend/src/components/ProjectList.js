import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ThemeProvider,
  CircularProgress,
  Typography,
  Alert,
  Backdrop,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import PeopleIcon from "@mui/icons-material/People";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
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

export default function ProjectList(props) {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [applicationStatus, setApplicationStatus] = useState("");
  const [proposalStatus, setProposalStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [lecturerStudentCounts, setLecturerStudentCounts] = useState({});
  const [semesterInfo, setSemesterInfo] = useState({});
  const [isProgramCoordinator, setIsProgramCoordinator] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [numOfStudents, setNumOfStudents] = useState("");
  const [isLecturer, setIsLecturer] = useState(false);
  const [numOfStudentsPerLecturer, setNumOfStudentsPerLecturer] =useState(null);
  const [studentLimitId, setStudentLimitId] = useState(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const handleApplyClick = (projectId) => {
    setSelectedProjectId(projectId);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const columns = [
    { label: "No." },
    { label: "Project Title", field: "title" },
    { label: "Supervisor", field: "created_by.full_name" },
    {
      label: "",
      format: (value) => <Button>Details</Button>,
    },
  ];

  if (props.showApplyButton) {
    columns.push({
      id: "apply",
      label: "",
      format: (value, project) => (
        <Button
          onClick={() => handleApplyClick(project.id)}
          variant="outlined"
          style={{ textTransform: "none" }}
          disabled={
            applicationStatus === "Pending" ||
            applicationStatus === "Approved" ||
            proposalStatus === "Pending" ||
            proposalStatus === "Approved" ||
            project.assigned_to.length == project.num_of_student
          }
        >
          Apply
        </Button>
      ),
    });
  }

  useEffect(() => {
    api
      .get("projects/")
      .then((response) => {
        console.log("Projects", response.data);
        setProjects(response.data);

        // Calculate student counts per lecturer
        const counts = {};
        response.data.forEach((project) => {
          const lecturerId = project.created_by.id;
          counts[lecturerId] =
            (counts[lecturerId] || 0) + project.assigned_to.length;
        });
        setLecturerStudentCounts(counts);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error.response.data);
      });

    api
      .get("applications/", { params: { user_projects: true } })
      .then((response) => {
        console.log("Application", response.data);
        const applications = response.data;
        const status = applications.length > 0 ? applications[0].status : "";
        setApplicationStatus(status);
      })
      .catch((error) => {
        console.error(
          "Error fetching application status:",
          error.response.data
        );
      });

    api
      .get("proposals/", { params: { user_projects: true } })
      .then((response) => {
        console.log("Proposal", response.data);
        const proposals = response.data;
        const status = proposals.length > 0 ? proposals[0].status : "";
        setProposalStatus(status);
      })
      .catch((error) => {
        console.error("Error fetching proposal status:", error.response.data);
      });

    if (!semesterInfo.semester || !semesterInfo.academicYear) {
      api
        .get("semester/")
        .then((response) => {
          const allSemesters = response.data;

          // Find the semester where is_latest is true
          const latestSemester = allSemesters.find((sem) => sem.is_latest);

          setSemesterInfo(latestSemester);
          console.error("semester", semesterInfo);
        })
        .catch((err) => {
          console.error("Error fetching semester data:", err.response.data);
        });
    }

    const storedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    if (user && user.groups.includes(4)) {
      setIsProgramCoordinator(true);
    } else {
      setIsProgramCoordinator(false);
    }

    if (user && user.groups.includes(2)) {
      setIsLecturer(true);
    } else {
      setIsLecturer(false);
    }

    api
      .get("/student_limit/")
      .then((response) => {
        setNumOfStudentsPerLecturer(response.data[0].num_of_students);
      })
      .catch((error) => {
        console.error("Error fetching number of students per lecturer:", error);
      });

      fetchNumOfStudentsPerLecturer();
  }, []);

  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, searchTerm]);

  const applyForProject = (projectId) => {
    setLoading(true);
    const data = {
      project_id: projectId,
    };

    api
      .post("applications/", data) //data=projectID
      .then((response) => {
        console.log(response.data);
        navigate("/studentproject", {
          state: {
            alertMessage: "You have successfully applied for the project.",
            severity: "success",
          },
        });
      })
      .catch((error) => {
        console.error(error.response.data);
      })
      .finally(() => {
        setLoading(false);
        setOpen(false);
      });
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getNestedValue = (obj, path) => {
    return path.split(".").reduce((value, key) => {
      return value ? value[key] : null;
    }, obj);
  };

  const sortedProjects = filteredProjects.sort((a, b) => {
    const fieldA = getNestedValue(a, sortField);
    const fieldB = getNestedValue(b, sortField);

    if (fieldA === fieldB) return 0;

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

  const handleDialogToggle = () => {
    setNumOfStudents(numOfStudentsPerLecturer ? numOfStudentsPerLecturer.toString() : '');
    setIsDialogOpen(!isDialogOpen);
  };

  const handleSave = () => {
    setLoading(true);
    const data = { num_of_students: numOfStudents, semester: semesterInfo.id };
  
    const saveOrUpdate = studentLimitId ? 
      api.patch(`/student_limit/${studentLimitId}/`, data) :
      api.post('/student_limit/', data);
  
    saveOrUpdate
      .then(response => {
        console.log("Data saved successfully:", response.data);
        handleAlertOpen("Number of students updated successfully");
        fetchNumOfStudentsPerLecturer();
        setIsDialogOpen(false);
      })
      .catch(error => {
        console.error("Error saving data:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  

  // Function to fetch the number of students per lecturer
  const fetchNumOfStudentsPerLecturer = () => {
    api.get('/student_limit/')
      .then((response) => {
        if (response.data.length > 0) {
          setNumOfStudentsPerLecturer(response.data[0].num_of_students);
          setStudentLimitId(response.data[0].id); // Assuming 'id' is the field name
        
          console.log("Number of students per lecturer: ", response.data[0].num_of_students);
        }
      })
      .catch((error) => {
        console.error("Error fetching number of students per lecturer:", error.response.data);
      });
  };
  

  const handleCancel = () => {
    setIsDialogOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid
            container
            justifyContent="space-between"
            alignItems="center"
            spacing={2}
            sx={{ padding: 2, marginBottom: 2 }}
          >
            {/* Semester Information */}
            <Grid item>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: "bold",
                  color: "#311b92",
                  marginLeft: "20px",
                }}
              >
                Semester {semesterInfo.semester}, {semesterInfo.academic_year}
              </Typography>

              {/* Show the 'Set Number of Students for Each Lecturer' button only for program coordinator and when numOfStudentsPerLecturer is null */}
              {isProgramCoordinator && numOfStudentsPerLecturer === null && (
                <Button
                  variant="outlined"
                  color="primary"
                  style={{
                    marginLeft: "20px",
                    marginTop: "10px",
                    textTransform: "none",
                    borderRadius: "8px",
                    boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)",
                    transition: "all 0.3s ease",
                    fontSize: "1rem",
                    fontWeight: "500",
                  }}
                  onMouseOver={(e) =>
                    (e.target.style.backgroundColor = "#f5f5f5")
                  }
                  onMouseOut={(e) =>
                    (e.target.style.backgroundColor = "transparent")
                  }
                  onClick={handleDialogToggle}
                >
                  Set Number of Students for Each Lecturer
                </Button>
              )}

              {/* Display the number of students per lecturer if data is available */}
              {numOfStudentsPerLecturer !== null && isLecturer &&(
                <Box
                  sx={{
                    margin: "20px",
                    marginTop: "0.2rem",
                    marginBottom: "0.1rem",
                  }}
                >
                  <Paper
                    sx={{
                      padding: 1,
                      marginY: 0.1,
                      backgroundColor: "#d7d5f2",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PeopleIcon sx={{ marginRight: 1, color: "#311b92" }} />
                      <Typography variant="h7" sx={{ color: "#311b92" }}>
                        Number of Students for Each Lecturer:{" "}
                        {numOfStudentsPerLecturer}
                      </Typography>
                    </Box>
                    {isProgramCoordinator && (
                      <Button
                        variant="text"
                        sx={{
                          textDecoration: "underline",
                          textTransform: "none",
                          fontSize: "0.875rem",
                          color: "#1976d2",
                          ":hover": { bgcolor: "transparent" },
                        }}
                        onClick={handleDialogToggle}
                      >
                        Edit
                      </Button>
                    )}
                  </Paper>
                </Box>
              )}
            </Grid>

            {/* Search Field */}
            <Grid item sx={{ marginLeft: "20px", marginRight: "20px" }}>
              <TextField
                label="Search Project"
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{
                  maxWidth: "300px", // Adjust the width as needed
                }}
              />
            </Grid>
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
                          key={row.id}
                        >
                          <StyledTableCell>{projectNumber}</StyledTableCell>
                          <StyledTableCell>{row.title}</StyledTableCell>
                          <StyledTableCell>
                            {row.created_by.full_name}
                            {lecturerStudentCounts[row.created_by.id] >= numOfStudentsPerLecturer && (
                              <span
                                style={{
                                  backgroundColor: "#ede5ff",
                                  color: "#9869fd",
                                  padding: "2px 5px",
                                  borderRadius: "4px",
                                  marginLeft: "0.5rem",
                                  fontSize: "0.75rem",
                                }}
                              >
                                Full
                              </span>
                            )}
                          </StyledTableCell>

                          <StyledTableCell>
                            <Button
                              onClick={() => {
                                navigate(`/projectdetail/${row.id}`);
                              }}
                              variant="text"
                              style={{ textTransform: "none" }}
                            >
                              Details
                            </Button>
                          </StyledTableCell>
                          {props.showApplyButton && (
                            <StyledTableCell>
                              <Button
                                onClick={() => handleApplyClick(row.id)}
                                variant="outlined"
                                style={{ textTransform: "none" }}
                                disabled={
                                  applicationStatus === "Pending" ||
                                  applicationStatus === "Approved" ||
                                  proposalStatus === "Pending" ||
                                  proposalStatus === "Approved" ||
                                  row.assigned_to.length ==
                                    row.num_of_student ||
                                  lecturerStudentCounts[row.created_by.id] >= numOfStudentsPerLecturer
                                }
                              >
                                Apply
                              </Button>
                            </StyledTableCell>
                          )}
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50, 100]}
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
        {props.showApplyButton && (
          <Grid item xs={12}>
            <Dialog open={open} onClose={handleClose}>
              <DialogTitle>Are you sure?</DialogTitle>
              <DialogContent>
                Each student can only apply to <strong>one</strong> project at a
                time.
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose} disabled={loading}>
                  Cancel
                </Button>
                <Button
                  onClick={() => applyForProject(selectedProjectId)}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : "Apply"}
                </Button>
              </DialogActions>
            </Dialog>
          </Grid>
        )}
        <Dialog open={isDialogOpen} onClose={handleDialogToggle}>
          <DialogTitle>Number of Students for Each Lecturer</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="numOfStudents"
              label="Number of Students"
              type="number"
              fullWidth
              variant="outlined"
              value={numOfStudents}
              onChange={(e) => setNumOfStudents(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCancel} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Grid>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={alertOpen}
      >
        <Alert
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{
            boxShadow: 24,
            p: 2,
            minWidth: "20%",
            display: "flex",
          }}
        >
          {alertMessage}
        </Alert>
      </Backdrop>
    </ThemeProvider>
  );
}
