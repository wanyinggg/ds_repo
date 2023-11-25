import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Button,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/system";
import { tableCellClasses } from "@mui/material/TableCell";
import Theme from "./reusable/Theme";
import api from "./axios";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import AdminNavigationBar from "./reusable/AdminNavigationBar";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  "&:first-child": {
    backgroundColor: "#EBEDF3",
    color: "black",
    width: "150px",
    verticalAlign: "top",
    fontWeight: "bold",
  },
  [`&.${tableCellClasses.head}`]: {
    width: "150px",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

export default function PreviousProjectDetail() {
  const location = useLocation();
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const navigateSemester = location.state?.navigateSemester ;
  
  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);

    api
      .get(`archived_projects/${id}/`, { params: { user_projects: true } })
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });
  }, [id]);

  if (!project) {
    return <Typography>Loading...</Typography>;
  }

  const handleBack = () => {
    

    let backPath = "";

    // Determine the back path based on user role
    if (user && user.groups.includes(2)) { // Supervisor
        backPath = "/supervisorpreviousproject";
    } else if (user && user.groups.includes(3)) { // Admin
        backPath = "/adminproject";
    } else { // Student
        backPath = "/studentpreviousproject";
    }

    // Navigate to the determined path
    if (backPath) {
      navigate(backPath, { state: { navigateSemester } });
    }
};

  const rows = [
    { name: "Project Title", value: project.title },
    { name: "Supervisor", value: project.original_creator_name },
    { name: "Description", value: project.description },
    { name: "Collaborator", value: project.collaborator },
    { name: "Tool", value: project.tool },
    {
      name: "Student",
      value: project.original_assigned_to_names
        ? project.original_assigned_to_names.join(", ")
        : "",
    },
  ];

  return (
    <ThemeProvider theme={Theme}>
      {user && user.groups.includes(2) ? (
        <Grid item xs={12}>
          <SupervisorNavigationBar />
        </Grid>
      ) : user && user.groups.includes(3) ? (
        <Grid item xs={12}>
          <AdminNavigationBar />
        </Grid>
      ) : (
        <StudentNavigationBar />
      )}
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ margin: "30px" }}>
            <Paper>
              <TableContainer>
                <Table>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow key={row.name}>
                        <StyledTableCell component="th" scope="row">
                          {row.name}
                        </StyledTableCell>
                        <TableCell style={{ whiteSpace: "pre-line" }}>
                          {row.value}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
          <Grid
            container
            justifyContent="space-between"
            spacing={2}
            sx={{ marginBottom: "20px" }}
          >
            <Grid item>
              <Button
                onClick={handleBack}
                variant="contained"
                sx={{
                  color: "white",
                  bgcolor: "primary",
                  borderRadius: "15px",
                  padding: "10px 25px",
                  "&:hover": { bgcolor: "#7043f6", color: "#fff" },
                  fontWeight: "bold",
                  textTransform: "none",
                  marginLeft: "30px",
                }}
              >
                Back
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
