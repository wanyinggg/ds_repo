import React from "react";
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
  ToggleButton,
  ToggleButtonGroup,
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

const pages = [
  { label: "Panel Assignment", path: "/programcoordinator" },
  { label: "Presentation Schedule", path: "/programcoordinatorschedulling" },
  { label: "Student Reports", path: "/programcoordinatorreport" },
  { label: "Dashboard", path: "/dashboard" },
];

const settings = ["Switch to Supervisor", "Switch to Panel","Profile", "Reset Password", "Logout"];

function CoordinatorNavigationBar() {
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const [anchorElUser, setAnchorElUser] = React.useState(null);
  const [userRole, setUserRole] = React.useState("programcoordinator");
  const location = useLocation();
  const navigate = useNavigate();

  const storedUser = JSON.parse(
    sessionStorage.getItem("user") || localStorage.getItem("user")
  );

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

  const handleRoleChange = (event, newRole) => {
    setUserRole(newRole);
    if (newRole === "supervisor") {
      navigate("/supervisor");
    } else if (newRole === "panel") {
      navigate("/panelpresentation");
    }
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
    marginRight: "8px",
  });

  const showToggleButtonGroup = location.pathname === "/programcoordinator";

  const getPageName = () => {
    if (location.pathname === "/profile") {
      return "Profile";
    } else if (location.pathname .startsWith("/resetcurrentpassword")) {
      return "Reset Password";
    }

    const currentPage = pages.find((page) => page.path === location.pathname);
    return currentPage ? currentPage.label : "";
  };

  const shouldShowPageName = location.pathname !== "/programcoordinator";

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
          {showToggleButtonGroup && (
            <ToggleButtonGroup
              value={userRole}
              exclusive
              onChange={handleRoleChange}
              aria-label="user role"
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.2)", 
                borderRadius: "4px", 
                border: "none", 
                ".MuiToggleButtonGroup-grouped": {
                  margin: "4px", 
                  border: "0", 
                  "&.Mui-disabled": {
                    border: "0", 
                  },
                },
              }}
            >
              <ToggleButton
                value="supervisor"
                disabled={userRole === "supervisor"}
                color="primary"
                variant="outlined"
                style={{ textTransform: "none" }}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "white",
                    color: "#3f51b5",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                Supervisor
              </ToggleButton>
              <ToggleButton
                value="panel"
                disabled={userRole === "panel"}
                color="primary"
                variant="outlined"
                style={{ textTransform: "none" }}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "white",
                    color: "#3f51b5",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                Panel
              </ToggleButton>
              <ToggleButton
                value="programcoordinator"
                disabled={userRole === "programcoordinator"}
                color="primary"
                variant="outlined"
                style={{ textTransform: "none" }}
                sx={{
                  "&.Mui-selected": {
                    backgroundColor: "white",
                    color: "#3f51b5",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  },
                }}
              >
                Program Coordinator
              </ToggleButton>
            </ToggleButtonGroup>
          )}
          {shouldShowPageName && (
            <Typography
              variant="h5"
              sx={{
                color: "white",
                letterSpacing: "0.1em",
                margin: "0",
              }}
            >
              {getPageName()}
            </Typography>
          )}
        </Box>
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
                  onClick={handleCloseNavMenu}
                  component={Link}
                  to={page.path}
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
                    onClick={() => {
                      if (setting === "Profile") {
                        navigate(`/profile?role=${userRole}`);
                      } else if (setting === "Logout") {
                        handleLogout();
                      } else if (setting === "Reset Password") {
                        navigate(`/resetcurrentpassword?role=${userRole}`);
                      }  else if (setting === "Switch to Supervisor") {
                        handleRoleChange(null, "supervisor");
                      } else if (setting === "Switch to Panel") {
                        handleRoleChange(null, "panel");
                      } else {
                        handleCloseUserMenu();
                      }
                    }}
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

export default CoordinatorNavigationBar;
