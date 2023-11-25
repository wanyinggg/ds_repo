import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  TextField,
  Button, 
  Alert, Backdrop
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import { useEffect, useState } from "react";
import { ThemeProvider, styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import PanelNavigationBar from "./reusable/PanelNavigationBar";
import Theme from "./reusable/Theme";
import api from "./axios";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: "white",
    position: "relative",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export default function PanelEvaluation() {
  const [projectPanels, setProjectPanels] = useState({});
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const navigate = useNavigate();
  const location = useLocation();
  const [evaluationData, setEvaluationData] = useState({});
  const [driveUrls, setDriveUrls] = useState({});
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const [filteredProjects, setFilteredProjects] = useState([]);

  const renderButton = (project, student) => {
    const key = `${project.id}-${student.id}-${user.id}`;
    const evaluationEntry = evaluationData[key];
    const mode = evaluationEntry ? "update" : "create";
    return (
      <Button
        onClick={() =>
          handleEvaluation(project, student, mode, evaluationEntry?.id)
        }
      >
        {mode === "update" ? "Re-evaluate" : "Evaluate"}
      </Button>
    );
  };

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const columns = [
    { label: "No." },
    { label: "Project Title", field: "title" },
    { label: "Student", field: "student" },
    { label: "Matric Number", field: "matric" },
    { label: "Student's Submission" },
    { label: "Panels" },
    { label: "Scores" },
    { label: "Average Score" },
    { label: "" },
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

    if (sortField === "student") {
      fieldA = a.student_fullname; 
      fieldB = b.student_fullname; 
    } else if (sortField === "supervisor") {
      fieldA = a.created_by.full_name;
      fieldB = b.created_by.full_name;
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

  const fetchData = () => {
    // Fetch the panels first
    api.get(`student_project_panel/?context=review-panel&role=supervisor`).then((response) => {
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

      // Fetch the projects next
      api
        .get("projects/")
        .then(async (response) => {
          console.log("Projects", response.data);

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

          // Filter projects based on user's membership in the panel
          const userProjects = filtered.filter(
            (project) =>
              panelsData[project.id] &&
              panelsData[project.id][project.student.id] &&
              panelsData[project.id][project.student.id].panels.some(
                (panel) => panel.id === user.id
              )
          );

          // Set the filtered projects into state
          setProjects(userProjects);

          let updatedDriveUrls = { ...driveUrls };
          const fetchTasks = [];
          for (let project of response.data) {
            for (let student of project.assigned_to) {
              fetchTasks.push(
                (async () => {
                  await fetchDrive(student.username, updatedDriveUrls);
                })()
              );
            }
          }
          await Promise.all(fetchTasks);
          setDriveUrls(updatedDriveUrls);
        })
        .catch((error) => {
          console.error("Error fetching projects:", error.response.data);
        });

      api
        .get("panel_evaluation/")
        .then((response) => {
          console.log("Evaluations", response.data);

          // Process the evaluation data here to associate it with the respective projects and students
          const evaluationsData = response.data.reduce((acc, item) => {
            const key = `${item.project_id.toString()}-${item.student.toString()}-${item.panel.id.toString()}`;
            acc[key] = item;
            return acc;
          }, {});

          // Store the evaluations data in a suitable state variable
          setEvaluationData(evaluationsData);
          console.log(evaluationsData);
        })
        .catch((error) => {
          console.error("Error fetching evaluations:", error.response.data);
        });
    });
  };

  const fetchDrive = async (username, currentUrls) => {
    try {
      const response = await api.get("/drive_submissions/", {
        params: { student: username },
      });
      if (response.data.length > 0) {
        currentUrls[username] = response.data[0].uploaded_link;
      } else {
        currentUrls[username] = null;
      }
    } catch (error) {
      console.log("Error fetching drive", error.response.data);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = projects.filter(project =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);


  const handleEvaluation = (
    selectedProject,
    selectedStudent,
    mode,
    evaluationId
  ) => {
    navigate("/panelevaluationtemplate", {
      state: {
        project: selectedProject,
        student: selectedStudent,
        mode: mode,
        evaluationId: evaluationId,
      },
    });
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
    if (location.state?.alertMessage && location.state?.severity) {
      handleAlertOpen(location.state.alertMessage, location.state.severity);
      navigate(location.pathname, { replace: true }); 
    }
  }, [location, navigate]);

  return (
    <ThemeProvider theme={Theme}>
      <PanelNavigationBar />
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
          <Box sx={{ margin: "30px", marginTop: "3rem" }}>
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledTableCell
                          key={column.label}
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
                    {sortedProjects.flatMap((row, index) => {
                      const projectNumber = index + 1;

                      const panelMembers = (
                        projectPanels[row.id]?.[row.student.id]?.panels || []
                      )
                        .slice()
                        .sort((a, b) =>
                          a.id === user.id ? -1 : b.id === user.id ? 1 : 0
                        );

                      return panelMembers.map((panel, panelIndex) => {
                        const key = `${row.id.toString()}-${row.student.id.toString()}-${panel.id.toString()}`;
                        const evaluationEntry = evaluationData[key];
                        console.log("Key:", key);
                        console.log("Evaluation Entry:", evaluationEntry);

                        return (
                          <TableRow key={index + "-" + panelIndex}>
                            {panelIndex === 0 && (
                              <>
                                <TableCell rowSpan={panelMembers.length}>
                                  {projectNumber}
                                </TableCell>
                                <TableCell rowSpan={panelMembers.length}>
                                  {row.title}
                                </TableCell>
                                <TableCell rowSpan={panelMembers.length}>
                                  {row.student_fullname}
                                </TableCell>
                                <TableCell rowSpan={panelMembers.length}>
                                  {row.student_username}
                                </TableCell>
                                <TableCell rowSpan={panelMembers.length}>
                                    {driveUrls[row.student_username] && (
                                        <a
                                          href={driveUrls[row.student_username]}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          Google Drive Link
                                        </a>
                                    )}
                                </TableCell>
                              </>
                            )}

                            <TableCell
                              style={{
                                backgroundColor:
                                  panel.id === user.id
                                    ? "#eeeeee"
                                    : "transparent",
                                borderRight:
                                  panel.id === user.id
                                    ? "1px solid #fff"
                                    : "none",
                                padding: "8px",
                              }}
                            >
                              {panel.full_name}
                            </TableCell>
                            <TableCell
                              style={{
                                backgroundColor:
                                  panel.id === user.id
                                    ? "#eeeeee"
                                    : "transparent",
                                padding: "8px",
                              }}
                            >
                              {evaluationEntry?.pitching_score ?? ""}
                            </TableCell>

                            {panelIndex === 0 && (
                              <TableCell
                                rowSpan={panelMembers.length}
                                style={{ verticalAlign: "middle" }}
                              >
                                {panelMembers.every(
                                  (panel) =>
                                    evaluationData[
                                      `${row.id}-${row.student.id}-${panel.id}`
                                    ]
                                )
                                  ? evaluationEntry?.average_score
                                  : null}
                              </TableCell>
                            )}
                            {panelIndex === 0 && (
                              <TableCell rowSpan={panelMembers.length}>
                                {renderButton(row, row.student)}
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      });
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Grid>
      </Grid>
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
