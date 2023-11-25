import React, { useEffect, useState } from 'react';
import { ThemeProvider, styled } from "@mui/material/styles";
import { Box, Button, Grid, Typography } from "@mui/material";
import umLogo from "./image/umlogo.png";
import fsktmLogo from "./image/fsktm-logo.png";
import backgroundImage from "./image/fsktm.jpg";
import Theme from './reusable/Theme';
import ProjectList from "./ProjectList";
import { Link, useNavigate} from "react-router-dom";

const Logo = styled("img")({
  height: "40px",
  marginRight: "10px",
});


export default function Homepage() {
  const [projects, setProjects] = useState([]);
  const navigate = useNavigate(); 

  useEffect(() => {
    fetch('/api/projects/')
      .then(response => response.json())
      .then(data => setProjects(data));
  }, []);

  // Check if the user is already logged in (e.g., token and user data are in localStorage)
  useEffect(() => {
    const token = sessionStorage.getItem("token") || localStorage.getItem("token");
    const user = (sessionStorage.getItem("user") || localStorage.getItem("user"));

    if (token && user) {
      const userData = JSON.parse(user);
      if (userData.groups.includes(1)) {
        navigate("/student"); // Redirect to student home page
      } else if (userData.groups.includes(2)) {
        navigate("/supervisor"); // Redirect to supervisor home page
      } else if (userData.groups.includes(3)) {
        navigate("/admin"); // Redirect to admin home page
      }
    }
  }, [navigate]);

  return (
    <ThemeProvider theme={Theme}>
      <Grid container direction="column">
        <Grid item xs={12}>
          <Box
            sx={{
              backgroundImage: `linear-gradient(to right, rgba(182, 178, 239, 0.95), rgba(38, 96, 167, 0.8)), url(${backgroundImage})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "bottom",
              height: "40vh",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              "@media (max-width: 1024px)": {
                height: "40vh",
              },
            }}
          >
            <Box sx={{ flexGrow: 1, zIndex: 1, padding: "1rem" }}>
              <Grid container justifyContent="space-between" alignItems="center">
                <Grid item>
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Logo src={umLogo} alt="University Malaya logo" />
                    {/* <img src={fsktmLogo} alt="FSKTM logo" height="40px" /> */}
                  </Box>
                </Grid>
                <Grid item>
                  <Button
                    component={Link}
                    to="/login"
                    variant="contained"
                    sx={{
                      color: "#8950fc",
                      bgcolor: "#fff",
                      borderRadius: "15px",
                      padding: "5px 10px",
                      margin: "10px 0",
                      "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                      fontWeight: "bold",
                    }}
                  >
                    Sign In
                  </Button>
                </Grid>
              </Grid>
            </Box>
            <Typography
              variant='h4'
              sx={{
                color: "white",
                textAlign: "center",
                letterSpacing: "0.1em",
                marginBottom: "6rem",
                lineHeight: "1.5",
              }}
            >
              Data Science <br />
              Project Management System
            </Typography>
          </Box>
        </Grid>
        <Grid item>
          <ProjectList projects={projects}/>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
