import React, { useState } from "react";
import { Button, TextField, Typography, Container, Box, CircularProgress, } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import EmptyNavigationBar from "./reusable/EmptyNavigationBar";
import Theme from "./reusable/Theme";
import api from "./axios";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();

    // Perform form validation
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);

    api
      .post("/reset-password-request/", { email: email })
      .then((response) => {
        setSuccess(true);
        setError("");
      })
      .catch((error) => {
        console.log(error.response.data);
        setError("Email not registered.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setError("");
  };

  const handleBackToHome = () => {
    // Navigate the user to the home page
    navigate("/");
  };

  if (success) {
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
              Password Reset Email Sent
            </Typography>
            <br />
            <Typography component="p" variant="body1">
              An email with instructions to reset your password has been sent to
              your email address.
            </Typography>
            <Button
              onClick={handleBackToHome}
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Back to Home
            </Button>
          </Box>
        </Container>
      </ThemeProvider>
    );
  }

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
            Forgot Password
          </Typography>
          <br />
          <Typography component="h5" variant="subtitle1" color="textSecondary">
            Enter your email
          </Typography>
          <form onSubmit={handleSubmit}>
          <div style={{ width: 300 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleEmailChange}
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
              disabled={loading} // Disable button during loading
            >
              {loading ? <CircularProgress size={24} /> : "Send Reset Email"}
            </Button>
            </div>
          </form>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
