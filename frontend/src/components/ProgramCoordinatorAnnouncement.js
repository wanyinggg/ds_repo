import React, { useState, useEffect } from "react";
import {
  ThemeProvider,
  createTheme,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Container,
  Fab,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { tableCellClasses } from "@mui/material/TableCell";
import { styled } from "@mui/material/styles";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CoordinatorNavigationBar from "./reusable/CoordinatorNavigationBar";
import api from "./axios";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { Link } from "react-router-dom";

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

export default function ProgramCoordinatorAnnouncement() {
  const [open, setOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [semesterInfo, setSemesterInfo] = useState({});
  const [currentAnnouncement, setCurrentAnnouncement] = useState({
    title: "",
    content: "",
  });
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [currentAnnouncementId, setCurrentAnnouncementId] = useState(null); 
  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const fetchAnnouncements = () => {
    api
      .get("/announcements/")
      .then((response) => {
        setAnnouncements(response.data);
      })
      .catch((error) =>
        console.error("Error retrieving the announcements: ", error)
      );
  };

  useEffect(() => {
    fetchAnnouncements();

    if (!semesterInfo.semester || !semesterInfo.academicYear) {
      api
        .get("semester/")
        .then((response) => {
          const allSemesters = response.data;

          // Find the semester where is_latest is true
          const latestSemester = allSemesters.find((sem) => sem.is_latest);

          setSemesterInfo(latestSemester);
          console.error("semester", semesterInfo);
        })
        .catch((err) => {
          console.error("Error fetching semester data:", err.response.data);
        });
    }
  }, []);

  const handleOpen = (announcement = { title: "", content: "" }) => {
    setCurrentAnnouncement(announcement);
    setOpen(true);
  };

  const handleSave = () => {
    const announcementData = {
      ...currentAnnouncement,
      created_by_id: user.id,
      semester: semesterInfo.id,
      // created_by: user.full_name,
    };

    const method = currentAnnouncement.id ? "put" : "post";
    const url = currentAnnouncement.id
      ? `/announcements/${currentAnnouncement.id}/`
      : `/announcements/`;

    api[method](url, announcementData)
      .then(() => {
        setOpen(false);
        fetchAnnouncements();
      })
      .catch((error) =>
        console.error("Error saving the announcement: ", error.response.data)
      );
  };

  const handleDelete = (announcementId) => {
    // Open the delete confirmation dialog
    setDeleteConfirmationOpen(true);
    
    // Pass the announcement id to the handleConfirmDelete function
    setCurrentAnnouncementId(announcementId); // Add this line
  };
  
  const handleConfirmDelete = () => {
    // Use the announcementId received from handleDelete
    api
      .delete(`/announcements/${currentAnnouncementId}/`)
      .then(() => {
        fetchAnnouncements();
      })
      .catch((error) =>
        console.error("Error deleting the announcement: ", error)
      );
  
    // Close the delete confirmation dialog
    setDeleteConfirmationOpen(false);
  };
  

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmationOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <CoordinatorNavigationBar />
      <Button
        variant="contained"
        onClick={() => handleOpen()}
        sx={{
          textTransform: "none",
          marginTop: "20px",
          position: "absolute",
          right: "30px",
        }}

        // startIcon={<AddIcon />}
      >
        <span style={{ fontSize: "16px", marginRight: "8px" }}>+</span>
        Add New Announcement
      </Button>

      <Container maxWidth="xl" sx={{ mt: 10, mb: 4 }}>
        <TableContainer component={Paper}>
          <Table aria-label="announcements table">
            <TableHead>
              <StyledTableRow>
                <StyledTableCell>No.</StyledTableCell>
                <StyledTableCell>Title</StyledTableCell>
                <StyledTableCell>Created At</StyledTableCell>
                <StyledTableCell>Details</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </StyledTableRow>
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
                  <StyledTableCell align="center">
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => handleOpen(announcement)}
                    >
                      Edit
                    </Button>
                    <Button
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(announcement.id)}
                      color="error"
                    >
                      Delete
                    </Button>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
      {/* Dialog for Adding/Editing Announcements */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: "white",
          }}
        >
          {currentAnnouncement.id ? "Edit Announcement" : "New Announcement"}
        </DialogTitle>

        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="title"
            label="Announcement Title"
            type="text"
            fullWidth
            variant="outlined"
            value={currentAnnouncement.title}
            onChange={(e) =>
              setCurrentAnnouncement({
                ...currentAnnouncement,
                title: e.target.value,
              })
            }
            sx={{ mb: 3 }}
          />
          <DialogContentText>Announcement Content</DialogContentText>
          <ReactQuill
            value={currentAnnouncement.content}
            onChange={(value) =>
              setCurrentAnnouncement({
                ...currentAnnouncement,
                content: value,
              })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSave} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmationOpen}
        onClose={handleCloseDeleteConfirmation}
      >
        <DialogTitle>Delete Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this announcement?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirmation} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </ThemeProvider>
  );
}
