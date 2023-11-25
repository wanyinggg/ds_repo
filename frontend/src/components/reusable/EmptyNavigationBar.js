import React from "react";
import { AppBar, Toolbar, Typography, Container, Box } from "@mui/material";
import { ThemeProvider, styled } from "@mui/material/styles";
import Theme from "./Theme";
import umLogo from "../image/umlogo.png";
import backgroundImage from "../image/fsktm.jpg";
import fsktmLogo from "../image/fsktm-logo.png";

function EmptyNavigationBar() {
  const Logo = styled("img")({
    height: "40px",
    marginRight: "10px",
  });

  return (
    <ThemeProvider theme={Theme}>
      <AppBar
        position="static"
        sx={{
          backgroundImage: `linear-gradient(to right, rgba(182, 178, 239, 0.95), rgba(38, 96, 167, 0.9)), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          height: "30vh",
          display: "flex",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            bottom: "60vh",
            left: "0",
            padding: "8px",
            marginLeft: "30px",
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "white",
              letterSpacing: "0.1em",
              margin: "0",
            }}
          >

          </Typography>
        </Box>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            <Logo
              img
              src={umLogo}
              sx={{
                display: { xs: "none", md: "flex" },
              }}
            />
            <Logo
              img
              src={umLogo}
              sx={{
                display: { xs: "flex", md: "none" },
              }}
            />
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}

export default EmptyNavigationBar;
