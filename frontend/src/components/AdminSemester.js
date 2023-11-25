import React, { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  Backdrop,
  Alert,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import Theme from "./reusable/Theme";
import AdminNavigationBar from "./reusable/AdminNavigationBar";
import BookIcon from "@mui/icons-material/Book";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import api from "./axios";

export default function AdminSemester() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [semester, setSemester] = useState("");
  const [academicYear, setAcademicYear] = useState("");
  const [error, setError] = useState(null);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertSeverity, setAlertSeverity] = useState("success");

  const [semesterInfo, setSemesterInfo] = useState({});

  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);

    // Check if semesterInfo is empty before fetching data
    if (!semesterInfo.semester || !semesterInfo.academicYear) {
      api
        .get("semester/")
        .then((response) => {
          const allSemesters = response.data;

          // Find the semester where is_latest is true
          const latestSemester = allSemesters.find((sem) => sem.is_latest);

          setSemesterInfo(latestSemester);
        })
        .catch((err) => {
          console.error("Error fetching semester data:", err);
          setError("Failed to fetch semester data. Please try again.");
        });
    }
  }, []);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleUpdateSemester = () => {
    const newSemesterData = {
      semester: semester,
      academic_year: academicYear,
    };
  
    api
      .post("semester/", newSemesterData)
      .then((response) => {
        setSemesterInfo(response.data);
        handleClose();
        handleAlertOpen("Semester updated successfully!", "success");
        handleArchiveProjects();
      })
      .then((response) => {
        console.log("Projects archived:", response.data);
      })
      .catch((error) => {
        console.error("Error:", error.response?.data || error.message);
      });
  };
  

  const handleAlertOpen = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    // Close alert after some time
    setTimeout(() => {
      setAlertOpen(false);
    }, 1500); // Adjust the timing as needed
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const handleArchiveProjects = () => {
    api
      .post("projects/archive/") 
      .then((response) => {
        console.log("Projects archived:", response.data);
      })
      .catch((error) => {
        console.error("Error archiving projects:", error.response.data);
      });
};

  return (
    <Grid container direction="column" spacing={3}>
      <Grid item xs={12}>
        <AdminNavigationBar />
      </Grid>
      <Grid item>
        <Card
          variant="outlined"
          style={{
            backgroundColor: "#f5f5f5",
            padding: "20px",
            margin: "10px",
          }}
        >
          <CardContent>
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              sx={{ marginBottom: 2 }}
            >
              Current Semester
            </Typography>

            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <BookIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Semester: {semesterInfo.semester}
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <CalendarTodayIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Academic Year: {semesterInfo.academic_year}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        <Grid item>
          <Button
            variant="contained"
            style={{
              backgroundColor: "#8950fc",
              color: "white",
              marginLeft: "10px",
            }}
            onClick={handleClickOpen}
          >
            Update Semester
          </Button>
        </Grid>
      </Grid>
      <ThemeProvider theme={Theme}>
        <Dialog
          open={open}
          onClose={handleClose}
          aria-labelledby="form-dialog-title"
        >
          <DialogTitle id="form-dialog-title">Update Semester</DialogTitle>
          <DialogContent>
            <TextField
              select
              autoFocus
              margin="dense"
              id="semester"
              label="Semester"
              fullWidth
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
            >
              <MenuItem value={1}>1</MenuItem>
              <MenuItem value={2}>2</MenuItem>
            </TextField>
            <TextField
              margin="dense"
              id="academicYear"
              label="Academic Year"
              type="text"
              fullWidth
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleUpdateSemester} color="primary">
              Update
            </Button>
          </DialogActions>
        </Dialog>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={alertOpen}
          onClick={handleAlertClose} 
        >
          <Alert
            severity={alertSeverity}
            onClose={handleAlertClose}
            sx={{
              boxShadow: 24, 
              p: 2, 
              minWidth: '20%', 
              display: 'flex', 
              alignItems: 'center',
            }}
          >
            {alertMessage}
          </Alert>
        </Backdrop>
      </ThemeProvider>
    </Grid>
  );
}
