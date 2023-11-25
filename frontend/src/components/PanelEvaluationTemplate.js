import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Button,
  CircularProgress, Alert, Backdrop 
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import PanelNavigationBar from "./reusable/PanelNavigationBar";
import Theme from "./reusable/Theme";
import { ThemeProvider, styled } from "@mui/material/styles";
import api from "./axios";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: "white",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export default function PanelEvaluationTemplate() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const project = location.state?.project || {};
  const student = location.state?.student || {};
  const mode = location.state?.mode || "create";
  const evaluationId = location.state?.evaluationId;
  const [alert, setAlert] = useState(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const [scores, setScores] = useState({
    intro: null,
    objective: null,
    methodology: null,
    analysis: null,
    tools: null,
    demo: null,
    datastory: null,
    qna: null,
  });

  const handleScoreChange = (section) => (event) => {
    const updatedScores = {
      ...scores,
      [section]: parseInt(event.target.value, 10),
    };
    // console.log("Updated Scores:", updatedScores);
    setScores(updatedScores);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate that all criteria have been scored
      const unscoredCriteria = Object.entries(scores).filter(
        ([, score]) => score === null
      );
  
      if (unscoredCriteria.length > 0) {
        // Display a message listing the unscored criteria
        const unscoredCriteriaNames = unscoredCriteria
          .map(([name]) => name)
          .join(", ");
        handleAlertOpen(
          `Please score all the criterias.`,'error'
        );
        setLoading(false); 
        return;
      }
  
      const totalScore = Object.values(scores).reduce(
        (acc, score) => acc + score,
        0
      );
  
      const evaluationData = {
        pitching_score: totalScore,
        student: [student],  
        project: [project],  
        panel: user.id,
      };
  
      let response;
  
      if (mode === "create") {
        response = await api.post("panel_evaluation/", evaluationData);
      } else if (mode === "update") {
        response = await api.patch(
          `panel_evaluation/${evaluationId}/`,
          evaluationData
        );
      }
  
      if (response.status === 200 || response.status === 201) {
        console.log("Scores successfully saved:", response.data);
        navigate("/panelevaluation", {
          state: { alertMessage: "Project Presentation is evaluated",severity:"success" },
        });
      } else {
        console.error("Error occurred while saving scores:", response.data);
      }
      setLoading(false);

    } catch (error) {
      console.error("API call failed:", error.response?.data);
      setLoading(false);

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

  return (
    <ThemeProvider theme={Theme}>
      <PanelNavigationBar />
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Box m={3}>
            <TableContainer component={Paper}>
              <Table aria-label="evaluation table">
                <TableHead>
                  <TableRow>
                    <StyledTableCell>
                      <Typography>
                        <strong>Criteria</strong>
                      </Typography>
                    </StyledTableCell>
                    <StyledTableCell>
                      <Typography>
                        <strong>Score</strong>
                      </Typography>
                    </StyledTableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Introduction & Problem Statement
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="intro"
                        value={scores.intro}
                        onChange={handleScoreChange("intro")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Objectives
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="objective"
                        value={scores.objective}
                        onChange={handleScoreChange("objective")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Data Science Methodology
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="methodology"
                        value={scores.methodology}
                        onChange={handleScoreChange("methodology")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Analysis & Modelling Work
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="analysis"
                        value={scores.analysis}
                        onChange={handleScoreChange("analysis")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Tools and coding
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="tools"
                        value={scores.tools}
                        onChange={handleScoreChange("tools")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Demonstration of the apps - Functionality of apps,
                        usefulness etc.
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="demo"
                        value={scores.demo}
                        onChange={handleScoreChange("demo")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Interesting data story with visualization
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="datastory"
                        value={scores.datastory}
                        onChange={handleScoreChange("datastory")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow>
                    <StyledTableCell component="th" scope="row">
                      <FormLabel component="legend" style={{ color: "black" }}>
                        Ability to answer and defend during Q & A session.
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="qna"
                        value={scores.qna}
                        onChange={handleScoreChange("qna")}
                      >
                        {[1, 2, 3, 4, 5].map((value) => (
                          <FormControlLabel
                            key={value}
                            value={value}
                            control={<Radio />}
                            label={value}
                          />
                        ))}
                      </RadioGroup>
                    </StyledTableCell>
                  </TableRow>

                  <TableRow style={{ backgroundColor: "#dad0ed" }}>
                    <StyledTableCell
                      component="th"
                      scope="row"
                      style={{ fontSize: "1.0em" }}
                    >
                      <strong>Final Score</strong>
                    </StyledTableCell>
                    <StyledTableCell style={{ fontSize: "1.0em" }}>
                    <strong>{Object.values(scores).reduce(
                        (acc, score) => acc + (score || 0),
                        0
                      )}</strong>
                    </StyledTableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
          <Grid container justifyContent="space-between" alignItems="center">
            <Grid item>
              <Button
                onClick={handleBack}
                variant="contained"
                sx={{
                  color: "white",
                  bgcolor: "primary",
                  borderRadius: "15px",
                  padding: "10px 25px",
                  marginLeft: "30px",
                  marginBottom: "10px",
                  "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                  fontWeight: "bold",
                  textTransform: "none",
                }}
              >
                Back
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                sx={{
                  color: "white",
                  bgcolor: "primary",
                  borderRadius: "15px",
                  padding: "10px 25px",
                  marginBottom: "10px",
                  "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                  fontWeight: "bold",
                  textTransform: "none",
                  marginRight: "30px",
                }}
                onClick={handleSubmit}
                disabled={loading} 
              >
               {loading ? <CircularProgress size={24} color="inherit" /> : "Save"}
              </Button>
            </Grid>
          </Grid>
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
