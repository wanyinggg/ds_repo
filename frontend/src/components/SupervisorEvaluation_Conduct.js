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
  Button,Alert, Backdrop 
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

export default function SupervisorEvaluation_Conduct() {
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
    interest: null,
    effort: null,
    attitude: null,
    attendance: null,
    instructions: null,
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
        handleAlertOpen(`Please score all the criterias.`,'error');
        return;
      }

      const evaluationData = {
        score_type: "conduct_score",
        score_value:
          (Object.values(scores).reduce((acc, score) => acc + (score || 0), 0) /
            25) *
          10,
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
          state: { alertMessage: "Supervisee Conduct is evaluated" ,severity:"success"},
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
                        Student interest and contribution of idea in the project
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="interest"
                        value={scores.interest}
                        onChange={handleScoreChange("interest")}
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
                        Effort and resourcefulness
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="effort"
                        value={scores.effort}
                        onChange={handleScoreChange("effort")}
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
                        Attitude
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="attitude"
                        value={scores.attitude}
                        onChange={handleScoreChange("attitude")}
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
                        Attendance
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="attendance"
                        value={scores.attendance}
                        onChange={handleScoreChange("attendance")}
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
                        Follow the checklist (instructions) given for the
                        project
                      </FormLabel>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <RadioGroup
                        row
                        name="instructions"
                        value={scores.instructions}
                        onChange={handleScoreChange("instructions")}
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
                      )} / 25`}</strong>
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
                            25) *
                          10
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
