import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  Grid,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,Alert, Backdrop 
} from "@mui/material";
import { ThemeProvider, styled } from "@mui/material/styles";
import Theme from "./reusable/Theme";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import api from "./axios";

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

export default function StudentSubmission() {
  const [selectedOption, setSelectedOption] = useState(
    sessionStorage.getItem("selectedOption") || "Proposal"
  );
  const [hoveredOption, setHoveredOption] = useState("");
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [project, setProject] = useState(null);
  const [proposalFile, setProposalFile] = useState(null);
  const [driveLink, setDriveLink] = useState("");
  const [reportFile, setReportFile] = useState(null);
  const [isProposalSubmitted, setIsProposalSubmitted] = useState(false);
  const [isDriveLinkSubmitted, setIsDriveLinkSubmitted] =
    useState(false);
  const [isReportSubmitted, setIsReportSubmitted] = useState(false);
  const [proposalId, setProposalId] = useState("");
  const [driveId, setDriveId] = useState("");
  const [reportId, setReportId] = useState("");
  const [isFileValid, setIsFileValid] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [previousFileURL, setPreviousFileURL] = useState(null);
  const [alert, setAlert] = useState(null);
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

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    sessionStorage.setItem("selectedOption", option);
  };

  const handleOptionHover = (option) => {
    setHoveredOption(option);
  };

  const handleOptionHoverLeave = () => {
    setHoveredOption("");
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile && selectedFile.type !== "application/pdf") {
      handleAlertOpen("Please select a valid PDF file.","error");
      setIsFileValid(false); // set the file as invalid
      return;
    } else {
      setIsFileValid(true); // set the file as valid
    }

    switch (selectedOption) {
      case "Proposal":
        setProposalFile(selectedFile);
        break;
      case "Report":
        setReportFile(selectedFile);
        break;
      default:
        // For other sections, do nothing with the file
        break;
    }
  };

  const handleLinkChange = (event) => {
    const linkValue = event.target.value;

    switch (selectedOption) {
      case "Google Drive":
        setDriveLink(linkValue);
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    let storedUser =
      sessionStorage.getItem("user") || localStorage.getItem("user");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const fetchDocument = async () => {
    setIsLoading(true);

    try {
      let url = "";
      switch (selectedOption) {
        case "Proposal":
          url = "/proposal_submissions/";
          break;
        case "Report":
          url = "/report_submissions/";
          break;
        case "Google Drive":
          url = "/drive_submissions/";
          break;
        default:
          setIsLoading(false);
          return; // Return early if no specific option is selected
      }

      const response = await api.get(url, { params: { user_projects: true } });
      console.log(response.data);
      const { project } = response.data[0]; // Common properties

      if (selectedOption === "Proposal") {
        const { id, uploaded_file } = response.data[0]; // File-specific property
        setProposalId(id);
        setProposalFile(uploaded_file);
        setIsProposalSubmitted(uploaded_file !== null && uploaded_file !== "");
      } else if (selectedOption === "Report") {
        const { id, uploaded_file } = response.data[0]; // File-specific property
        setReportId(id);
        setReportFile(uploaded_file);
        setIsReportSubmitted(uploaded_file !== null && uploaded_file !== "");
      }  else if (selectedOption === "Google Drive") {
        const { id, uploaded_link } = response.data[0]; // Link-specific property
        setDriveId(id);
        setDriveLink(uploaded_link);
        setIsDriveLinkSubmitted(uploaded_link !== null && uploaded_link !== "");
      }

      setProject(project);
    } catch (error) {
      console.log("Error fetching document", error.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      switch (selectedOption) {
        case "Proposal":
          setTitle(`${user.username}_proposal`);
          break;
        case "Report":
          setTitle(`${user.username}_report`);
          break;
        case "Google Drive":
          setTitle(`${user.username}_drive`);
          break;
        default:
          setTitle("");
          break;
      }
    }
  }, [user, selectedOption]);

  const renderRightBoxContent = () => {
    switch (selectedOption) {
      case "Proposal":
      case "Report":
        return (
          <Box mb={2}>
            <Typography variant="body1">Upload PDF:</Typography>
            <TextField
              type="file"
              variant="outlined"
              fullWidth
              onChange={handleFileChange}
              inputProps={{ accept: "application/pdf" }}
            />
          </Box>
        );
      case "Google Drive":
        return (
          <Box>
            <Typography variant="body1">
              Google drive link:
            </Typography>
            <TextField
              type="text"
              variant="outlined"
              placeholder="Insert link here"
              fullWidth
              value={driveLink}
              onChange={handleLinkChange}
            />
          </Box>
        );
      default:
        return null;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    let formData = new FormData();
    let url = "";

    switch (selectedOption) {
      case "Proposal":
        url = "/proposal_submissions/";
        formData.append("title", `${title}.pdf`);
        // Set a new name for the file.
        formData.append("uploaded_file", proposalFile, `${title}.pdf`);
        break;
      case "Report":
        url = "/report_submissions/";
        formData.append("title", `${title}.pdf`);
        // Set a new name for the file.
        formData.append("uploaded_file", reportFile, `${title}.pdf`);
        break;
      case "Google Drive":
        url = "/drive_submissions/";
        formData.append("title", `${title}`);
        formData.append("uploaded_link", driveLink);
        break;
    }

    try {
      const response = await api.post(url, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      handleAlertOpen("Submitted successfully");
      console.log("Submitted successfully");
      fetchDocument();
    } catch (error) {
      console.log("Submission failed");
      console.log("Error during submission", error.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchDocument(); // Fetch the document each time the selected option changes
    }
  }, [user, selectedOption]);

  const handleSaveChanges = async () => {
    setIsLoading(true);

    let formData = new FormData();
    let url = "";

    switch (selectedOption) {
      case "Proposal":
        url = `/proposal_submissions/${proposalId}/`;
        formData.append("title", `${title}.pdf`);
        // Set a new name for the file.
        formData.append("uploaded_file", proposalFile, `${title}.pdf`);
        break;
      case "Report":
        url = `/report_submissions/${reportId}/`;
        formData.append("title", `${title}.pdf`);
        // Set a new name for the file.
        formData.append("uploaded_file", reportFile, `${title}.pdf`);
        break;
      case "Google Drive":
        url = `/drive_submissions/${driveId}/`;
        formData.append("title", `${title}`);
        formData.append("uploaded_link", driveLink);
        break;
      default:
        setIsLoading(false);
        return; // Return early if no specific option is selected
    }

    try {
      const response = await api.patch(`${url}`, formData, {
        headers: {
          Accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      });

      handleAlertOpen("Changes saved successfully");
      console.log("Changes saved successfully");
      // Fetch the updated document again to reflect the changes
      fetchDocument();
    } catch (error) {
      console.log("Saving changes failed");
      console.log("Error during saving changes", error.response.data);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const promptDeletion = () => {
    setOpenDialog(true);
  };

  const deleteUploadedFile = async () => {
    setIsLoading(true);

    try {
      // Get the correct URL based on the selected option
      let url = "";
      switch (selectedOption) {
        case "Proposal":
          url = `/proposal_submissions/${proposalId}/`;
          setIsProposalSubmitted(false);
          setProposalFile(null);
          setProposalId("");
          break;
        case "Report":
          url = `/report_submissions/${reportId}/`;
          setIsReportSubmitted(false);
          setReportFile(null);
          setReportId("");
          break;
        case "Google Drive":
          url = `/drive_submissions/${driveId}/`;
          setIsDriveLinkSubmitted(false);
          setDriveLink("");
          setDriveId("");
          break;
        default:
          setIsLoading(false);
          return; // Return early if no specific option is selected
      }

      // Send the DELETE request
      await api.delete(url);
      handleAlertOpen("Deleted successfully");
    } catch (error) {
      console.log("Error deleting the file", error.response.data);
    } finally {
      setIsLoading(false);
    }
  };

  const getUploadedSubmissionDetails = () => {
    switch (selectedOption) {
      case "Proposal":
        return proposalFile;
      case "Report":
        return reportFile;
      case "Google Drive":
        return driveLink;
      default:
        return null;
    }
  };

  const startEditing = () => {
    setPreviousFileURL(getUploadedSubmissionDetails());
    setIsEditing(true);
  };

  return (
    <ThemeProvider theme={Theme}>
      <StudentNavigationBar />

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
                onClick={() => handleOptionClick("Google Drive")}
                isSelected={selectedOption === "Google Drive"}
                isHovered={hoveredOption === "Google Drive"}
                onMouseEnter={() => handleOptionHover("Google Drive")}
                onMouseLeave={handleOptionHoverLeave}
              >
                Google Drive
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
                  {selectedOption}
                </Typography>
              </Box>
            )}
            <Box mt={2} sx={{ padding: 1 }}>
              {isLoading ? (
                <div>Loading...</div>
              ) : (
                <>
                  {selectedOption === "Proposal" &&
                  isProposalSubmitted &&
                  !isEditing ? (
                    <>
                      <a
                        href={proposalFile}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Typography variant="body1">
                          {selectedOption} Submission
                        </Typography>
                      </a>
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px" }}
                          onClick={startEditing}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px", marginLeft: "15px" }}
                          onClick={promptDeletion}
                        >
                          Remove Document
                        </Button>
                      </Box>
                    </>
                  ) : selectedOption === "Report" &&
                    isReportSubmitted &&
                    !isEditing ? (
                    <>
                      <a
                        href={reportFile}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Typography variant="body1">
                          {selectedOption} Submission
                        </Typography>
                      </a>
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px" }}
                          onClick={startEditing}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px", marginLeft: "15px" }}
                          onClick={promptDeletion}
                        >
                          Remove Document
                        </Button>
                      </Box>
                    </>
                  ) : selectedOption === "Google Drive" &&
                    isDriveLinkSubmitted &&
                    !isEditing ? (
                    <>
                      <a
                        href={driveLink}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Typography variant="body1">
                          {selectedOption} Submission
                        </Typography>
                      </a>
                      <Box>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px" }}
                          onClick={startEditing}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px", marginLeft: "15px" }}
                          onClick={promptDeletion}
                        >
                          Remove Link
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      {renderRightBoxContent()}
                      {isEditing ? (
                        selectedOption === "Proposal" ||
                        selectedOption === "Report"  ? (
                          <Box>
                            Previous Uploaded File:
                            <a
                              href={previousFileURL}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Typography variant="body1">
                                {previousFileURL?.split("/").pop()}
                              </Typography>
                            </a>
                            <Button
                              variant="contained"
                              color="primary"
                              sx={{ marginTop: "10px" }}
                              onClick={handleSaveChanges}
                              disabled={!isFileValid}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              sx={{ marginTop: "10px", marginLeft: "5px" }}
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </Box>
                        ) : (
                          // This is for the link editing sections:
                          <Box>
                            <Button
                              variant="contained"
                              color="primary"
                              sx={{ marginTop: "10px" }}
                              onClick={handleSaveChanges}
                              disabled={!isFileValid}
                            >
                              Save Changes
                            </Button>
                            <Button
                              variant="contained"
                              color="primary"
                              sx={{ marginTop: "10px", marginLeft: "5px" }}
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </Button>
                          </Box>
                        )
                      ) : (
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{ marginTop: "10px" }}
                          onClick={handleSubmit}
                          disabled={!isFileValid}
                        >
                          Submit
                        </Button>
                      )}
                    </>
                  )}
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{"Confirm Deletion"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete this submission?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="primary">
            Cancel
          </Button>
          <Button
            onClick={() => {
              setOpenDialog(false);
              deleteUploadedFile();
            }}
            color="primary"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
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
