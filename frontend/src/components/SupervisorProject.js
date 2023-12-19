import React, { useState, useEffect } from "react";
import Theme from "./reusable/Theme";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import SupervisorProjectList from "./SupervisorProjectList";
import { ThemeProvider } from "@mui/material/styles";
import { Button, Alert, Backdrop, Grid } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import AddIcon from "@material-ui/icons/Add";

export default function SupervisorProject() {
  const location = useLocation();
  const navigate = useNavigate();

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
    if (location.state?.message && location.state?.severity) {
      handleAlertOpen(location.state.message, location.state.severity);
      // Clear the state after showing the message
      navigate(location.pathname, { replace: true, state: {} }); 
    }
  }, [location, navigate]);
  


  const storedUser = (sessionStorage.getItem("user") || localStorage.getItem("user"));
  const user = storedUser ? JSON.parse(storedUser) : null;

  return (
    <ThemeProvider theme={Theme}>
      <SupervisorNavigationBar />
      <Button
        variant="contained"
        onClick={() =>
          navigate("/supervisorprojecttemplate")
        }
        sx={{
          textTransform: "none",
          marginTop: "20px",
          position: "absolute",
          right: "30px",
        }}
        
        // startIcon={<AddIcon />}
      >
        <span style={{ fontSize: '16px', marginRight: '8px'}}>+</span>
        Add Project
      </Button>

      {/* { user && user.groups} */}

      <SupervisorProjectList/>
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
