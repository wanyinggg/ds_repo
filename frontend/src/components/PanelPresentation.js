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
  List,
  ListItem,
  IconButton,
  Alert,
  Backdrop,
} from "@mui/material";
import {
  LocalizationProvider,
  DatePicker,
  TimePicker,
} from "@mui/x-date-pickers";
import PickersDay, { pickersDayClasses } from "@mui/lab/PickersDay";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import SortIcon from "@mui/icons-material/Sort";
import CloseIcon from "@mui/icons-material/Close";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import DeleteIcon from "@mui/icons-material/Delete";
import ScheduleIcon from "@mui/icons-material/Schedule";
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

export default function PanelHome() {
  const [projectPanels, setProjectPanels] = useState({});
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [presentationSchedules, setPresentationSchedules] = useState([]);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [alert, setAlert] = useState(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const [selectedDate, setSelectedDate] = React.useState(new Date());
  const [availability, setAvailability] = useState({});
  const [deleteAlert, setDeleteAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

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

  const handleDeleteAlertOpen = (message, severity = "success") => {
    setDeleteAlert({ open: true, message, severity });
    setTimeout(() => {
      setDeleteAlert((prev) => ({ ...prev, open: false }));
    }, 1500);
  };

  const handleDeleteAlertClose = () => {
    setDeleteAlert((prev) => ({ ...prev, open: false }));
  };

  const handleOpenAvailabilityModal = async () => {
    await fetchPanelTimeRanges();
    setAvailabilityModalOpen(true);
  };

  const handleCloseAvailabilityModal = () => {
    setAvailabilityModalOpen(false);
  };

  const handleDateChange = (date) => {
    const utcDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    setSelectedDate(utcDate);
    console.log("Selected UTC date:", utcDate);
  };

  const handleTimeRangeChange = (date, index, time, isStartTime) => {
    const times = availability[date] || [];
    if (isStartTime) {
      times[index] = { ...times[index], startTime: time };
    } else {
      times[index] = { ...times[index], endTime: time };
    }
    setAvailability({ ...availability, [date]: times });
  };

  const addTimeSlot = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const times = availability[dateStr] || [];
    setAvailability({ ...availability, [dateStr]: [...times, new Date()] });
  };

  const renderTimeRangePickers = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const times = availability[dateStr] || [];
    return times.map((timeRange, index) => (
      <Box key={index} sx={{ display: "flex", gap: 2, mb: 2 }}>
        <ThemeProvider theme={theme}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label={`Start Time ${index + 1}`}
              value={timeRange.startTime}
              onChange={(newValue) =>
                handleTimeRangeChange(dateStr, index, newValue, true)
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
              slotProps={{
                textField: ({}) => ({
                  color: "secondary",
                }),
                popper: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      "&.Mui-selected": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiButton-root": {
                      color: "#8950fc",
                    },
                    "& .MuiTouchRipple-root": {
                      color: "#bb99ff",
                    },
                    "& .MuiDialogActions-root .MuiButton-text": {
                      color: "#8950fc",
                    },
                  },
                },
                actionBar: {
                  sx: {
                    ".MuiButton-root.MuiButton-text.MuiButton-textPrimary": {
                      color:
                        "#8950fc !important" /* Using !important to ensure override */,
                    },
                  },
                },
                layout: {
                  sx: {
                    "& .MuiClock-pin": {
                      backgroundColor: "#8950fc",
                      "&::after": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiClockPointer-root": {
                      backgroundColor: "#8950fc",
                      "&::after": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiClockPointer-thumb": {
                      borderColor: "#8950fc !important",
                      "&::after": {
                        borderColor: "#8950fc !important",
                      },
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <TimePicker
              label={`End Time ${index + 1}`}
              value={timeRange.endTime}
              onChange={(newValue) =>
                handleTimeRangeChange(dateStr, index, newValue, false)
              }
              renderInput={(params) => <TextField {...params} fullWidth />}
              slotProps={{
                textField: ({}) => ({
                  color: "secondary",
                }),
                popper: {
                  sx: {
                    "& .MuiMenuItem-root": {
                      "&.Mui-selected": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiButton-root": {
                      color: "#8950fc",
                    },
                    "& .MuiTouchRipple-root": {
                      color: "#bb99ff",
                    },
                  },
                },
                actionBar: {
                  sx: {
                    ".MuiButton-root.MuiButton-text.MuiButton-textPrimary": {
                      color:
                        "#8950fc !important" /* Using !important to ensure override */,
                    },
                  },
                },
                layout: {
                  sx: {
                    "& .MuiClock-pin": {
                      backgroundColor: "#8950fc",
                      "&::after": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiClockPointer-root": {
                      backgroundColor: "#8950fc",
                      "&::after": {
                        backgroundColor: "#8950fc",
                      },
                    },
                    "& .MuiClockPointer-thumb": {
                      borderColor: "#8950fc !important",
                      "&::after": {
                        borderColor: "#8950fc !important",
                      },
                    },
                  },
                },
              }}
            />
          </LocalizationProvider>
          <IconButton
            aria-label="remove"
            onClick={() => removeTimeSlot(date, index)}
            sx={{ color: "red" }}
          >
            <DeleteIcon />
          </IconButton>
        </ThemeProvider>
      </Box>
    ));
  };

  const formatTime = (date) => {
    return `${String(date.getHours()).padStart(2, "0")}:${String(
      date.getMinutes()
    ).padStart(2, "0")}`;
  };

  const handleSaveAvailability = async () => {
    for (const [date, times] of Object.entries(availability)) {
      for (const timeSlot of times) {
        const startTimeFormatted = formatTime(timeSlot.startTime);
        const endTimeFormatted = formatTime(timeSlot.endTime);
        const timeslotData = {
          date: date,
          start_time: startTimeFormatted,
          end_time: endTimeFormatted,
          panel_id: user?.id,
        };

        if (timeSlot.id) {
          // If the time slot has an ID, it's an existing time slot, so update it
          try {
            await api.put(`/time_range/${timeSlot.id}/`, timeslotData);
            handleAlertOpen("Time slots are successfully updated.");
          } catch (error) {
            console.error("Error updating timeslot:", error.response.data);
          }
        } else {
          // If the time slot does not have an ID, it's a new time slot, so create it
          try {
            await api.post("/time_range/", timeslotData);
            handleAlertOpen("Time slots are successfully created.");
          } catch (error) {
            console.error("Error creating timeslot:", error.response.data);
          }
        }
      }
    }

    // After saving, fetch the updated time slots and close the modal
    await fetchPanelTimeRanges();
    setAvailabilityModalOpen(false);
  };

  const fetchPanelTimeRanges = async () => {
    try {
      const response = await api.get("/time_range/");
      const fetchedTimeRanges = response.data.reduce((acc, timeRange) => {
        const { date, start_time, end_time } = timeRange;
        const startTime = new Date(date + "T" + start_time);
        const endTime = new Date(date + "T" + end_time);

        if (!acc[date]) {
          acc[date] = [];
        }

        acc[date].push({ startTime, endTime, id: timeRange.id });
        return acc;
      }, {});

      setAvailability(fetchedTimeRanges);
    } catch (error) {
      console.error("Error fetching time ranges:", error);
    }
  };

  const removeTimeSlot = async (date, index) => {
    const dateStr = date.toISOString().split("T")[0];
    const times = availability[dateStr];

    if (!times) return; // If no time slots, nothing to delete

    const timeSlotToDelete = times[index];

    if (timeSlotToDelete && timeSlotToDelete.id) {
      try {
        await api.delete(`/time_range/${timeSlotToDelete.id}/`);
        console.log(`Time slot ${timeSlotToDelete.id} deleted successfully.`);
        handleDeleteAlertOpen("Time slot deleted successfully.");
      } catch (error) {
        console.error("Error deleting time slot:", error.response.data);
        return;
      }
    }

    // Remove the time slot from the local state
    const updatedTimes = [...times.slice(0, index), ...times.slice(index + 1)];

    // If there are no more time slots for this date, remove the date as well
    if (updatedTimes.length === 0) {
      const newAvailability = { ...availability };
      delete newAvailability[dateStr]; // Remove the date key entirely if no time slots
      setAvailability(newAvailability);
    } else {
      // Otherwise, just update the time slots for the date
      setAvailability({ ...availability, [dateStr]: updatedTimes });
    }
  };

  const formatDateWithDay = (dateString) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const date = new Date(dateString);
    const dayName = days[date.getDay()];
    return `${dateString} (${dayName})`;
  };

  const renderWeekPickerDay = (date, selectedDates, pickersDayProps) => {
    return (
      <PickersDay
        {...pickersDayProps}
        sx={{
          [`&&.${pickersDayClasses.selected}`]: {
            backgroundColor: theme.palette.secondary.main,
            color: theme.palette.secondary.contrastText,
            "&:hover": {
              backgroundColor: theme.palette.secondary.dark,
            },
          },
        }}
      />
    );
  };

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

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  renderInput={(props) => <TextField {...props} fullWidth />}
                  label="Select Date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  renderDay={renderWeekPickerDay}
                  slotProps={{
                    textField: ({}) => ({
                      color: "secondary",
                    }),
                    day: {
                      sx: {
                        "&.MuiPickersDay-root.Mui-selected": {
                          backgroundColor: "#8950fc",
                        },
                      },
                    },
                    actionBar: {
                      sx: {
                        ".MuiButton-root.MuiButton-text.MuiButton-textPrimary":
                          {
                            color:
                              "#8950fc !important" /* Using !important to ensure override */,
                          },
                      },
                    },
                  }}
                />
              </LocalizationProvider>

              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={() => addTimeSlot(selectedDate)}
                variant="contained"
                color="primary"
                sx={{ marginLeft: "0.1em", marginTop: "0.5em" }}
              >
                Add Time Slot
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <List>
            {Object.keys(availability)
              .sort((a, b) => new Date(a) - new Date(b))
              .map((date, index) => (
                <ListItem key={index} sx={{ mb: 2, ml: -1 }}>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Date: {formatDateWithDay(date)}
                    </Typography>
                    {renderTimeRangePickers(new Date(date))}
                  </Box>
                </ListItem>
              ))}
          </List>

          <Button
            onClick={handleSaveAvailability}
            variant="contained"
            color="primary"
            sx={{ mt: 2, mb: 2 }}
          >
            Save Availability
          </Button>
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
              }}
            >
              {deleteAlert.message}
            </Alert>
          )}
        </Box>
      </Modal>
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
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
          }}
        >
          {alertMessage}
        </Alert>
      </Backdrop>
    </ThemeProvider>
  );
}
