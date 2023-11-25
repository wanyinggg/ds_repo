import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Button,
  TextField,
  Typography,
  Container,
  Box,
  IconButton,
  Grid,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import Theme from "./Theme";
import api from "../axios";
import StudentNavigationBar from "./StudentNavigationBar";
import SupervisorNavigationBar from "./SupervisorNavigationBar";
import AdminNavigationBar from "./AdminNavigationBar";
import CoordinatorNavigationBar from "./CoordinatorNavigationBar";
import PanelNavigationBar from "./PanelNavigationBar";

export default function ResetCurrentPassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentRole = params.get("role");
  const navigate = useNavigate();

  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Perform form validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(
        "Please enter your current password, new password, and confirm it"
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Make API call to reset the password
    api
      .post("/reset-current-password/", {
        current_password: currentPassword,
        new_password1: newPassword,
        new_password2: confirmPassword,
      })
      .then((response) => {
        if (response.data.success) {
          setSuccess(true);
          setError("");
        } else if (response.data.error) {
          if (Array.isArray(response.data.error)) {
            setError(response.data.error.join("\n"));
          } else {
            setError(response.data.error);
          }
        }
      });
  };

  const handleCurrentPasswordChange = (e) => {
    setCurrentPassword(e.target.value);
    setError("");
  };

  const handleNewPasswordChange = (e) => {
    setNewPassword(e.target.value);
    setError("");
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    setError("");
  };

  const handleBack = () => {
    setSuccess(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");

    navigate(-1);
  };

  const transformErrors = (errorObj) => {
    return Object.values(errorObj)
      .map((errors) => errors.join("\n"))
      .join("\n");
  };

  if (success) {
    return (
      <ThemeProvider theme={Theme}>
        <Grid item xs={12}>
          {currentRole === "programcoordinator" ? (
            <CoordinatorNavigationBar />
          ) : currentRole === "admin" ? (
            <AdminNavigationBar />
          ) : currentRole === "supervisor" ? (
            <SupervisorNavigationBar />
          ) : currentRole === "panel" ? (
            <PanelNavigationBar />
          ) : (
            <StudentNavigationBar />
          )}
        </Grid>
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
            <br />
            <Typography component="p" variant="body1">
              Your password has been successfully reset. You can now log in with
              your new password.
            </Typography>
            <Button
              onClick={handleBack}
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, textTransform: "none" }}
            >
              Back
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={Theme}>
      <Grid item xs={12}>
        {currentRole === "programcoordinator" ? (
          <CoordinatorNavigationBar />
        ) : currentRole === "admin" ? (
          <AdminNavigationBar />
        ) : currentRole === "supervisor" ? (
          <SupervisorNavigationBar />
        ) : currentRole === "panel" ? (
          <PanelNavigationBar />
        ) : (
          <StudentNavigationBar />
        )}
      </Grid>
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
          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              type={showCurrentPassword? "text" : "password"}
              id="current-password"
              label="Current Password"
              name="currentPassword"
              autoComplete="current-password"
              value={currentPassword}
              onChange={handleCurrentPasswordChange}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type={showNewPassword ? "text" : "password"}
              id="new-password"
              label="New Password"
              name="newPassword"
              autoComplete="new-password"
              value={newPassword}
              onChange={handleNewPasswordChange}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              type={showConfirmPassword ? "text" : "password"}
              id="confirm-password"
              label="Confirm Password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              InputProps={{
                endAdornment: (
                  <IconButton
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                ),
              }}
            />
            {error && (
              <Typography
                variant="body2"
                color="error"
                style={{ whiteSpace: "pre-line" }}
              >
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
