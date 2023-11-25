import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import {
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Grid,
  Box,
  Typography,
  Container,
  IconButton,
  InputAdornment,
} from "@mui/material";
import EmptyNavigationBar from "./reusable/EmptyNavigationBar";
import Theme from "./reusable/Theme";
import api from "./axios";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [rememberMe, setRememberMe] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await api.post("login/", {
        username,
        password,
        remember_me: rememberMe,
      });

      if (response.data.token) {
        api.defaults.headers.common[
          "Authorization"
        ] = `Token ${response.data.token}`;
        if (rememberMe) {
          localStorage.setItem("token", response.data.token);
          localStorage.setItem("user", JSON.stringify(response.data.user));
        } else {
          sessionStorage.setItem("token", response.data.token);
          sessionStorage.setItem("user", JSON.stringify(response.data.user));
        }

        let user_data = response.data.user;

        if (user_data.groups.includes(1)) {
          navigate("/student");
        } else if (user_data.groups.includes(2)) {
          navigate("/supervisor");
        } else if (user_data.groups.includes(3)) {
          navigate("/adminsemester");
        }
      } else {
        setError("Incorrect username or password");
      }
    } catch (error) {
      console.error("Error:", error.response.data);
      if (error.response.status === 401) {
        setError("Token expired. Please log in again.");
      } else {
        setError("Incorrect username or password");
      }
    }
  };

  const handleUsernameChange = (event) => {
    setUsername(event.target.value);
    setError(""); // Clear the error message when username changes
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    setError(""); // Clear the error message when password changes
  };

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate("/forgotpassword");
  };

  const handleRememberMeChange = (event) => {
    setRememberMe(event.target.checked);
  };

  return (
    <ThemeProvider theme={Theme}>
      <EmptyNavigationBar />
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
            Sign in
          </Typography>
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ mt: 1 }}
          >
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={handleUsernameChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={handlePasswordChange}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {error && (
              // Render error message if there is an error
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            )}
            <FormControlLabel
              control={
                <Checkbox
                  value={rememberMe}
                  color="primary"
                  onChange={handleRememberMeChange}
                />
              }
              label="Remember me"
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Sign In
            </Button>
            <Grid container>
              <Grid item xs>
                <Button
                  onClick={handleForgotPassword}
                  variant="text"
                  color="primary"
                  sx={{ textTransform: "none" }}
                >
                  Forgot password?
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
