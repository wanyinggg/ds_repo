import React from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Grid,
  TextField,
  Button,
  Modal,
  Typography,
  Divider,
  IconButton,
  Alert,
  Backdrop,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import ScheduleIcon from "@mui/icons-material/Schedule";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import { tableCellClasses } from "@mui/material/TableCell";
import PanelNavigationBar from "./reusable/PanelNavigationBar";
import Theme from "./reusable/Theme";
import api from "./axios";

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
    position: "relative",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}));

function formatDateToYYYYMMDD(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = ("0" + (d.getMonth() + 1)).slice(-2);
  const day = ("0" + d.getDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

export default function PanelPresentation() {
  const [projectPanels, setProjectPanels] = useState({});
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [presentationSchedules, setPresentationSchedules] = useState([]);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState(() => {
    const savedData = sessionStorage.getItem("selectedTimeSlots");
    return savedData ? JSON.parse(savedData) : {};
  });
  const [currentSelectedDate, setCurrentSelectedDate] = useState(null);
  const [deleteAlert, setDeleteAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [availableDatesMap, setAvailableDatesMap] = useState({});
  const [existingDates, setExistingDates] = useState([]);

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");

  const user = storedUser ? JSON.parse(storedUser) : null;

  const columns = [
    { label: "No." },
    { label: "Project Title", field: "title" },
    { label: "Student", field: "student" },
    { label: "Matric Number", field: "matric" },
    { label: "Presentation Date", field: "presentationDate" },
    { label: "Presentation Time", field: "presentationTime" },
    { label: "Google Meet Link" },
    { label: "Panels" },
  ];

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedProjects = filteredProjects.sort((a, b) => {
    let fieldA = a[sortField];
    let fieldB = b[sortField];

    // Handle nested properties for sorting
    if (sortField === "presentationDate" || sortField === "presentationTime") {
      const scheduleA = presentationSchedules.find(
        (s) => s.project.id === a.id && s.student.id === a.student.id
      );
      const scheduleB = presentationSchedules.find(
        (s) => s.project.id === b.id && s.student.id === b.student.id
      );

      if (sortField === "presentationDate") {
        fieldA = scheduleA ? new Date(scheduleA.date) : new Date(0);
        fieldB = scheduleB ? new Date(scheduleB.date) : new Date(0);
      } else {
        // Assuming start_time is the representation for presentationTime
        fieldA = scheduleA
          ? new Date(scheduleA.date + "T" + scheduleA.start_time + "Z")
          : new Date(0);
        fieldB = scheduleB
          ? new Date(scheduleB.date + "T" + scheduleB.start_time + "Z")
          : new Date(0);
      }

      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
    } else if (sortField === "matric") {
      fieldA = a.student_username.match(/\d+/)
        ? parseInt(a.student_username.match(/\d+/)[0], 10)
        : 0;
      fieldB = b.student_username.match(/\d+/)
        ? parseInt(b.student_username.match(/\d+/)[0], 10)
        : 0;

      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
    } else if (sortField === "student") {
      fieldA = a.student_fullname; // Using the flattened property
      fieldB = b.student_fullname; // Using the flattened property
    } else if (sortField === "supervisor") {
      fieldA = a.created_by.full_name;
      fieldB = b.created_by.full_name;
    }

    // The remaining sorting logic
    if (fieldA === fieldB) {
      return 0;
    }

    if (typeof fieldA === "number" && typeof fieldB === "number") {
      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
    }

    if (typeof fieldA === "string" && typeof fieldB === "string") {
      return sortDirection === "asc"
        ? fieldA.localeCompare(fieldB)
        : fieldB.localeCompare(fieldA);
    }

    if (fieldA === undefined || fieldA === null) {
      return sortDirection === "asc" ? 1 : -1;
    }

    if (fieldB === undefined || fieldB === null) {
      return sortDirection === "asc" ? -1 : 1;
    }

    return 0;
  });

  const fetchData = () => {
    // Fetch the panels first
    api
      .get(`student_project_panel/?context=review-panel&role=supervisor`)
      .then((response) => {
        const panelsData = response.data.reduce((acc, item) => {
          if (!acc[item.project.id]) {
            acc[item.project.id] = {};
          }
          acc[item.project.id][item.student.id] = {
            panels: item.panels,
            assignmentId: item.id,
          };
          return acc;
        }, {});
        setProjectPanels(panelsData);

        // Fetch the projects next
        api
          .get("projects/")
          .then((response) => {
            console.log("Projects", response.data);

            const flattened = response.data.flatMap((project) => {
              return project.assigned_to.map((student) => ({
                ...project,
                student_fullname: student.full_name,
                student_username: student.username,
                student: student,
              }));
            });

            const filtered = flattened.filter((project) =>
              project.title.toLowerCase().includes(searchTerm.toLowerCase())
            );

            // Filter projects based on user's membership in the panel
            const userProjects = filtered.filter(
              (project) =>
                panelsData[project.id] &&
                panelsData[project.id][project.student.id] &&
                panelsData[project.id][project.student.id].panels.some(
                  (panel) => panel.id === user.id
                )
            );

            // Fetch presentation schedules
            api
              .get("/presentation-schedule/")
              .then((response) => {
                setPresentationSchedules(response.data);

                // Now that we have the presentation schedules, sort the userProjects
                const sortedUserProjects = userProjects.sort((a, b) => {
                  const scheduleA = response.data.find(
                    (s) =>
                      s.project.id === a.id && s.student.id === a.student.id
                  );
                  const scheduleB = response.data.find(
                    (s) =>
                      s.project.id === b.id && s.student.id === b.student.id
                  );

                  const dateTimeA = scheduleA
                    ? new Date(
                        scheduleA.date + "T" + scheduleA.start_time + "Z"
                      )
                    : new Date(0);
                  const dateTimeB = scheduleB
                    ? new Date(
                        scheduleB.date + "T" + scheduleB.start_time + "Z"
                      )
                    : new Date(0);

                  return dateTimeA - dateTimeB;
                });

                // Set the sorted projects into state
                setProjects(sortedUserProjects);
              })
              .catch((error) => {
                console.error(
                  "Error fetching presentation schedules:",
                  error.response.data
                );
              });
          })
          .catch((error) => {
            console.error("Error fetching projects:", error.response.data);
          });
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = projects.filter((project) =>
      project.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [searchTerm, projects]);

  const extractHourAndMinute = (timeString) => {
    const dateObj = new Date(`1970-01-01T${timeString}Z`); // Using a dummy date to parse the time
    const hours = String(dateObj.getUTCHours()).padStart(2, "0");
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleAlertOpen = (message, severity = "success") => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
    setTimeout(() => {
      setAlertOpen(false);
    }, 1500);
  };

  const handleAlertClose = () => {
    setAlertOpen(false);
  };

  const handleDeleteAlertClose = () => {
    setDeleteAlert((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAvailabilityModal = async () => {
    await fetchPanelTimeRanges();
    setAvailabilityModalOpen(true);
  };

  const handleCloseAvailabilityModal = () => {
    setSelectedTimeSlots({});
    setAvailabilityModalOpen(false);
  };

  const handleSaveAvailability = async () => {
    const saveOrUpdatePromises = [];
    const deletePromises = [];

    Object.entries(selectedTimeSlots).forEach(([date, slotIds]) => {
      if (slotIds.length > 0) {
        // Save or update slots
        saveOrUpdatePromises.push(
          api.post("/time_range/", {
            panel_id: user?.id,
            date: date,
            time_slots: slotIds,
          })
        );
      } else {
        // Check if the date has been previously fetched and stored and now has no slots selected
        const wasDateFetchedAndSaved = existingDates.some(
          (d) => formatDateToYYYYMMDD(d.date) === date
        );
        const hasNoSlotsSelected =
          !selectedTimeSlots[date] || selectedTimeSlots[date].length === 0;
        if (wasDateFetchedAndSaved && hasNoSlotsSelected) {
          // Only delete if the date was previously fetched/saved and now has no slots selected
          deletePromises.push(api.delete(`/time_range/?date=${date}`));
        }
      }
    });

    try {
      await Promise.all([...saveOrUpdatePromises, ...deletePromises]);
      handleAlertOpen(
        "Time slots availability updated successfully!",
        "success"
      );
    } catch (error) {
      handleAlertOpen(
        "Time slots availability updated successfully!",
        "success"
      );
      console.error("Error while updating time slots:", error.response.data);
    } finally {
      setAvailabilityModalOpen(false);
    }
  };

  useEffect(() => {
    if (availabilityModalOpen) {
      fetchPanelTimeRanges().catch((error) => {
        console.error("Error fetching time ranges:", error);
        // Optionally, show an error message to the user
      });
    } else {
      // Reset state when modal closes
      setSelectedTimeSlots({});
      setCurrentSelectedDate(null);
    }
  }, [availabilityModalOpen]);

  const fetchPanelTimeRanges = async () => {
    try {
      const response = await api.get("/time_range/");
      let fetchedTimeRanges = {};

      response.data.forEach((timeRange) => {
        const dateStr = timeRange.date;
        if (!fetchedTimeRanges[dateStr]) {
          fetchedTimeRanges[dateStr] = [];
        }
        fetchedTimeRanges[dateStr] = timeRange.time_slots.map((timeSlot) => {
          const foundSlot = timeSlots.find(
            (slot) => slot.label === timeSlotMapping[timeSlot]
          );
          return foundSlot ? foundSlot.id : null;
        });
      });

      // Merge with unsaved, previously chosen time slots
      const mergedTimeSlots = { ...selectedTimeSlots };
      for (const [date, slots] of Object.entries(fetchedTimeRanges)) {
        if (mergedTimeSlots[date]) {
          mergedTimeSlots[date] = Array.from(
            new Set([...mergedTimeSlots[date], ...slots])
          );
        } else {
          mergedTimeSlots[date] = slots;
        }
      }

      setSelectedTimeSlots(mergedTimeSlots);
    } catch (error) {
      console.error("Error fetching time ranges:", error);
    }
  };

  const deleteTimeSlotsForDate = async (dateStr) => {
    // Check if the date is already stored in the backend
    const isDateStored =
      selectedTimeSlots[dateStr] && selectedTimeSlots[dateStr].length > 0;

    if (isDateStored) {
      try {
        await api.delete(`/time_range/?date=${dateStr}`);
        // Update the state after successful deletion from the backend
        handleAlertOpen("Time slots deleted successfully!", "success");
      } catch (error) {
        console.error(
          `Error deleting time slots for ${dateStr}:`,
          error.response.data
        );
        handleAlertOpen("Failed to delete time slots.", "error");
      }
    }
  };

  const handleDateSelection = (date) => {
    const dateStr = date.toISOString().split("T")[0];

    if (currentSelectedDate !== dateStr) {
      setSelectedDate(date);
      setCurrentSelectedDate(dateStr);

      console.log(`Selected Date: ${dateStr}`);
      console.log("Current Selected Date: ", currentSelectedDate);
      console.log("Selected Time Slots: ", selectedTimeSlots);

      // Fetch time slots for the new date only if they are not already present
      if (!selectedTimeSlots[dateStr]) {
        fetchTimeSlotsForDate(date);
      }
    } else {
      console.log(`Deselecting date: ${dateStr}`);
      setCurrentSelectedDate(null);
      setSelectedDate(null);
    }
  };

  const timeSlots = [
    { id: "1", label: "9am-11am" },
    { id: "2", label: "11am-1pm" },
    { id: "3", label: "2pm-4pm" },
    { id: "4", label: "4pm-6pm" },
  ];

  const handleTimeSlotSelection = (timeSlotId) => {
    const dateStr = currentSelectedDate;
    setSelectedTimeSlots((prevSlots) => {
      const slotsForDate = new Set(prevSlots[dateStr] || []);
      if (slotsForDate.has(timeSlotId)) {
        slotsForDate.delete(timeSlotId);
      } else {
        slotsForDate.add(timeSlotId);
      }
      return { ...prevSlots, [dateStr]: Array.from(slotsForDate) };
    });
  };

  const timeSlotMapping = {
    "09:00:00": "9am-11am",
    "11:00:00": "11am-1pm",
    "14:00:00": "2pm-4pm",
    "16:00:00": "4pm-6pm",
  };

  const fetchTimeSlotsForDate = async (date) => {
    const dateStr = date.toISOString().split("T")[0];
    try {
      const response = await api.get(`/time_range/?date=${dateStr}`);
      const fetchedTimeSlots = response.data
        .map((timeRange) =>
          timeRange.time_slots.map((timeSlot) => {
            const foundSlot = timeSlots.find(
              (slot) => slot.label === timeSlotMapping[timeSlot]
            );
            return foundSlot ? foundSlot.id : null;
          })
        )
        .flat();

      setSelectedTimeSlots((prevSlots) => ({
        ...prevSlots,
        [dateStr]: fetchedTimeSlots,
      }));
    } catch (error) {
      console.error("Error fetching time slots:", error);
    }
  };

  useEffect(() => {
    sessionStorage.setItem(
      "selectedTimeSlots",
      JSON.stringify(selectedTimeSlots)
    );
  }, [selectedTimeSlots]);

  useEffect(() => {
    const savedTimeSlots = JSON.parse(
      sessionStorage.getItem("selectedTimeSlots")
    );
    if (savedTimeSlots) {
      setSelectedTimeSlots(savedTimeSlots);
    }

    const savedDate = JSON.parse(sessionStorage.getItem("currentSelectedDate"));
    if (savedDate) {
      setCurrentSelectedDate(savedDate);
    }
  }, []);

  const fetchAvailableDates = async () => {
    try {
      const response = await api.get("/available_dates/");
      console.log("response", response);
      const fetchedDates = response.data.map((dateObj) => ({
        id: dateObj.id,
        date: new Date(dateObj.date),
      }));
      console.log("fetched data", fetchedDates);
      setAvailableDatesMap(
        fetchedDates.reduce((acc, current) => {
          acc[formatDateToYYYYMMDD(current.date)] = true;
          return acc;
        }, {})
      );
      setExistingDates(
        fetchedDates.map((d) => ({
          id: d.id,
          date: formatDateToYYYYMMDD(d.date),
        }))
      );
    } catch (error) {
      console.error("Error fetching available dates:", error);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
  }, []);

  return (
    <ThemeProvider theme={Theme}>
      <PanelNavigationBar />
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Grid item xs={12}>
            <TextField
              label="Search Project"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{
                float: "right",
                marginTop: "2rem",
                marginRight: "2.5rem",
                marginBottom: "1rem",
              }}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              startIcon={<ScheduleIcon />}
              onClick={handleOpenAvailabilityModal}
              variant="contained"
              sx={{
                float: "right",
                marginTop: "2rem",
                marginRight: "2.5rem",
                marginBottom: "1rem",
              }}
            >
              Manage Availability
            </Button>
          </Grid>
          <Box sx={{ margin: "30px", marginTop: "3rem" }}>
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <TableContainer>
                <Table stickyHeader aria-label="sticky table">
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledTableCell
                          key={column.label}
                          align={column.align}
                          style={{ minWidth: column.minWidth }}
                        >
                          <strong>
                            {column.label}
                            {column.field && (
                              <SortIcon
                                style={{
                                  verticalAlign: "middle",
                                  marginLeft: "0.2rem",
                                  fontSize: "1rem",
                                }}
                                className={
                                  sortField === column.field
                                    ? sortDirection === "asc"
                                      ? "asc"
                                      : "desc"
                                    : ""
                                }
                                onClick={() => handleSort(column.field)}
                              />
                            )}
                          </strong>
                        </StyledTableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {sortedProjects.map((row, index) => {
                      const projectNumber = index + 1;

                      // Find the schedule for this project and student
                      const schedule = presentationSchedules.find(
                        (s) =>
                          s.project.id === row.id &&
                          s.student.id === row.student.id
                      );

                      const googleMeetLink = schedule
                        ? schedule.google_meet_link
                        : "";

                      return (
                        <TableRow key={index}>
                          <TableCell>{projectNumber}</TableCell>
                          <TableCell>{row.title}</TableCell>
                          <TableCell>{row.student_fullname}</TableCell>
                          <TableCell>{row.student_username}</TableCell>
                          {/* <TableCell>{row.created_by.full_name}</TableCell> */}
                          <TableCell>
                            {schedule
                              ? `${new Date(schedule.date).getDate()}/${
                                  new Date(schedule.date).getMonth() + 1
                                }/${new Date(
                                  schedule.date
                                ).getFullYear()} (${new Date(
                                  schedule.date
                                ).toLocaleDateString(undefined, {
                                  weekday: "short",
                                })})`
                              : ""}
                          </TableCell>
                          <TableCell
                            dangerouslySetInnerHTML={{
                              __html: schedule
                                ? `${extractHourAndMinute(
                                    schedule.start_time
                                  )} - ${extractHourAndMinute(
                                    schedule.end_time
                                  )}`
                                : "",
                            }}
                          ></TableCell>

                          <TableCell style={{ width: "10%" }}>
                            {" "}
                            {googleMeetLink && (
                              <a
                                href={googleMeetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {googleMeetLink}
                              </a>
                            )}
                          </TableCell>
                          <TableCell>
                            {projectPanels[row.id] &&
                            projectPanels[row.id][row.student.id] &&
                            projectPanels[row.id][row.student.id].panels
                              ? projectPanels[row.id][row.student.id].panels
                                  .slice()
                                  .sort((a, b) =>
                                    a.id === user.id
                                      ? -1
                                      : b.id === user.id
                                      ? 1
                                      : 0
                                  )
                                  .map((panel, idx) => (
                                    <span
                                      key={idx}
                                      style={{
                                        display: "block",
                                        backgroundColor:
                                          panel.id === user.id
                                            ? "#eeeeee"
                                            : "transparent",
                                        padding: "0.5em",
                                        borderRadius: "7px",
                                      }}
                                    >
                                      {panel.full_name}
                                    </span>
                                  ))
                              : null}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Box>
        </Grid>
      </Grid>
      <Modal
        open={availabilityModalOpen}
        onClose={handleCloseAvailabilityModal}
        aria-labelledby="availability-modal-title"
      >
        <Box
          sx={{
            position: "relative",
            margin: "20px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "4px",
            backgroundColor: "background.paper",
            maxHeight: "80vh",
            overflowY: "auto",
            "&::-webkit-scrollbar": {
              width: "0.4em",
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: "rgba(0,0,0,0.1)",
              borderRadius: "4px",
            },
            boxShadow: 1,
            width: "auto",
            maxWidth: "600px",
            mx: "auto",
          }}
        >
          <IconButton
            aria-label="close"
            onClick={handleCloseAvailabilityModal}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
          <Typography
            variant="h5"
            component="h2"
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            Set Your Availability
          </Typography>

          <Divider />

          <Grid container spacing={3}>
            <Box sx={{ margin: "20px", marginTop: "2rem" }}>
              <Typography variant="h6">Choose the Date:</Typography>
              <Box
                sx={{ display: "flex", gap: 2, flexWrap: "wrap", marginTop: 2 }}
              >
                {Array.isArray(existingDates) &&
                  existingDates
                    .sort((a, b) => new Date(a.date) - new Date(b.date))
                    .map((dateObj, index) => {
                      const date = new Date(dateObj.date);
                      const day = date.toLocaleDateString("en-US", {
                        weekday: "short",
                      });
                      const dateStr = formatDateToYYYYMMDD(date);
                      const isSelected = currentSelectedDate === dateStr;

                      return (
                        <Button
                          key={index}
                          variant={isSelected ? "contained" : "outlined"}
                          sx={{
                            color: isSelected ? "white" : "black",
                            backgroundColor: isSelected
                              ? theme.palette.primary.main
                              : "transparent",
                            borderColor: isSelected
                              ? theme.palette.primary.main
                              : "black",
                          }}
                          onClick={() => handleDateSelection(date)}
                        >
                          {`${dateStr} (${day})`}
                        </Button>
                      );
                    })}
              </Box>
            </Box>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {currentSelectedDate && (
            <>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Available Time Slots for {selectedDate.toLocaleDateString()}:
                <Typography variant="body2" color="textSecondary">
                  (You can select multiple time slots)
                </Typography>
              </Typography>

              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                {timeSlots.map((slot) => {
                  const isSelected = selectedTimeSlots[
                    currentSelectedDate
                  ]?.includes(slot.id);
                  return (
                    <Button
                      key={slot.id}
                      variant={isSelected ? "contained" : "outlined"}
                      sx={{
                        color: isSelected ? "white" : "black",
                        borderColor: isSelected ? "white" : "black",
                      }}
                      onClick={() => handleTimeSlotSelection(slot.id)}
                    >
                      {slot.label}
                    </Button>
                  );
                })}
              </Box>
            </>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end", // Aligns button to the right
              mt: 5,
              mb: 2,
              gap: 2,
            }}
          >
            <Button
              onClick={handleCloseAvailabilityModal}
              variant="text"
              color="primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveAvailability}
              variant="text"
              color="primary"
            >
              Save
            </Button>
          </Box>

          {deleteAlert.open && (
            <Alert
              severity={deleteAlert.severity}
              onClose={handleDeleteAlertClose}
              sx={{
                position: "fixed",
                bottom: "20%",
                left: "50%",
                transform: "translateX(-50%)",
                boxShadow: 3,
                width: "auto",
                maxWidth: "90%",
                zIndex: (theme) => theme.zIndex.tooltip + 1,
              }}
            >
              {deleteAlert.message}
            </Alert>
          )}
        </Box>
      </Modal>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.modal + 1 }}
        open={alertOpen}
      >
        <Alert
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{
            boxShadow: 24,
            p: 2,
            minWidth: "20%",
            display: "flex",
            zIndex: 999999,
          }}
        >
          {alertMessage}
        </Alert>
      </Backdrop>
    </ThemeProvider>
  );
}
