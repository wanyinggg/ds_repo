import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import EmptyNavigationBar from "./reusable/EmptyNavigationBar";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css"; // Import the Quill styles

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

export default function AnnouncementDetail(props) {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);

  const handleBack = () => {
    navigate(-1);
  };

  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);
  }, [id]);

  useEffect(() => {
    // Fetch the announcement data by its ID from your API
    api
      .get(`/announcements/${id}/`)
      .then((response) => {
        setAnnouncement(response.data);
      })
      .catch((error) => {
        console.error("Error fetching announcement:", error.response.data);
      });
  }, [id]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return dateString ? new Date(dateString).toLocaleDateString(undefined, options) : "";
  };

  const rows = [
    { name: "Title", value: announcement?.title || "" },
    {
      name: "Description",
      value: (
        <div
          dangerouslySetInnerHTML={{
            __html: announcement?.content || "",
          }}
        />
      ),
    },
    { name: "Created At", value: formatDate(announcement?.created_at) || "" },
  ];

  return (
    <ThemeProvider theme={Theme}>
      <EmptyNavigationBar />

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
