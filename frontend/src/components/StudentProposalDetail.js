import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Box, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
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

export default function StudentProposalDetail(props) {
  const location = useLocation(); 
  const [proposal, setProposal] = useState(null);
  const navigate = useNavigate();

  const storedUser = (sessionStorage.getItem("user") || localStorage.getItem("user"));
  const user = storedUser ? JSON.parse(storedUser) : null;

  useEffect(() => {
    api
      .get(`proposals/${props.proposalId}/`)
      .then((response) => {
        setProposal(response.data);
        console.log('Fetched proposal data:', response.data);
      })
      .catch((error) => {
        console.error("Error fetching proposal:", error);
      });

  }, [props.proposalId]);

  if (!proposal) {
    return <Typography>Loading...</Typography>;
  }

  const rows = [
    { name: "Proposal Title", value: proposal.title },
    { name: "Supervisor", value: proposal.supervisor.full_name },
    { name: "Description", value: proposal.description },
    { name: "Collaborator", value: proposal.collaborator },
    { name: "Tool", value: proposal.tool },
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
