import React, { useEffect, useState } from "react";
import { ThemeProvider, styled, createTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Paper,
} from "@mui/material";
import umLogo from "./image/umlogo.png";
import fsktmLogo from "./image/fsktm-logo.png";
import backgroundImage from "./image/fsktm.jpg";
import Theme from "./reusable/Theme";
import { Link, useNavigate } from "react-router-dom";
import { tableCellClasses } from "@mui/material/TableCell";
import api from "./axios";

const Logo = styled("img")({
  height: "40px",
  marginRight: "10px",
});

const theme = createTheme({
  palette: {
    primary: {
      main: "#8950fc",
    },
  },
});

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.primary.light,
    color: "white",
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:last-child td, &:last-child th": {
    border: 0,
  },
}));

export default function Homepage() {
  const navigate = useNavigate();

  // Check if the user is already logged in (e.g., token and user data are in localStorage)
  useEffect(() => {
    const token =
      sessionStorage.getItem("token") || localStorage.getItem("token");
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

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

  const [announcements, setAnnouncements] = useState([]);

  const fetchAnnouncements = () => {
    api
      .get("/announcements/")
      .then((response) => {
        setAnnouncements(response.data);
      })
      .catch((error) =>
        console.error(
          "Error retrieving the announcements: ",
          error.response.data
        )
      );
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

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
              <Grid
                container
                justifyContent="space-between"
                alignItems="center"
              >
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
              variant="h4"
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

        <Container maxWidth={false} sx={{ mt: 4, mb: 4, overflowX: "auto" }}>
          <Typography variant="h5" gutterBottom component="div">
            Announcement List
          </Typography>
          <TableContainer
            component={Paper}
            elevation={3}
            sx={{ marginTop: 2, marginBottom: 4 }}
          >
            <Table sx={{ minWidth: 550 }} aria-label="announcement table">
              <TableHead>
                <TableRow>
                  <StyledTableCell>No</StyledTableCell>
                  <StyledTableCell>Title</StyledTableCell>
                  <StyledTableCell>Created At</StyledTableCell>
                  <StyledTableCell>Details</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {announcements.map((announcement, index) => (
                  <StyledTableRow key={announcement.id}>
                    <StyledTableCell>{index + 1}</StyledTableCell>{" "}
                    {/* Display index + 1 */}
                    <StyledTableCell>{announcement.title}</StyledTableCell>
                    <StyledTableCell>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Button
                        component={Link}
                        to={`/announcementdetail/${announcement.id}`} // Using index for the URL
                        variant="text"
                        size="small"
                      >
                        Details
                      </Button>
                    </StyledTableCell>
                  </StyledTableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Container>
      </Grid>
    </ThemeProvider>
  );
}
