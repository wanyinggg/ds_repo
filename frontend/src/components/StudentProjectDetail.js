import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { styled } from "@mui/system";
import { tableCellClasses } from "@mui/material/TableCell";
import Theme from "./reusable/Theme";
import api from "./axios";

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

export default function StudentProjectDetail(props) {
  const [project, setProject] = useState(null);
  const [projectPanels, setProjectPanels] = useState({});

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    api
      .get(`projects/${props.projectId}/`)
      .then((response) => {
        setProject(response.data);
        console.log("Fetched project data:", response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error.response.data);
      });

    api
      .get(`student_project_panel/?project_id=${props.projectId}`)
      .then((response) => {
        if (response.data && response.data.length > 0) {
          setProjectPanels(response.data[0]); 
        }
      })
      .catch((error) => {
        console.error("Error fetching project panels:", error.response.data);
      });
  }, [props.projectId]);

  if (!project) {
    return;
  }

  const rows = [
    { name: "Project Title", value: project.title },
    { name: "Supervisor", value: project.created_by.full_name },
    { name: "Description", value: project.description },
    { name: "Collaborator", value: project.collaborator },
    { name: "Tool", value: project.tool },
    ...(projectPanels && projectPanels.panels
      ? [
          {
            name: "Panels",
            value: projectPanels.panels
              .map((panel) => panel.full_name)
              .join(", "),
          },
        ]
      : []),
  ];

  return (
    <ThemeProvider theme={Theme}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Box sx={{ margin: "1rem" }}>
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
        </Grid>
      </Grid>
    </ThemeProvider>
  );
}
