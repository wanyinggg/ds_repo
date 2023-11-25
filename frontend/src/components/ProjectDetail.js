import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Button, Grid, Paper, Table, TableBody, TableCell, TableContainer,  TableRow, Typography } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/system";
import { tableCellClasses } from "@mui/material/TableCell";
import Theme from "./reusable/Theme";
import api from "./axios";
import EmptyNavigationBar from "./reusable/EmptyNavigationBar";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";

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

export default function ProjectDetail(props) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); 
  };

  useEffect(() => {
    const user = (sessionStorage.getItem("user") || localStorage.getItem("user"));

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);

    api
      .get(`projects/${id}/`)
      .then((response) => {
        setProject(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error.response.data);
      });

  }, [id]);

  if (!project) {
    console.log(props.id)
    return <Typography>Loading...</Typography>;
  }

  const rows = [
    { name: "Project Title", value: project.title },
    { name: "Supervisor", value: project.created_by.full_name },
    { name: "Description", value: project.description },
    { name: "Collaborator", value: project.collaborator },
    { name: "Tool", value: project.tool },
    { name: "Student", value: project.assigned_to ? project.assigned_to.map(user => user.full_name).join(', ') : '' },
  ];

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
        <EmptyNavigationBar />
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
                        <TableCell>{row.value}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
          <Button
            onClick={handleBack}
            variant="contained"
            sx={{
              color: "white",
              bgcolor: "primary",
              borderRadius: "15px",
              padding: "10px 25px",
              marginLeft: "30px",
              "&:hover": { bgcolor: "#7043f6", color: "#fff" },
              fontWeight: "bold",
              textTransform: "none",
            }}
          >
            Back
          </Button>
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
