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
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
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
    { label: "Supervisor", field: "created_by" },
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

  return (
    <ThemeProvider theme={theme}>
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
                          key={row.id}
                        >
                          <StyledTableCell>{projectNumber}</StyledTableCell>
                          <StyledTableCell>{row.title}</StyledTableCell>
                          <StyledTableCell>
                            {row.created_by.full_name}
                            {lecturerStudentCounts[row.created_by.id] >= 4 && (
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
                                  lecturerStudentCounts[row.created_by.id] >= 4
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
      </Grid>
    </ThemeProvider>
  );
}
