import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Backdrop
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/system";
import { tableCellClasses } from "@mui/material/TableCell";
import Theme from "./reusable/Theme";
import api from "./axios";
import AdminNavigationBar from "./reusable/AdminNavigationBar";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&:first-child": {
    backgroundColor: "#EBEDF3",
    color: "black",
    width: "150px",
    verticalAlign: "top",
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.head}`]: {
    width: "150px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export default function AdminProjectDetail() {
  const location = useLocation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [alert, setAlert] = useState(location.state || null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const navigate = useNavigate();
  const navigateSemester = location.state?.navigateSemester ;

  const handleBack = () => {
    navigate("/adminproject", { state: { navigateSemester } });
  };

  useEffect(() => {
    api
      .get(`projects/${id}/`)
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });
  }, [id]);

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

  if (!project) {
    return <Typography>Loading...</Typography>;
  }

  const rows = [
    { name: "Project Title", value: project.title },
    { name: "Supervisor", value: project.created_by.full_name },
    { name: "Description", value: project.description },
    { name: "Collaborator", value: project.collaborator },
    { name: "Tool", value: project.tool },
    { name: "Student", value: project.assigned_to ? project.assigned_to.map(user => user.full_name).join(', ') : '' },
    { name: "Student Matric Number", value: project.assigned_to ? project.assigned_to.map(user => user.username).join(', ') : '' },];

  const handleDeleteClick = () => {
    setOpenDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    api
      .delete(`projects/${id}/`)
      .then((response) => {
        console.log("Project deleted successfully");
        navigate("/adminproject", {
          state: { message: "Project deleted successfully", severity: "success" }
        });
      })
      .catch((error) => {
        console.error("Error deleting project:", error);
        handleAlertOpen("Error deleting project", "error");
      })
      .finally(() => {
        setOpenDeleteDialog(false);
      });
  };
  

  const handleCancelDelete = () => {
    setOpenDeleteDialog(false);
  };

  return (
    <ThemeProvider theme={Theme}>
      <AdminNavigationBar />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ margin: "30px" }}>
            <Paper>
              <TableContainer>
                <Table>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.name}>
                        <StyledTableCell component="th" scope="row">
                          {row.name}
                        </StyledTableCell>
                        <TableCell>{row.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
          <Grid
            container
            justifyContent="space-between"
            spacing={2}
            sx={{ marginBottom: "20px" }}
          >
            <Grid item>
              <Button
                onClick={handleBack}
                variant="contained"
                sx={{
                  color: "white",
                  bgcolor: "primary",
                  borderRadius: "15px",
                  padding: "10px 25px",
                  "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                  fontWeight: "bold",
                  textTransform: "none",
                  marginLeft: "30px",
                }}
              >
                Back
              </Button>
            </Grid>
            <Grid item>
              <Grid container spacing={2}>
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
                    }}
                    onClick={() => {
                      navigate(`/adminprojectedit/${id}`, {
                        state: { returnPath: `/adminprojectdetail/${id}` },
                      });
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
                      marginRight: "30px",
                    }}
                    onClick={handleDeleteClick} // Add onClick handler
                  >
                    Delete
                  </Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
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
          <Button onClick={handleCancelDelete}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
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
