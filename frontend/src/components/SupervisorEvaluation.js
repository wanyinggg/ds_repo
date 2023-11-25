import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import Theme from "./reusable/Theme";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import {
  Box,
  Button,
  Paper,
  Typography,
  Table,
  TableContainer,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  List,
  ListItem,
  Grid,
  Alert, Backdrop
} from "@mui/material";
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

const LeftBoxListItem = styled(ListItem)(
  ({ theme, isSelected, isHovered }) => ({
    cursor: "pointer",
    backgroundColor: isSelected
      ? theme.palette.primary.main
      : isHovered
      ? theme.palette.primary.main
      : "transparent",
    color: isSelected ? "#fff" : isHovered ? "#fff" : "inherit",
    borderRadius: 3,
    "&:hover": {
      backgroundColor: theme.palette.primary.main,
      color: "#fff",
    },
    height: 50,
    marginBottom: 5,
    display: "flex",
    alignItems: "center",
    paddingLeft: theme.spacing(2),
  })
);

export default function SupervisorEvaluation() {
  const location = useLocation();
  // const [selectedOption, setSelectedOption] = useState(location.state?.selectedOption || "Proposal");
  const [hoveredOption, setHoveredOption] = useState("");
  const [projects, setProjects] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [evaluatedStatus, setEvaluatedStatus] = useState({});
  const [proposalUrls, setProposalUrls] = useState({});
  const [reportUrls, setReportUrls] = useState({});
  const [driveUrls, setDriveUrls] = useState({});
  const navigate = useNavigate();
  const [scores, setScores] = useState({});
  const [evaluationIds, setEvaluationIds] = useState({});
  const savedOption = sessionStorage.getItem("selectedOption");
  const [selectedOption, setSelectedOption] = useState(savedOption || "Proposal");
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  const renderButton = (student) => {
    const key = `${student.username}_${selectedOption}`;
    const mode = evaluatedStatus[key] ? "update" : "create";
    const evaluationId = evaluationIds[student.username] || null;
    return (
      <Button
        onClick={() =>
          handleEvaluateClick(projects, student, mode, evaluationId)
        }
      >
        {mode === "update" ? "Re-evaluate" : "Evaluate"}
      </Button>
    );
  };

  const columns = () => {
    const baseColumns = [
      { label: "No." },
      { label: "Project Title" },
      { label: "Student" },
      { label: "Matric Number" },
      { label: selectedOption === "Overall Score" ? "Total Scores" : "Scores" },
      { label: "" },
      {
        label: "",
        format: (value, row) => renderButton(row.student),
      },
    ];

    if (
      selectedOption === "Proposal" ||
      selectedOption === "Report" 
    ) {
      baseColumns.splice(4, 0, { label: "Student's Submission" });
    }

    if (selectedOption === "Overall Score") {
      baseColumns.splice(
        4,
        0,
        { label: "Proposal" },
        { label: "Report" },
        { label: "Supervisee Conduct" }
      );
    }

    return baseColumns;
  };

  const handleOptionClick = (option) => {
    setSelectedOption(option);
  };

  const handleOptionHover = (option) => {
    setHoveredOption(option);
  };

  const handleOptionHoverLeave = () => {
    setHoveredOption("");
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

  useEffect(() => {
    sessionStorage.setItem("selectedOption", selectedOption);
  }, [selectedOption]);

  useEffect(() => {
    api
      .get("projects/", { params: { user_projects: true } })
      .then(async (response) => {
        setProjects(response.data);

        let updatedScores = {};
        let updatedProposalUrls = { ...proposalUrls };
        let updatedReportUrls = { ...reportUrls };
        let updatedDriveUrls = { ...driveUrls };

        const fetchTasks = [];

        for (let project of response.data) {
          for (let student of project.assigned_to) {
            fetchTasks.push(
              (async () => {
                await fetchDocument(
                  project.id,
                  student.username,
                  "Proposal",
                  updatedProposalUrls
                );
                await fetchDocument(
                  project.id,
                  student.username,
                  "Report",
                  updatedReportUrls
                );
                await fetchLink(
                  project.id,
                  student.username,
                  "Presentation",
                  updatedDriveUrls
                );

                const proposalScore = await fetchScore(
                  project.id,
                  student.username,
                  "Proposal"
                );
                const reportScore = await fetchScore(
                  project.id,
                  student.username,
                  "Report"
                );
                const conductScore = await fetchScore(
                  project.id,
                  student.username,
                  "Supervisee Conduct"
                );
                const overallScore = await fetchScore(
                  project.id,
                  student.username,
                  "Overall Score"
                );

                updatedScores[`${project.id}_${student.username}_proposal`] =
                  proposalScore;
                updatedScores[`${project.id}_${student.username}_report`] =
                  reportScore;
                updatedScores[`${project.id}_${student.username}_conduct`] =
                  conductScore;
                updatedScores[`${project.id}_${student.username}_overall`] =
                  overallScore;
              })()
            );
          }
        }

        await Promise.all(fetchTasks);

        setScores(updatedScores);
        setProposalUrls(updatedProposalUrls);
        setReportUrls(updatedReportUrls);
        setDriveUrls(updatedDriveUrls);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error);
      });
  }, []);

  const flattenedProjects = projects.flatMap((project) => {
    return project.assigned_to.map((student) => ({
      ...project,
      student_fullname: student.full_name,
      student_username: student.username,
      student: student,
    }));
  });

  const fetchDocument = async (projectId, username, docType, currentUrls) => {
    let url = "";
    switch (docType) {
      case "Proposal":
        url = "/proposal_submissions/";
        break;
      case "Report":
        url = "/report_submissions/";
        break;
      default:
        return;
    }

    try {
      const response = await api.get(url, { params: { student: username } });
      if (response.data.length > 0) {
        currentUrls[username] = response.data[0].uploaded_file;
        console.log(
          `Fetched URL for ${username}:`,
          response.data[0].uploaded_file
        );
      }
    } catch (error) {
      console.log("Error fetching document", error.response.data);
    }
  };

  const fetchLink = async (projectId, username, linkType, currentUrls) => {
    let url = "";
    switch (linkType) {
      case "Presentation":
        url = "/drive_submissions/";
        break;
      default:
        return;
    }

    try {
      const response = await api.get(url, { params: { student: username } });
      console.log(`API response for ${username}:`, response.data);

      if (response.data.length > 0) {
        currentUrls[username] = response.data[0].uploaded_link;
        console.log(
          `Fetched URL for ${username}:`,
          response.data[0].uploaded_link
        );
      } else {
        currentUrls[username] = null;
      }
    } catch (error) {
      console.log("Error fetching link", error.response.data);
    }
  };

  const fetchScore = async (projectId, username, scoreType) => {
    try {
      const endpoint = "supervisor_evaluation/";
      const response = await api.get(endpoint, {
        params: { student: username },
      });
      console.log("API Response:", response.data);

      if (response.data && response.data.length > 0) {
        let scoreValue;
        switch (scoreType) {
          case "Proposal":
            scoreValue = response.data[0].proposal_score;
            break;
          case "Report":
            scoreValue = response.data[0].report_score;
            break;
          case "Supervisee Conduct":
            scoreValue = response.data[0].conduct_score;
            break;
          case "Overall Score":
            scoreValue = response.data[0].total_supervisor_score;
            break;
          default:
            scoreValue = null;
        }

        // Update the evaluatedStatus state
        if (scoreValue && scoreValue > 0) {
          setEvaluatedStatus((prevStatus) => ({
            ...prevStatus,
            [`${username}_${scoreType}`]: true,
          }));
        }
        // Store the evaluation ID for the student
        setEvaluationIds((prevState) => ({
          ...prevState,
          [username]: response.data[0].id,
        }));

        return scoreValue;
      } else {
        return null;
      }
    } catch (error) {
      console.error(`Error fetching ${scoreType} score:`, error);
      return null;
    }
  };

  const handleEvaluateClick = (
    selectedProject,
    selectedStudent,
    mode,
    evaluationId
  ) => {
    switch (selectedOption) {
      case "Proposal":
        console.log("Sending student data:", selectedStudent);
        console.log("Sending project data:", selectedProject);
        console.log("ID:", evaluationId);
        navigate("/proposal_evaluation", {
          state: {
            project: selectedProject,
            student: selectedStudent,
            mode: mode,
            evaluationId: evaluationId,
          },
        });
        break;
      case "Report":
        console.log("Sending student data:", selectedStudent);
        console.log("Sending project data:", selectedProject);
        console.log("ID:", evaluationId);
        navigate("/report_evaluation", {
          state: {
            project: selectedProject,
            student: selectedStudent,
            mode: mode,
            evaluationId: evaluationId,
          },
        });
        break;
      case "Supervisee Conduct":
        navigate("/conduct_evaluation", {
          state: {
            project: selectedProject,
            student: selectedStudent,
            mode: mode,
            evaluationId: evaluationId,
          },
        });
        break;
      default:
        break;
    }
  };

  return (
    <ThemeProvider theme={Theme}>
      <SupervisorNavigationBar />

      <Grid container spacing={2} mt={4}>
        {/* Left Box */}
        <Grid item xs={12} md={2} sx={{ marginLeft: 1, marginRight: 1 }}>
          <Paper elevation={3} sx={{ padding: 2, borderRadius: 1 }}>
            <List>
              <LeftBoxListItem
                onClick={() => handleOptionClick("Proposal")}
                isSelected={selectedOption === "Proposal"}
                isHovered={hoveredOption === "Proposal"}
                onMouseEnter={() => handleOptionHover("Proposal")}
                onMouseLeave={handleOptionHoverLeave}
              >
                Proposal
              </LeftBoxListItem>
              <LeftBoxListItem
                onClick={() => handleOptionClick("Report")}
                isSelected={selectedOption === "Report"}
                isHovered={hoveredOption === "Report"}
                onMouseEnter={() => handleOptionHover("Report")}
                onMouseLeave={handleOptionHoverLeave}
              >
                Report
              </LeftBoxListItem>
              <LeftBoxListItem
                onClick={() => handleOptionClick("Supervisee Conduct")}
                isSelected={selectedOption === "Supervisee Conduct"}
                isHovered={hoveredOption === "Supervisee Conduct"}
                onMouseEnter={() => handleOptionHover("Supervisee Conduct")}
                onMouseLeave={handleOptionHoverLeave}
              >
                Supervisee Conduct
              </LeftBoxListItem>
              <LeftBoxListItem
                onClick={() => handleOptionClick("Overall Score")}
                isSelected={selectedOption === "Overall Score"}
                isHovered={hoveredOption === "Overall Score"}
                onMouseEnter={() => handleOptionHover("Overall Score")}
                onMouseLeave={handleOptionHoverLeave}
              >
                Overall Score
              </LeftBoxListItem>
            </List>
          </Paper>
        </Grid>

        {/* Right Box */}
        <Grid item xs={12} md={9.5} sx={{ marginLeft: 1, marginRight: 1 }}>
          <Paper elevation={3} sx={{ borderRadius: 1 }}>
            {selectedOption !== "" && (
              <Box
                sx={{
                  backgroundColor: "#f5f5f5",
                  padding: "8px",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ marginLeft: "5px", marginTop: "3px" }}
                >
                  {selectedOption === "Proposal" && "Proposal (10%)"}
                  {selectedOption === "Report" && "Report (40%)"}
                  {selectedOption === "Supervisee Conduct" &&
                    "Supervisee Conduct (10%)"}
                  {selectedOption === "Overall Score" && "Overall Score (60%)"}
                </Typography>
              </Box>
            )}

            <Box sx={{ margin: "10px" }}>
              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        {columns().map((column, index) => (
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
                      {flattenedProjects
                        .slice(
                          page * rowsPerPage,
                          page * rowsPerPage + rowsPerPage
                        )
                        .map((row, index) => {
                          const number = index + 1;

                          return (
                            <StyledTableRow
                              hover
                              role="checkbox"
                              tabIndex={-1}
                              key={`${row.id}-${index}`}
                            >
                              <StyledTableCell>{number}</StyledTableCell>
                              <StyledTableCell>{row.title}</StyledTableCell>
                              <StyledTableCell>
                                {row.student_fullname}
                              </StyledTableCell>
                              <StyledTableCell>
                                {row.student_username}
                              </StyledTableCell>
                              {selectedOption === "Overall Score" && (
                                <>
                                  <StyledTableCell>
                                    {
                                      scores[
                                        `${row.id}_${row.student_username}_proposal`
                                      ]
                                    }
                                  </StyledTableCell>
                                  <StyledTableCell>
                                    {
                                      scores[
                                        `${row.id}_${row.student_username}_report`
                                      ]
                                    }
                                  </StyledTableCell>
                                  <StyledTableCell>
                                    {
                                      scores[
                                        `${row.id}_${row.student_username}_conduct`
                                      ]
                                    }
                                  </StyledTableCell>
                                </>
                              )}

                              <StyledTableCell>
                                {selectedOption === "Proposal" && (
                                  <a
                                    href={proposalUrls[row.student_username]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <Typography variant="body2">
                                      {proposalUrls[row.student_username]
                                        ? selectedOption
                                        : ""}
                                    </Typography>
                                  </a>
                                )}
                                {selectedOption === "Report" && (
  <ul>
    {reportUrls[row.student_username] && (
      <li>
        <a
          href={reportUrls[row.student_username]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Typography variant="body2">
            {selectedOption}
          </Typography>
        </a>
      </li>
    )}
    {driveUrls[row.student_username] && (
      <li>
        <a
          href={driveUrls[row.student_username]}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Typography variant="body2">
            Google Drive Link
          </Typography>
        </a>
      </li>
    )}
  </ul>
)}


                                {selectedOption === "Supervisee Conduct" &&
                                  scores[
                                    `${row.id}_${row.student_username}_conduct`
                                  ]}
                                {selectedOption === "Overall Score" &&
                                  scores[
                                    `${row.id}_${row.student_username}_overall`
                                  ]}
                              </StyledTableCell>

                              <StyledTableCell>
                                {selectedOption === "Proposal" &&
                                  scores[
                                    `${row.id}_${row.student_username}_proposal`
                                  ]}
                                {selectedOption === "Report" &&
                                  scores[
                                    `${row.id}_${row.student_username}_report`
                                  ]}
                              </StyledTableCell>
                              {selectedOption !== "Overall Score" && (
                                <StyledTableCell style={{ width: "15%" }}>
                                  {renderButton(row.student)}
                                </StyledTableCell>
                              )}
                            </StyledTableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>

            <Box mt={2} sx={{ padding: 1 }}></Box>
          </Paper>
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
