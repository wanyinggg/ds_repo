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
  Button, Alert, Backdrop 
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
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

export default function SupervisorEvaluation_Report() {
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

  const [scores, setScores] = useState({
    introduction: null,
    literatureReview: null,
    models: null,
    results: null,
    discussion: null,
    conclusion: null,
    functionality: null,
    simulation: null,
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
          `Please score all the criterias.`,"error"
        );
        return;
      }
      
      const evaluationData = {
        score_type: "report_score",
        score_value:
          (Object.values(scores).reduce((acc, score) => acc + (score || 0), 0) /
            40) *
          40,
        student: student,
        project: project,
      };

      let response;

      if (mode === "create") {
        if (evaluationId) {
          response = await api.patch(
            `supervisor_evaluation/${evaluationId}/`,
            evaluationData
          );
        } else {
          response = await api.post("supervisor_evaluation/", evaluationData);
        }
      } else if (mode === "update") {
        response = await api.patch(
          `supervisor_evaluation/${evaluationId}/`,
          evaluationData
        );
      }

      if (response.status === 200 || response.status === 201) {
        console.log("Scores successfully saved:", response.data);
        navigate("/supervisorevaluation", {
          state: { alertMessage: "Report is evaluated",severity:"success" },
        });
      } else {
        console.error("Error occurred while saving scores:", response.data);
      }
    } catch (error) {
      console.error("API call failed:", error.response.data);
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
      <SupervisorNavigationBar />
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
                        name="introduction"
                        value={scores.introduction}
                        onChange={handleScoreChange("introduction")}
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
                        Literature Review/ Previous Research (minimum 10 references)
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="literatureReview"
                        value={scores.literatureReview}
                        onChange={handleScoreChange("literatureReview")}
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
                        Model or Methods
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="models"
                        value={scores.models}
                        onChange={handleScoreChange("models")}
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
                        Results
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="results"
                        value={scores.results}
                        onChange={handleScoreChange("results")}
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
                        Discussion
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="discussion"
                        value={scores.discussion}
                        onChange={handleScoreChange("discussion")}
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
                        Conclusion: Impact to society & future direction
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="conclusion"
                        value={scores.conclusion}
                        onChange={handleScoreChange("conclusion")}
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
                        Functionality of data product, ease of use and attractiveness
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="functionality"
                        value={scores.functionality}
                        onChange={handleScoreChange("functionality")}
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
                        Product simulation (User Manual) - Appendix
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="simulation"
                        value={scores.simulation}
                        onChange={handleScoreChange("simulation")}
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
                  <TableRow style={{ backgroundColor: "#ede7f6" }}>
                    <StyledTableCell
                      component="th"
                      scope="row"
                      style={{ fontSize: "1.0em" }}
                    >
                      <strong>Total Score</strong>
                    </StyledTableCell>
                    <StyledTableCell style={{ fontSize: "1.0em" }}>
                      <strong>{`${Object.values(scores).reduce(
                        (acc, score) => acc + (score || 0),
                        0
                      )} / 40`}</strong>
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
                      <strong>
                        {(
                          (Object.values(scores).reduce(
                            (acc, score) => acc + (score || 0),
                            0
                          ) /
                            40) *
                          40
                        ).toFixed(2)}
                      </strong>
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
              >
                Save
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
