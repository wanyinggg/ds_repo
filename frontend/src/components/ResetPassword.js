import React, { useState, useEffect } from "react";
import { Button, TextField, Typography, Container, Box, Grid } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import Theme from "./reusable/Theme";
import api from "./axios"; 
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import AdminNavigationBar from "./reusable/AdminNavigationBar";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const user = (sessionStorage.getItem("user") || localStorage.getItem("user"));

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Perform form validation
    if (!password || !confirmPassword) {
      setError("Please enter your new password and confirm it");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Make API call to reset the password
    api
      .post("/reset-password/", { password })
      .then((response) => {
        setSuccess(true);
        setError("");
      })
      .catch((error) => {
        console.log(error.response.data)
        setError("Something went wrong. Please try again later.");
      });
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
  };

  if (success) {
    return (
      <ThemeProvider theme={Theme}>
        {user  && user.groups.includes(2) ? (
        <Grid item xs={12}>
          <SupervisorNavigationBar />
        </Grid>
      ) : user  && user.groups.includes(1) ? (
        <Grid item xs={12}>
          <StudentNavigationBar />
        </Grid>
      ) : (
        <AdminNavigationBar />
      )}
        <Container component="main" maxWidth="xs">
          <Box
            sx={{
              marginTop: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Typography component="h1" variant="h5">
              Password Reset Successful
            </Typography>
            <Typography component="p" variant="body1">
              Your password has been successfully reset. You can now log in with your new password.
            </Typography>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={Theme}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <br />
          <Typography component="h5" variant="subtitle1" color="textSecondary">
            Enter your new password
          </Typography>
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              type="password"
              id="password"
              label="New Password"
              name="password"
              autoComplete="new-password"
              value={password}
              onChange={handlePasswordChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type="password"
              id="confirm-password"
              label="Confirm Password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
            />
            {error && (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, textTransform: "none" }}
            >
              Reset Password
            </Button>
          </form>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
