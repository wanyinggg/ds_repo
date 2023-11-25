import React, { useEffect, useState } from "react";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import StudentProjectDetail from "./StudentProjectDetail";
import StudentProposalDetail from "./StudentProposalDetail";
import Theme from "./reusable/Theme";
import { ThemeProvider } from "@mui/material/styles";
import {
  Button,
  Typography,
  Grid,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Backdrop,
  CircularProgress,
} from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import api from "./axios";

export default function StudentProject() {
  const location = useLocation();
  const navigate = useNavigate();
  const [projectStatus, setProjectStatus] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectId, setProjectId] = useState("");
  const [project, setProject] = useState(null);
  const [proposalStatus, setProposalStatus] = useState("");
  const [proposal, setProposal] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [alert, setAlert] = useState(location.state || null);
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

  useEffect(() => {
    if (location.state?.alertMessage && location.state?.severity) {
      handleAlertOpen(location.state.alertMessage, location.state.severity);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    setIsDeleting(true);
    api
      .delete(`proposals/${proposal.id}/`)
      .then((response) => {
        console.log("Proposal deleted successfully");
        // Reset the state variables related to the project and proposal
        setProjectStatus("");
        setProjectName("");
        setProjectId("");
        setProject(null);
        setProposalStatus("");
        setProposal(null);
        handleAlertOpen("Proposal deleted successfully");

        navigate(".", {
          state: { alertMessage: "Proposal deleted successfully" },
        });
      })
      .catch((error) => {
        console.error("Error deleting proposal:", error);
      })
      .finally(() => {
        setIsDeleting(false);
        setOpenDeleteDialog(false);
      });
  };

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  useEffect(() => {
    // Fetch applications and proposals
    Promise.all([
      api.get("applications/", { params: { user_projects: true } }),
      api.get("proposals/", { params: { user_proposals: true } }),
    ])
      .then((responses) => {
        const [applicationsResponse, proposalsResponse] = responses;

        if (applicationsResponse.data.length > 0) {
          const application = applicationsResponse.data[0];
          setProjectStatus(application.status);

          const projectId = application.project.id;
          setProjectId(projectId);

          api
            .get(`projects/${projectId}/`)
            .then((projectResponse) => {
              const projectName = projectResponse.data.title;
              setProjectName(projectName);
              setProject(projectResponse.data);
            })
            .catch((error) => {
              console.error(
                "Error fetching project details:",
                error.response.data
              );
            });
        } else {
          setProjectStatus("Not Applicable");
          console.log("No applications found.");
        }

        if (proposalsResponse.data.length > 0) {
          const proposal = proposalsResponse.data[0];
          setProposalStatus(proposal.status);
          setProposal(proposal);
        } else {
          setProposalStatus("Not Applicable");
          console.log("No proposals found.");
        }

        // Both data fetching processes are completed, set loading to false.
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching applications or proposals:", error);

        // In case of an error, also set loading to false to prevent indefinite loading.
        setLoading(false);
      });
  }, []);

  let projectContent = null;

  if (loading) {
    <StudentNavigationBar />;
  } else if (projectStatus === "Approved" || proposalStatus === "Approved") {
    console.log(proposal);
    let project_id;
    if (projectStatus === "Approved") {
      project_id = projectId;
    } else if (proposalStatus === "Approved") {
      project_id = proposal.project_id;
    }

    projectContent = <StudentProjectDetail projectId={project_id} />;
  } else if (projectStatus === "Pending" || proposalStatus === "Pending") {
    // if apply for project
    if (projectStatus === "Pending") {
      projectContent = (
        <Grid container justifyContent="center" style={{ padding: "30px" }}>
          <Grid item xs={12} md={12}>
            <Paper style={{ padding: 16, backgroundColor: '#e3f2fd' }}>
              <Typography variant="h5">
                Your project application is pending
              </Typography>
              <br></br>
              <Typography variant="h7">
                You have applied for: {projectName}
              </Typography>
            </Paper>
          </Grid>
          <StudentProjectDetail projectId={projectId} />
        </Grid>
      );
      // if submit proposal
    } else if (proposalStatus === "Pending") {
      projectContent = (
        <Grid container style={{ padding: "30px" }}>
          <Grid item xs={12} md={12}>
          <Paper style={{ padding: 16, backgroundColor: '#e3f2fd' }}> 
              <Typography variant="h5">
                Your proposal application is pending
              </Typography>
              <br></br>
              <Typography variant="h7">
                Your proposal: {proposal.title}
              </Typography>
            </Paper>
          </Grid>

          <StudentProposalDetail proposalId={proposal.id} />

          <Grid item>
            <Button
              variant="contained"
              sx={{
                color: "white",
                bgcolor: "primary",
                borderRadius: "15px",
                padding: "10px 25px",
                "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                fontWeight: "bold",
                textTransform: "none",
                marginLeft: "10px",
              }}
              onClick={() => {
                navigate(`/studentproposaledit/${proposal.id}`);
              }}
            >
              Edit
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
                "&:hover": { bgcolor: "#f44336", color: "#fff" },
                fontWeight: "bold",
                textTransform: "none",
                marginLeft: "10px",
              }}
              onClick={handleDeleteClick}
            >
              Delete
            </Button>
          </Grid>
        </Grid>
      );
    }
  } else if (
    projectStatus === "" ||
    proposalStatus === "" ||
    (projectStatus === "Not Applicable" &&
      proposalStatus === "Not Applicable") ||
    (projectStatus === "Not Applicable" && proposalStatus === "") ||
    (projectStatus === "" && proposalStatus === "Not Applicable")
  ) {
    projectContent = (
      <Grid container justifyContent="center" style={{ padding: "30px" }}>
        <Grid item xs={12} md={12}>
          <Paper style={{ padding: 16 }}>
            <Typography variant="h5">Apply for project</Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/student")}
              style={{ textTransform: "none", marginTop: "20px" }}
            >
              Apply Now
            </Button>
          </Paper>
        </Grid>

        <Grid item xs={12} md={12}>
          <Paper style={{ padding: 16, marginTop: "20px" }}>
            <Typography variant="h5">Propose a title</Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/studentproposal")}
              style={{ textTransform: "none", marginTop: "20px" }}
            >
              Submit Proposal
            </Button>
          </Paper>
        </Grid>
      </Grid>
    );
  } else {
    // console.log("projectStatus:", projectStatus);
    // console.log("proposalStatus:", proposalStatus);
  }

  return (
    <ThemeProvider theme={Theme}>
      <div>
        <StudentNavigationBar />
        {projectContent}
      </div>
      <Dialog
        open={openDeleteDialog}
        onClose={handleCancelDelete}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">Confirm Deletion</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete the project?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelDelete} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            disabled={isDeleting} // Disable the button when deleting
          >
            {isDeleting ? <CircularProgress size={24} /> : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
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
