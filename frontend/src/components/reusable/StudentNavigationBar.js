import React, { useState } from "react";
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  MenuItem,
  Container,
  Avatar,
  Button,
  Tooltip,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { ThemeProvider, styled } from "@mui/material/styles";
import Theme from "./Theme";
import umLogo from "../image/umlogo.png";
import backgroundImage from "../image/fsktm.jpg";
import fsktmLogo from "../image/fsktm-logo.png";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api from "../axios";
import NotificationIcon from './NotificationIcon';

function StudentNavigationBar(props) {
  const [anchorElNav, setAnchorElNav] = useState(null);
  const [anchorElUser, setAnchorElUser] = useState(null);

  const location = useLocation();

  const navigate = useNavigate();

  const storedUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user"));

  const pages = [
    { label: "Projects", path: "/student" },
    { label: "My Project", path: "/studentproject" },
    { label: "Submissions", path: "/studentsubmission" },
    { label: "Presentation Timeslot", path: "/studentpresentation" },
    { label: "Previous Project List", path: "/studentpreviousproject" },
  ];
  
  const settings = ["Profile", "Reset Password", "Logout"];

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };
  const handleOpenUserMenu = (event) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleLogout = async () => {
    try {
      await api.post("/logout/");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      api.defaults.headers.common["Authorization"] = "";
      navigate("/");
    } catch (err) {
      console.error("Failed to log out", err.response.data);
      // handle error here
    } finally {
      handleCloseUserMenu();
    }
  };

  const Logo = styled("img")({
    height: "40px",
    marginRight: "10px",
  });

  const isProjectDetail = location.pathname.startsWith("/projectdetail");
  const isProposalDetail = location.pathname.startsWith("/studentproposal");
  const isResetPassword = location.pathname.startsWith("/resetcurrentpassword");
  const isProfile = location.pathname.startsWith("/profile");
  const shouldShowPageName = location.pathname !== "/student";
  const showShowWelcome = location.pathname === "/student";

  const pageTitle =
    pages.find((page) => page.path === location.pathname)?.label ||
    (isProjectDetail
      ? "Project Details"
      : isProposalDetail
      ? "Project Details"
      : isResetPassword
      ? "Reset Password"
      : isProfile
      ? "Profile"
      : "");

  return (
    <ThemeProvider theme={Theme}>
      <AppBar
        position="static"
        sx={{
          backgroundImage: `linear-gradient(to right, rgba(182, 178, 239, 0.95), rgba(38, 96, 167, 0.95)), url(${backgroundImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "bottom",
          minHeight: { xs: "17rem", sm: "15rem" }, 
          maxHeight: { xs: "17rem", sm: "15rem" },
          display: "flex",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "10.5rem", 
            left: "0",
            padding: "0.5rem",
            marginLeft: "1.875rem", 
          }}
        >
          {showShowWelcome && (
            <Typography
            variant="h5"
            sx={{
              color: "white",
              letterSpacing: "0.1em",
              margin: "0",

            }}
          >Welcome, {storedUser?.full_name || ''}</Typography>
          )}
        </Box>
        {shouldShowPageName && (
          <Box
          sx={{
            position: "absolute",
            top: "10.5rem", 
            left: "0",
            padding: "0.5rem",
            marginLeft: "1.875rem", 
          }}
          >
            <Typography
              variant="h5"
              sx={{
                color: "white",
                letterSpacing: "0.1em",
                margin: "0",
              }}
            >
              {pageTitle}
            </Typography>
          </Box>
        )}
        <Container maxWidth="l">
          <Toolbar disableGutters>
            <Logo
              img
              src={umLogo}
              sx={{
                display: { xs: "none", md: "flex" },
              }}
            />
            <Box sx={{ flexGrow: 1, display: { xs: "flex", md: "none" } }}>
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleOpenNavMenu}
                color="inherit"
              >
                <MenuIcon />
              </IconButton>
              <Menu
                id="menu-appbar"
                anchorEl={anchorElNav}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                open={Boolean(anchorElNav)}
                onClose={handleCloseNavMenu}
                sx={{
                  display: { xs: "block", md: "none" },
                }}
              >
                {pages.map((page) => (
                  <MenuItem key={page.label} onClick={handleCloseNavMenu}>
                    <Link to={page.path} style={{ textDecoration: "none" }}>
                      <Typography textAlign="center">{page.label}</Typography>
                    </Link>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
            <Logo
              img
              src={umLogo}
              sx={{
                display: { xs: "flex", md: "none" },
                position: "absolute",
                left: 50,
              }}
            />

            <Box sx={{ flexGrow: 1, display: { xs: "none", md: "flex" } }}>
              {pages.map((page) => (
                <Button
                  key={page.label}
                  onClick={() => {
                    handleCloseNavMenu();
                    navigate(page.path);
                  }}
                  sx={{
                    my: 2,
                    mx: 1, 
                    color: "white",
                    display: "block",
                    textTransform: "none",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    padding: "10px 15px", 
                    borderRadius: "4px", 
                    backgroundColor:
                      location.pathname === page.path
                        ? "rgba(255, 255, 255, 0.2)"
                        : "transparent", 
                    "&:hover": {
                      backgroundColor: "rgba(255, 255, 255, 0.1)", 
                      textDecoration: "none", 
                    },
                    "&:focus": {
                      boxShadow: "0 0 0 2px rgba(255, 255, 255, 0.5)", 
                    },
                  }}
                >
                  {page.label}
                </Button>
              ))}
            </Box>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                [Theme.breakpoints.down("sm")]: {
                  justifyContent: "space-between",
                },
              }}
            >
            <NotificationIcon />
              <Tooltip title="Open settings">
                <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                  <Avatar>
                    {storedUser && storedUser.full_name.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </Tooltip>
              <Menu
                sx={{ mt: "45px" }}
                id="menu-appbar"
                anchorEl={anchorElUser}
                anchorOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                keepMounted
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                open={Boolean(anchorElUser)}
                onClose={handleCloseUserMenu}
              >
                {settings.map((setting) => (
                  <MenuItem
                    key={setting}
                    onClick={
                      setting === "Profile"
                        ? () => navigate("/profile")
                        : setting === "Logout"
                        ? handleLogout
                        : setting === "Reset Password"
                        ? () => navigate("/resetcurrentpassword")
                        : handleCloseUserMenu
                    }
                  >
                    <Typography textAlign="center">{setting}</Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
    </ThemeProvider>
  );
}

export default StudentNavigationBar;
