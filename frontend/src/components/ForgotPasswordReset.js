import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "./axios";
import { ThemeProvider } from "@mui/material/styles";
import EmptyNavigationBar from "./reusable/EmptyNavigationBar";
import Theme from "./reusable/Theme";
import {
  Container,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { InputAdornment, IconButton } from "@mui/material";

function ForgotPasswordReset({}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const transformErrors = (errorObj) => {
    return Object.values(errorObj)
      .map((errors) => errors.join("\n"))
      .join("\n");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleLoginRedirect = () => {
    navigate("/login");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    api
      .post(`/reset-password/${token}/`, {
        password: password,
        password_confirm: confirmPassword,
      })
      .then((response) => {
        setSuccessMessage("Your password has been reset successfully!");
        setErrorMessage("");
      })
      .catch((error) => {
        const rawErrorMsg =
          error.response && error.response.data && error.response.data.error;
        const errorMsg =
          typeof rawErrorMsg === "object"
            ? transformErrors(rawErrorMsg)
            : rawErrorMsg ||
              "Failed to reset password. Please try again later.";

        setErrorMessage(errorMsg);
        setSuccessMessage("");
        console.log(error.response.data);
      });
  };

  useEffect(() => {
    api
      .get(`/get-username/${token}/`)
      .then((response) => {
        setUsername(response.data.username);
      })
      .catch((error) => {
        console.error("Failed to fetch username", error.response.data);
      });
  }, [token]);

  return (
    <ThemeProvider theme={Theme}>
      <EmptyNavigationBar />
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mt: 8,
          }}
        >
          {username ? (
            <>
              <Typography component="h1" variant="h5">
                Reset Password
              </Typography>
              {successMessage ? (
                <>
                  <Alert severity="success">{successMessage}</Alert>
                  <Button
                    fullWidth
                    variant="contained"
                    color="primary"
                    sx={{ mt: 3 }}
                    onClick={handleLoginRedirect}
                  >
                    Go to Login
                  </Button>
                </>
              ) : (
                <>
                  {errorMessage && (
                    <Alert severity="error" style={{ whiteSpace: "pre-line" }}>
                      {errorMessage}
                    </Alert>
                  )}
                  <Box
                    component="form"
                    noValidate
                    sx={{ mt: 3, width: "100%" }}
                  >
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      name="username"
                      label="Username"
                      value={username}
                      disabled
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      name="password"
                      label="New Password"
                      type={showPassword ? "text" : "password"}
                      id="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={togglePasswordVisibility}
                              edge="end"
                            >
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <TextField
                      variant="outlined"
                      margin="normal"
                      required
                      fullWidth
                      name="confirmPassword"
                      label="Confirm New Password"
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={toggleConfirmPasswordVisibility}
                              edge="end"
                            >
                              {showConfirmPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      type="button"
                      fullWidth
                      variant="contained"
                      color="primary"
                      sx={{ mt: 3 }}
                      onClick={handleSubmit}
                    >
                      Submit
                    </Button>
                  </Box>
                </>
              )}
            </>
          ) : (
            <Typography variant="body1" sx={{ mt: 2 }}>
              Your link has expired
            </Typography>
          )}
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default ForgotPasswordReset;
