import React, { useEffect, useState } from "react";
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
  Typography,
  Card,
  Divider,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
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
  const [projectPanels, setProjectPanels] = useState({});
  const [openRows, setOpenRows] = useState({});
  const [supervisorEvaluations, setSupervisorEvaluations] = useState({});
  const [panelEvaluations, setPanelEvaluations] = useState({});

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
    { label: "Student", field: "assigned_to" },
    { label: "Matric number", field: "matric" },
    { label: "Supervisor(60%)" },
    { label: "Panels (40%)" },
    { label: "Final Score (100%)", field: "final_score" },
    { label: "Grade", field: "grade" },
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

  const gradeToValue = {
    "A+": 95, // Midpoint between 90 and 100
    A: 85, // Midpoint between 80 and 90
    "A-": 77.5, // Midpoint between 75 and 80
    "B+": 72.5, // Midpoint between 70 and 75
    B: 67.5, // Midpoint between 65 and 70
    "B-": 62.5, // Midpoint between 60 and 65
    "C+": 57.5, // Midpoint between 55 and 60
    C: 52.5, // Midpoint between 50 and 55
    "C-": 47.5, // Midpoint between 45 and 50
    "D+": 42.5, // Midpoint between 40 and 45
    D: 37.5, // Midpoint between 35 and 40
    F: 0,
    Incomplete: -1, // Less than F
  };

  const sortedProjects = filteredProjects.sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    // Handle nested properties for sorting
    if (sortField === "assigned_to") {
      fieldA = a.student_fullname;
      fieldB = b.student_fullname;
    } else if (sortField === "matric") {
      fieldA = a.student_username.match(/\d+/)
        ? parseInt(a.student_username.match(/\d+/)[0], 10)
        : 0;
      fieldB = b.student_username.match(/\d+/)
        ? parseInt(b.student_username.match(/\d+/)[0], 10)
        : 0;
    } else if (sortField === "final_score") {
      fieldA = parseFloat(a.final_score) || 0;
      fieldB = parseFloat(b.final_score) || 0;
    } else if (sortField === "grade") {
      if (sortDirection === "asc") {
        return gradeToValue[fieldA] - gradeToValue[fieldB];
      } else {
        return gradeToValue[fieldB] - gradeToValue[fieldA];
      }
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

  const fetchData = async () => {
    try {
      // Fetch projects
      const projectsResponse = await api.get("projects/");
      setProjects(projectsResponse.data);

      const flattened = projectsResponse.data.flatMap((project) => {
        return project.assigned_to.map((student) => ({
          ...project,
          student_fullname: student.full_name,
          student_username: student.username,
          student: student,
        }));
      });

      const filtered = flattened.filter((project) =>
        project.student_fullname
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );

      setFilteredProjects(filtered);

      // Fetch the panels
      const panelResponse = await api.get("student_project_panel/?role=coordinator");
      const panelsData = panelResponse.data.reduce((acc, item) => {
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

      const promises = [];

      for (const project of projectsResponse.data) {
        for (const student of project.assigned_to) {
          const key = `${project.id}-${student.id}`;

          const supervisorPromise = api
            .get(`supervisor_evaluation/?role=coordinator`)
            .then((response) => {
              const supervisorEval = response.data.filter(
                (evaluation) => evaluation.student === student.id
              );
              setSupervisorEvaluations((prevSupervisorEval) => ({
                ...prevSupervisorEval,
                [key]: supervisorEval,
              }));
            })
            .catch((error) => {
              console.error(
                "Error fetching supervisor evaluation for student",
                student.id,
                "and project",
                project.id,
                ":",
                error
              );
            });

          const panelPromise = api
            .get(`panel_evaluation/`)
            .then((response) => {
              const panelEval = response.data.filter(
                (evaluation) => evaluation.student === student.id
              );
              setPanelEvaluations((prevPanelEval) => ({
                ...prevPanelEval,
                [key]: panelEval,
              }));
            })
            .catch((error) => {
              console.error(
                "Error fetching panel evaluations for student",
                student.id,
                "and project",
                project.id,
                ":",
                error
              );
            });

          promises.push(supervisorPromise, panelPromise);
        }
      }

      await Promise.all(promises);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const CollapsibleRowContent = ({ row }) => {
    const key = `${row.id}-${row.student.id}`;
    const supervisorEvaluation = supervisorEvaluations[key] || [];
    const panelEvaluation = panelEvaluations[key] || [];

    return (
      <Box margin={2}>
        <Typography variant="h6" gutterBottom>
          Detailed Scores
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ marginBottom: 1 }}
              >
                <strong>Supervisor</strong>
                <Typography
                  variant="body2"
                  display="block"
                  sx={{ fontStyle: "italic" }}
                >
                  <strong>{row.created_by.full_name}</strong>
                </Typography>
              </Typography>

              {supervisorEvaluation.length > 0 ? (
                supervisorEvaluation.map((evaluation, index) => (
                  <div key={index}>
                    <Grid container alignItems="center">
                      <Box component="span" width={200}>
                        Proposal (10%)
                      </Box>
                      <Box component="span">: {evaluation.proposal_score}</Box>
                    </Grid>
                    <Grid container alignItems="center">
                      <Box component="span" width={200}>
                        Report (40%)
                      </Box>
                      <Box component="span">: {evaluation.report_score}</Box>
                    </Grid>
                    <Grid container alignItems="center">
                      <Box component="span" width={200}>
                        Conduct (10%)
                      </Box>
                      <Box component="span">: {evaluation.conduct_score}</Box>
                    </Grid>
                    <Divider sx={{ my: 1 }} />
                    <Grid container alignItems="center">
                      <Box component="span" width={200}>
                        Total Score (60%)
                      </Box>
                      <Box component="span">
                        : {evaluation.total_supervisor_score}
                      </Box>
                    </Grid>
                  </div>
                ))
              ) : (
                <div>No supervisor evaluation available</div>
              )}
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card variant="outlined" sx={{ p: 2 }}>
              <Typography
                variant="subtitle1"
                gutterBottom
                sx={{ marginBottom: 1 }}
              >
                <strong>Panel</strong>
              </Typography>
              {panelEvaluation.length > 0 ? (
                <>
                  {panelEvaluation.map((evaluation, index) => (
                    <div key={index}>
                      <Grid container alignItems="center">
                        <Box component="span" width={200}>
                          {evaluation.panel
                            ? evaluation.panel.full_name
                            : `Panel ${index + 1}:`}
                        </Box>
                        <Box component="span">
                          : {evaluation.pitching_score}
                        </Box>
                      </Grid>
                    </div>
                  ))}
                  <Divider sx={{ my: 1 }} />
                  {(() => {
                    const totalPanels =
                      projectPanels[row.id]?.[row.student.id]?.panels?.length ||
                      0;
                    if (panelEvaluation.length === totalPanels) {
                      return (
                        <Grid container alignItems="center">
                          <Box component="span" width={200}>
                            Average Score (40%)
                          </Box>
                          <Box component="span">
                            : {panelEvaluation[0].average_score}
                          </Box>
                        </Grid>
                      );
                    } else {
                      return "Not all panels have evaluated";
                    }
                  })()}
                </>
              ) : (
                <div>No panel evaluation available</div>
              )}
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const handleRowClick = (projectId, studentId) => {
    const key = `${projectId}-${studentId}`;
    setOpenRows((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const calculateGrade = (totalScore) => {
    if (totalScore === null || totalScore === undefined) return "Incomplete";
    if (totalScore >= 90) return "A+";
    else if (totalScore >= 80) return "A";
    else if (totalScore >= 75) return "A-";
    else if (totalScore >= 70) return "B+";
    else if (totalScore >= 65) return "B";
    else if (totalScore >= 60) return "B-";
    else if (totalScore >= 55) return "C+";
    else if (totalScore >= 50) return "C";
    else if (totalScore >= 45) return "C-";
    else if (totalScore >= 40) return "D+";
    else if (totalScore >= 35) return "D";
    else return "F";
  };

  const isSupervisorEvaluationComplete = (evaluation) => {
    const isComplete =
      evaluation.proposal_score != null &&
      evaluation.report_score != null &&
      evaluation.conduct_score != null;
    return isComplete;
  };

  const saveTotalScoreAndGrade = async (
    studentId,
    projectId,
    totalScore,
    grade
  ) => {
    try {
      const url = "total_scores/";

      const data = {
        student: studentId,
        project: projectId,
        total_score: totalScore,
        grade: grade,
      };

      await api.post(url, data);
      console.log(
        "Total Score and Grade saved successfully for student",
        studentId
      );
    } catch (error) {
      console.error("Error saving Total Score and Grade:", error);
    }
  };

  const generateCSV = () => {
    // Find the maximum number of panels across all projects
    let maxPanels = 0;
    paginatedProjects.forEach((row) => {
      const key = `${row.id}-${row.student.id}`;
      const panelEvaluation = panelEvaluations[key] || [];
      maxPanels = Math.max(maxPanels, panelEvaluation.length);
    });

    // Construct the dynamic headers based on the maximum number of panels
    const baseHeaders = [
      "No.",
      "Student",
      "Matric Number",
      "Proposal Score",
      "Report Score",
      "Conduct Score",
      "Total Supervisor Score",
    ];
    const panelHeaders = Array.from(
      { length: maxPanels },
      (_, i) => `Panel ${i + 1}`
    );
    const otherHeaders = ["Average Panel Score", "Final Score", "Grade"];
    const headers = [...baseHeaders, ...panelHeaders, ...otherHeaders];

    // Start the CSV content with the headers
    let csvContent = headers.join(",") + "\n";

    paginatedProjects.forEach((row, index) => {
      const projectNumber = index + 1;
      const key = `${row.id}-${row.student.id}`;
      const supervisorEvaluation = supervisorEvaluations[key] || [];
      const panelEvaluation = panelEvaluations[key] || [];

      const supervisor = supervisorEvaluation[0] || {};
      const panels = panelEvaluation.map((e) => e.pitching_score).join(",");
      const totalPanelScore =
        panelEvaluation.length > 0 ? panelEvaluation[0].average_score : "";

      const supervisorScore =
        parseFloat(supervisor.total_supervisor_score) || null;
      const panelScore = parseFloat(totalPanelScore) || null;
      let totalScore = null;
      let grade = null;

      if (supervisorScore !== null && panelScore !== null) {
        totalScore = (supervisorScore + panelScore).toFixed(2);
        grade = calculateGrade(totalScore);
      }

      const panelScores =
        panelEvaluations[key]?.map((e) => e.pitching_score) || [];
      // Ensure the array has the same length as maxPanels, padding with empty strings if needed
      const paddedPanelScores = [
        ...panelScores,
        ...Array(maxPanels - panelScores.length).fill(""),
      ];

      const rowData = [
        projectNumber,
        row.student_fullname,
        row.student_username,
        supervisor.proposal_score || "",
        supervisor.report_score || "",
        supervisor.conduct_score || "",
        supervisor.total_supervisor_score || "",
        ...paddedPanelScores,
        totalPanelScore,
        totalScore || "",
        grade || "",
      ].join(",");

      csvContent += rowData + "\n";
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "student_reports.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ThemeProvider theme={theme}>
      <CoordinatorNavigationBar />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid item xs={12}>
            <TextField
              label="Search Student"
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
                      const key = `${row.id}-${row.student.id}`;

                      // Retrieve the supervisor and panel scores
                      const supervisorScoreArray =
                        supervisorEvaluations[key]
                          ?.filter((evaluation) => {
                            return isSupervisorEvaluationComplete(evaluation);
                          })
                          .map(
                            (evaluation) => evaluation.total_supervisor_score
                          ) || [];

                      const supervisorScore =
                        supervisorScoreArray.length > 0
                          ? parseFloat(supervisorScoreArray[0])
                          : null;

                      const totalPanels =
                        projectPanels[row.id]?.[row.student.id]?.panels
                          ?.length || 0;
                      const panelScore =
                        panelEvaluations[key]?.length === totalPanels
                          ? parseFloat(panelEvaluations[key][0]?.average_score)
                          : null;

                      // Calculate the total score and grade if both scores are available
                      let totalScore = null;
                      let grade = null;
                      if (supervisorScore != null && panelScore != null) {
                        totalScore = (supervisorScore + panelScore).toFixed(2);
                        grade = calculateGrade(totalScore);
                        row.final_score = totalScore;
                        row.grade = grade;
                        saveTotalScoreAndGrade(
                          row.student.id,
                          row.id,
                          totalScore,
                          grade
                        );
                      }

                      return (
                        <React.Fragment key={key}>
                          <StyledTableRow
                            hover
                            role="checkbox"
                            tabIndex={-1}
                            onClick={() =>
                              handleRowClick(row.id, row.student.id)
                            }
                          >
                            <StyledTableCell>{projectNumber}</StyledTableCell>
                            <StyledTableCell>
                              {row.student_fullname}
                            </StyledTableCell>
                            <StyledTableCell>
                              {row.student_username}
                            </StyledTableCell>
                            <StyledTableCell>
                              {supervisorScore != null ? supervisorScore : ""}
                            </StyledTableCell>
                            <StyledTableCell>{panelScore}</StyledTableCell>
                            <StyledTableCell>{totalScore}</StyledTableCell>
                            <StyledTableCell>{grade}</StyledTableCell>
                            <StyledTableCell>
                              {openRows[key] ? (
                                <ExpandLessIcon />
                              ) : (
                                <ExpandMoreIcon />
                              )}
                            </StyledTableCell>
                          </StyledTableRow>
                          {openRows[key] && (
                            <StyledTableRow>
                              <StyledTableCell colSpan={columns.length}>
                                <CollapsibleRowContent row={row} />
                              </StyledTableCell>
                            </StyledTableRow>
                          )}
                        </React.Fragment>
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
          <Button
            onClick={generateCSV}
            variant="contained"
            color="primary"
            sx={{ marginLeft: "30px", marginBottom: "20px" }}
          >
            Generate csv
          </Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
