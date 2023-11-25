import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Backdrop,
  Typography,
  CircularProgress,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { useLocation, useNavigate } from "react-router-dom";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import api from "./axios";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8950fc",
    },
    success: {
      main: "#4caf50",
    },
    error: {
      main: "#f44336",
    },
  },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: "white",
    fontWeight: "bold",
    textTransform: "capitalize",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:last-child td, &:last-child th": {
    border: 0,
  },
  "&:hover": {
    backgroundColor: theme.palette.action.hover,
    cursor: "pointer",
  },
}));

const ActionsCell = styled(TableCell)(({ theme }) => ({
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
}));

const ConfirmationDialog = ({ open, onClose, onConfirm, title, content, loading }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{content}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>No</Button>
        <Button onClick={onConfirm} color="primary" disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Yes"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function SupervisorApplication() {
  const location = useLocation();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);
  const [selectedProposalId, setSelectedProposalId] = useState(null);
  const [openRejectApplicationDialog, setOpenRejectApplicationDialog] =
    useState(false);
  const [openApproveApplicationDialog, setOpenApproveApplicationDialog] =
    useState(false);
  const [openRejectProposalDialog, setOpenRejectProposalDialog] =
    useState(false);
  const [openApproveProposalDialog, setOpenApproveProposalDialog] =
    useState(false);
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const [loading, setLoading] = useState(false); 

  useEffect(() => {
    if (alert && alert.message) {
      handleAlertOpen(alert.message, alert.severity);
      // Clear the alert state so it doesn't show again on refresh
      location.state = null;
    }
  }, [alert]);
  

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
    fetchApplications();
    fetchProposals();
  }, []);

  const fetchApplications = () => {
    api
      .get("applications/", {
        params: { user_projects: true, status: "Pending" },
      })
      .then((response) => {
        console.log(response.data);
        setApplications(response.data);
      })
      .catch((error) => {
        console.error("Error fetching applications:", error.repsonse.data);
      });
  };

  const handleAcceptApplication = (applicationId) => {
    // Set the selected application ID in the state
    setSelectedApplicationId(applicationId);
    // Open the approval confirmation dialog
    setOpenApproveApplicationDialog(true);
  };

  const handleRejectApplication = (applicationId) => {
    // Set the selected application ID in the state
    setSelectedApplicationId(applicationId);
    // Open the rejection confirmation dialog
    setOpenRejectApplicationDialog(true);
  };

  const handleConfirmApproveApplication = () => {
    if (selectedApplicationId) {
      setLoading(true); 
      api
        .patch(`applications/${selectedApplicationId}/`, { status: "approved" })
        .then((response) => {
          console.log(
            `Application with ID ${selectedApplicationId} has been approved.`,
            response.data
          );
          handleAlertOpen("Application has been approved.");
        })
        .catch((error) => {
          console.error(
            `Error approving application with ID ${selectedApplicationId}:`,
            error.response.data
          );
        })
        .finally(() => {
          setLoading(false); 
          setSelectedApplicationId(null);
          setOpenApproveApplicationDialog(false);
          fetchApplications();
        });
    }
  };

  const handleConfirmRejectApplication = () => {
    if (selectedApplicationId) {
      setLoading(true); 
      api
        .delete(`applications/${selectedApplicationId}/`)
        .then((response) => {
          console.log(
            `Application with ID ${selectedApplicationId} has been rejected.`
          );
          handleAlertOpen("Application has been rejected.");

          // Filter out the deleted application from the state
          setApplications(
            applications.filter((app) => app.id !== selectedApplicationId)
          );
        })
        .catch((error) => {
          console.error(
            `Error rejecting application with ID ${selectedApplicationId}:`,
            error
          );
        })
        .finally(() => {
          setLoading(false); 
          setSelectedApplicationId(null);
          setOpenRejectApplicationDialog(false);
        });
    }
  };

  const handleCloseApplicationDialog = () => {
    // Reset the selected application ID and close both confirmation dialogs
    setSelectedApplicationId(null);
    setOpenApproveApplicationDialog(false);
    setOpenRejectApplicationDialog(false);
  };

//#####################################################################################################

  const fetchProposals = () => {
    api
      .get("proposals/", {
        params: { user_projects: true, status: "Pending" },
      })
      .then((response) => {
        console.log(response.data);
        setProposals(response.data);
      })
      .catch((error) => {
        console.error("Error fetching proposals:", error.repsonse.data);
      });
  };

  const handleAcceptProposal = (proposalId) => {
    // Set the selected application ID in the state
    setSelectedProposalId(proposalId);
    // Open the approval confirmation dialog
    setOpenApproveProposalDialog(true);
  };

  const handleRejectProposal = (proposalId) => {
    // Set the selected application ID in the state
    setSelectedProposalId(proposalId);
    // Open the rejection confirmation dialog
    setOpenRejectProposalDialog(true);
  };

  const handleConfirmApproveProposal = () => {
    setLoading(true); 
    if (selectedProposalId) {
      // Find the proposal that matches the selectedProposalId
      const selectedProposal = proposals.find(
        (proposal) => proposal.id === selectedProposalId
      );
      if (!selectedProposal) {
        console.error(`Proposal with ID ${selectedProposalId} not found.`);
        return;
      }

      api
        .patch(`proposals/${selectedProposalId}/`, { status: "approved" })
        .then((response) => {
          console.log(
            `Proposal with ID ${selectedProposalId} has been approved.`
          );
          handleAlertOpen("Proposal has been approved.");

        })
        .catch((error) => {
          console.error(
            `Error approving proposal with ID ${selectedProposalId}:`,
            error.response.data
          );
        })
        .finally(() => {
          setLoading(false); 
          setSelectedProposalId(null);
          setOpenApproveProposalDialog(false);
          fetchProposals();
        });
    }
  };

  const handleConfirmRejectProposal = () => {
    setLoading(true); 
    if (selectedProposalId) {
      api
        .delete(`proposals/${selectedProposalId}/`)
        .then((response) => {
          console.log(
            `Proposal with ID ${selectedProposalId} has been rejected.`
          );
          handleAlertOpen("Proposal has been rejected.");

          // Filter out the deleted application from the state
          setProposals(
            proposals.filter((app) => app.id !== selectedProposalId)
          );
        })
        .catch((error) => {
          console.error(
            `Error rejecting proposal with ID ${selectedProposalId}:`,
            error
          );
        })
        .finally(() => {
          // Reset the selected application ID and close the confirmation dialog
          setSelectedProposalId(null);
          setOpenRejectProposalDialog(false);
        });
    }
  };

  const handleCloseProposalDialog = () => {
    setLoading(false); 
    setSelectedProposalId(null);
    setOpenApproveProposalDialog(false);
    setOpenRejectProposalDialog(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <SupervisorNavigationBar  />
      <Grid container spacing={5}>
        <Grid item xs={12}>
          <Box sx={{ padding: "10px", background: "#f7f7f7" }}>
            <Typography variant="h6" sx={{ marginLeft: "30px" }}>
              Your Projects
            </Typography>
          </Box>
          {applications.length === 0 ? (
            <Box sx={{ marginLeft: "40px", marginTop: "10px" }}>
              No project applications
            </Box>
          ) : (
            <Box sx={{ margin: "30px" }}>
              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>No.</StyledTableCell>
                        <StyledTableCell>Project Name</StyledTableCell>
                        <StyledTableCell>Student Name</StyledTableCell>
                        <StyledTableCell>Matric Number</StyledTableCell>
                        <StyledTableCell align="center">
                          Actions
                        </StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {applications.map((application, index) => (
                        <StyledTableRow key={application.id}>
                          <StyledTableCell>{index + 1}</StyledTableCell>
                          <StyledTableCell>
                            {application.project.title}
                          </StyledTableCell>
                          <StyledTableCell>
                            {application.student.full_name}
                          </StyledTableCell>
                          <StyledTableCell>
                            {application.student.username}
                          </StyledTableCell>
                          <ActionsCell align="center">
                            <Button
                              variant="contained"
                              color="success"
                              sx={{
                                color: "white",
                                marginRight: "10px",
                                textTransform: "none",
                              }}
                              onClick={() =>
                                handleAcceptApplication(application.id)
                              }
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              sx={{ color: "white", textTransform: "none" }}
                              onClick={() =>
                                handleRejectApplication(application.id)
                              }
                            >
                              Reject
                            </Button>
                          </ActionsCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ padding: "10px", background: "#f7f7f7" }}>
            <Typography variant="h6" sx={{ marginLeft: "30px" }}>
              Student's Proposal
            </Typography>
          </Box>

          {proposals.length === 0 ? (
            <Box sx={{ marginLeft: "40px", marginTop: "10px" }}>
              {" "}
              No proposal submitted by students
            </Box>
          ) : (
            <Box sx={{ margin: "30px" }}>
              <Paper sx={{ width: "100%", overflow: "hidden" }}>
                <TableContainer>
                  <Table stickyHeader aria-label="sticky table">
                    <TableHead>
                      <TableRow>
                        <StyledTableCell>No.</StyledTableCell>
                        <StyledTableCell>Project Name</StyledTableCell>
                        <StyledTableCell>Student Name</StyledTableCell>
                        <StyledTableCell>Matric ID</StyledTableCell>
                        <StyledTableCell></StyledTableCell>
                        <StyledTableCell align="center">
                          Actions
                        </StyledTableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {proposals.map((proposal, index) => (
                        <StyledTableRow key={proposal.id}>
                          <StyledTableCell>{index + 1}</StyledTableCell>
                          <StyledTableCell>{proposal.title}</StyledTableCell>
                          <StyledTableCell>
                            {proposal.student.full_name}
                          </StyledTableCell>
                          <StyledTableCell>
                            {proposal.student.username}
                          </StyledTableCell>
                          <StyledTableCell>
                            <Button
                              onClick={() => {
                                navigate(
                                  `/supervisorproposaldetail/${proposal.id}`
                                );
                              }}
                              variant="text"
                              style={{ textTransform: "none" }}
                            >
                              Details
                            </Button>
                          </StyledTableCell>
                          <ActionsCell align="center">
                            <Button
                              variant="contained"
                              color="success"
                              sx={{
                                color: "white",
                                marginRight: "10px",
                                textTransform: "none",
                              }}
                              onClick={() => handleAcceptProposal(proposal.id)}
                            >
                              Accept
                            </Button>
                            <Button
                              variant="contained"
                              color="error"
                              sx={{ color: "white", textTransform: "none" }}
                              onClick={() => handleRejectProposal(proposal.id)}
                            >
                              Reject
                            </Button>
                          </ActionsCell>
                        </StyledTableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          )}
        </Grid>
      </Grid>
      <ConfirmationDialog
        open={openApproveApplicationDialog}
        onClose={handleCloseApplicationDialog}
        onConfirm={handleConfirmApproveApplication}
        title="Confirm Approval"
        content="Are you sure you want to approve this application?"
        loading={loading}
      />
      <ConfirmationDialog
        open={openRejectApplicationDialog}
        onClose={handleCloseApplicationDialog}
        onConfirm={handleConfirmRejectApplication}
        title="Confirm Rejection"
        content="Are you sure you want to reject this application?"
        loading={loading}
      />
      <ConfirmationDialog
        open={openApproveProposalDialog}
        onClose={handleCloseProposalDialog}
        onConfirm={handleConfirmApproveProposal}
        title="Confirm Approval"
        content="Are you sure you want to approve this proposal?"
        loading={loading}
      />
      <ConfirmationDialog
        open={openRejectProposalDialog}
        onClose={handleCloseProposalDialog}
        onConfirm={handleConfirmRejectProposal}
        title="Confirm Rejection"
        content="Are you sure you want to reject this proposal?"
        loading={loading}
      />
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
