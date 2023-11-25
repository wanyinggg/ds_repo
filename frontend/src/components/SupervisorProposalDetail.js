import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Typography,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import SupervisorNavigationBar from "./reusable/SupervisorNavigationBar";
import api from "./axios";

const theme = createTheme({
  palette: {
    primary: {
      main: "#8950fc",
    },
    success: {
      main: "#4caf50",
    },
    error: {
      main: "#f44336",
    },
  },
});

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

export default function SupervisorProposalDetail() {
  const location = useLocation();
  const { id } = useParams();
  const [proposal, setProposal] = useState(null);
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Navigate back by one step in the history
  };

  useEffect(() => {
    api
      .get(`proposals/${id}/`)
      .then((response) => {
        setProposal(response.data);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      });

  }, [id]);

  if (!proposal) {
    return <Typography>Loading...</Typography>;
  }

  const rows = [
    { name: "Proposal Title", value: proposal.title },
    { name: "Supervisor", value: proposal.supervisor.full_name },
    { name: "Description", value: proposal.description },
    { name: "Collaborator", value: proposal.collaborator },
    { name: "Tool", value: proposal.tool },
    { name: "Student", value: proposal.student.full_name},
    { name: "Student Matric Number", value: proposal.student.username},
  ];

  return (
    <ThemeProvider theme={theme}>
      <SupervisorNavigationBar />
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
