import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Select,
  MenuItem,
  InputLabel,
  Paper,
  Button,
  CircularProgress,
  Typography,
  Box,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import Theme from "./reusable/Theme";
import api from "./axios";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";

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

export default function PreviousProjectList() {
  const [user, setUser] = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const navigateSemester = location.state?.navigateSemester;

  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);
  }, []);

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

  useEffect(() => {
    api.get("semester/")
      .then((response) => {
        const sortedSemesters = response.data.sort((a, b) => b.id - a.id);
        const pastSemesters = sortedSemesters.slice(1);
        setSemesters(pastSemesters);

        // Use the navigateSemester state if it's available; otherwise, use the latest semester.
        const initialSemester = navigateSemester || pastSemesters[0]?.id;

        if (initialSemester) {
          setSelectedSemester(initialSemester);
        }
      })
      .catch((error) => {
        console.error("Error fetching semesters:", error);
      });
  }, [navigateSemester]);

  useEffect(() => {
    let endpoint = "archived_projects/";
    if (selectedSemester) {
      endpoint += `?semester=${selectedSemester}`;
    }

    api
      .get(endpoint)
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.error("Error fetching archived projects:", error);
      });
  }, [selectedSemester]);

  console.log("Projects:", projects);

  return (
    <ThemeProvider theme={Theme}>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SupervisorNavigationBar />
        </Grid>

        <Grid item xs={12}>
          <Box my={3}>
            <div style={{ margin: "1rem 1rem 0 1rem" }}>
              <InputLabel id="semester-label">
                Select Semester and Year
              </InputLabel>
              <Select
                labelId="semester-label"
                value={selectedSemester}
                onChange={(e) => setSelectedSemester(e.target.value)}
                label="Select Semester"
              >
                {semesters.map((semester) => (
                  <MenuItem key={semester.id} value={semester.id}>
                    {`Semester ${semester.semester} - ${semester.academic_year}`}
                  </MenuItem>
                ))}
              </Select>
            </div>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ margin: "1rem", overflow: "hidden", borderRadius: "5px" }}>
            <Paper
              sx={{
                width: "100%",
                overflow: "hidden",
                border: "1px solid #ccc",
              }}
            >
              {projects.length > 0 ? (
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        {columns.map((column) => (
                          <StyledTableCell
                            key={column.label}
                            sx={{ color: "white", fontWeight: "bold" }}
                          >
                            {column.label}
                          </StyledTableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {projects.map((project, index) => (
                        <StyledTableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={index}
                        >
                          <StyledTableCell>{index + 1}</StyledTableCell>
                          <StyledTableCell>{project.title}</StyledTableCell>
                          <StyledTableCell>
                            {project.original_creator_name}
                          </StyledTableCell>
                          <StyledTableCell>
                            {project.original_assigned_to_names
                              ? project.original_assigned_to_names.join(", ")
                              : ""}
                          </StyledTableCell>

                          <StyledTableCell>
                            <Button
                              onClick={() => {
                                navigate(
                                  `/previousprojectdetail/${project.id}`,
                                  {
                                    state: {
                                      navigateSemester: selectedSemester,
                                    },
                                  }
                                );
                              }}
                              variant="text"
                              style={{ textTransform: "none" }}
                            >
                              Details
                            </Button>
                          </StyledTableCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  height="60vh"
                >
                  {projects ? (
                    <Typography variant="body1" color="textSecondary">
                      No projects available for the selected semester.
                    </Typography>
                  ) : (
                    <CircularProgress color="secondary" />
                  )}
                </Box>
              )}
            </Paper>
          </Box>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
