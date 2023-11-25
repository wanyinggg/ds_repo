import React from "react";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Grid,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Backdrop,
  Typography,
  ListItem,
  ListItemText,
  List,
  IconButton,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import CloseIcon from "@mui/icons-material/Close";
import { useEffect, useState } from "react";
import CoordinatorNavigationBar from "./reusable/CoordinatorNavigationBar";
import { tableCellClasses } from "@mui/material/TableCell";
import { createTheme, ThemeProvider, styled } from "@mui/material/styles";
import api from "./axios";
import CircularProgress from "@mui/material/CircularProgress";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";

function MyCalendarComponent({
  onChange,
  value,
  datesWithRecommendedSlotsMap,
}) {
  function tileContent({ date, view }) {
    const dateString = date.toDateString();
  
    if (
      view === "month" &&
      datesWithRecommendedSlotsMap.has(dateString) &&
      datesWithRecommendedSlotsMap.get(dateString)
    ) {
      return (
        <div
          style={{
            backgroundColor: "#D6EAF8",
            borderRadius: "50%",
            color: "#21618C",
            width: "100%",
            height: "100%",
          }}
        ></div>
      );
    }
  
    return null;
  }
  

  return (
    <>
      <style>
        {`.react-calendar__tile--active,
          .react-calendar__tile--hasActive {
          background-color: #8950fc !important;
          color: white !important; 
        }`}
      </style>
      <Calendar
        onChange={onChange}
        value={value}
        tileContent={tileContent}
      />
    </>
  );
}

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

export default function ProgramCoordinatorSchedulling() {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("");
  const [sortDirection, setSortDirection] = useState("asc");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [projects, setProjects] = useState([]);
  const [supervisorList, setSupervisorList] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [projectPanels, setProjectPanels] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [duration, setDuration] = useState(15);
  const [presentationSchedules, setPresentationSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [programCoordinatorId, setProgramCoordinatorId] = useState(null);
  const [alert, setAlert] = useState(null);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");
  const [availability, setAvailability] = useState([]);
  const [isTimeslotSelected, setIsTimeslotSelected] = useState(false);
  const [recommendedSlots, setRecommendedSlots] = useState([]);
  const [datesWithRecommendedSlotsMap, setDatesWithRecommendedSlotsMap] =
    useState(new Map());
  const [customDate, setCustomDate] = useState(null);
  const [customTime, setCustomTime] = useState(null);
  const [selectedDatesWithRecommendedSlotsMap, setSelectedDatesWithRecommendedSlotsMap] = useState(new Map());

  const storedUser =
    sessionStorage.getItem("user") || localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  const columns = [
    { label: "No." },
    { label: "Project Title", field: "title" },
    { label: "Student", field: "assigned_to" },
    { label: "Matric Number", field: "matric" },
    { label: "Panels" },
    { label: "Timeslot", field: "timeslot" },
    { label: "Google Meet Link" },
    { label: "Arrange Timeslot" },
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
    if (sortField === "timeslot") {
      const scheduleA = presentationSchedules.find(
        (s) => s.project.id === a.id && s.student.id === a.student.id
      );
      const scheduleB = presentationSchedules.find(
        (s) => s.project.id === b.id && s.student.id === b.student.id
      );

      const dateTimeA = scheduleA
        ? new Date(scheduleA.date + "T" + scheduleA.start_time + "Z")
        : new Date(0);
      const dateTimeB = scheduleB
        ? new Date(scheduleB.date + "T" + scheduleB.start_time + "Z")
        : new Date(0);

      return sortDirection === "asc"
        ? dateTimeA - dateTimeB
        : dateTimeB - dateTimeA;
    } else if (sortField === "assigned_to") {
      fieldA = a.student_fullname; // Using the flattened property
      fieldB = b.student_fullname; // Using the flattened property
    } else if (sortField === "created_by") {
      fieldA = fieldA.full_name;
      fieldB = fieldB.full_name;
    } else if (sortField === "matric") {
      fieldA = a.student_username.match(/\d+/)
        ? parseInt(a.student_username.match(/\d+/)[0], 10)
        : 0;
      fieldB = b.student_username.match(/\d+/)
        ? parseInt(b.student_username.match(/\d+/)[0], 10)
        : 0;

      return sortDirection === "asc" ? fieldA - fieldB : fieldB - fieldA;
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

  const paginatedProjects = sortedProjects.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const fetchData = () => {
    // Fetch projects
    api
      .get("projects/")
      .then((response) => {
        console.log("Projects", response.data);
        setProjects(response.data);

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

        setFilteredProjects(filtered);
      })
      .catch((error) => {
        console.error("Error fetching projects:", error.response.data);
      });

    // Fetch the panels
    api.get("student_project_panel/?role=coordinator").then((response) => {
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
    });

    // Fetch presentation schedules
    api.get("/presentation-schedule/").then((response) => {
      // Sort the schedules by date and time in ascending order (earliest first)
      console.log(
        "Before sorting:",
        response.data.map(
          (schedule) => new Date(schedule.date + "T" + schedule.start_time)
        )
      );
      const sortedSchedules = response.data.sort((a, b) => {
        const dateTimeA = new Date(a.date + "T" + a.start_time);
        const dateTimeB = new Date(b.date + "T" + b.start_time);
        return dateTimeA - dateTimeB;
      });
      console.log(
        "After sorting:",
        sortedSchedules.map(
          (schedule) => new Date(schedule.date + "T" + schedule.start_time)
        )
      );

      setPresentationSchedules(sortedSchedules);
    });

    // Fetch program coordinator information
    api
      .get("/users/")
      .then((response) => {
        const coordinator = response.data.filter((user) =>
          user.groups.includes(4)
        );
        setProgramCoordinatorId(coordinator[0].id);
      })

      .catch((error) => {
        console.error(
          "Error fetching program coordinator:",
          error.response.data
        );
      });
  };

  useEffect(() => {
    fetchData();
  }, [searchTerm]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedDatesWithRecommendedSlotsMap(new Map());
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

  const fetchSupervisors = () => {
    api
      .get(`/users/`)
      .then((response) => {
        const supervisors = response.data.filter((user) =>
          user.groups.includes(2)
        );
        setSupervisorList(supervisors);
        console.log(supervisors);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    fetchSupervisors();
  }, []);

  const convertDurationToMinutes = (duration) => {
    const [hours, minutes] = duration.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const handleOpenArrangeDialog = (project) => {
    setSelectedProjectId(project.id);
    setSelectedStudent(project.student);

    // Find the schedule for this project and student
    const existingSchedule = presentationSchedules.find(
      (s) => s.project.id === project.id && s.student.id === project.student.id
    );

    // If a schedule exists, set the state values based on the existing schedule
    if (existingSchedule) {
      setSelectedDate(new Date(existingSchedule.date));

      // Manually parse the hours and minutes
      const [hours, minutes] = existingSchedule.start_time.split(":");
      const newTime = new Date();
      newTime.setHours(parseInt(hours, 10));
      newTime.setMinutes(parseInt(minutes, 10));
      setSelectedTime(newTime);

      setDuration(convertDurationToMinutes(existingSchedule.duration));
    } else {
      // Reset to default values if no existing schedule
      setSelectedDate(new Date());
      setSelectedTime(new Date());
      setDuration(15);
    }

    // Generate the map for the selected project and student
    const newMap = generateDatesWithRecommendedSlotsMap(project.id, project.student.id);
    setSelectedDatesWithRecommendedSlotsMap(newMap);
    setOpenDialog(true);
  };

  const extractHourAndMinute = (timeString) => {
    const dateObj = new Date(`1970-01-01T${timeString}Z`); // Using a dummy date to parse the time
    const hours = String(dateObj.getUTCHours()).padStart(2, "0");
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  function generateCSV() {
    const data = paginatedProjects.map((row, index) => {
      const projectNumber = index + 1;

      const schedule = presentationSchedules.find(
        (s) => s.project.id === row.id && s.student.id === row.student.id
      );

      const googleMeetLink = schedule ? schedule.google_meet_link : "";

      const date = schedule ? new Date(schedule.date).toLocaleDateString() : "";
      const time = schedule
        ? `${extractHourAndMinute(
            schedule.start_time
          )} - ${extractHourAndMinute(schedule.end_time)}`
        : "";

      const panels =
        projectPanels[row.id] &&
        projectPanels[row.id][row.student.id] &&
        projectPanels[row.id][row.student.id].panels
          ? projectPanels[row.id][row.student.id].panels
              .map((panel) => panel.full_name)
              .join(", ")
          : "";

      return {
        No: projectNumber,
        "Project Title": row.title,
        Student: row.student_fullname,
        Supervisor: row.created_by.full_name,
        Panels: panels,
        Date: date,
        Time: time,
        "Google Meet Link": googleMeetLink,
      };
    });

    // Generate CSV
    const replacer = (key, value) => (value === null ? "" : value);
    const header = Object.keys(data[0]);
    const csv = [
      header.join(","),
      ...data.map((row) =>
        header
          .map((fieldName) => JSON.stringify(row[fieldName], replacer))
          .join(",")
      ),
    ].join("\r\n");

    // Create Blob and initiate the download
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.setAttribute("download", "data.csv");
    link.href = window.URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const fetchPanelTimeRanges = async () => {
    try {
      const response = await api.get("/time_range/?role=coordinator");
      // Make sure the response is an array before setting the state
      if (Array.isArray(response.data)) {
        setAvailability(response.data);
      } else {
        // If not an array, log an error or set it to an empty array
        console.error("Received data is not an array: ", response.data);
        setAvailability([]);
      }
      console.log(response.data);
    } catch (error) {
      console.error("Error fetching time ranges:", error);
    }
  };

  useEffect(() => {
    fetchPanelTimeRanges();
  }, []); // Dependency array is empty to run only once on mount

  const isTimeslotBooked = (timeslot) => {
    const startTime = new Date(timeslot);
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + duration); // Assuming duration is 15 minutes

    return presentationSchedules.some((schedule) => {
        const scheduleStartTime = new Date(schedule.date + "T" + schedule.start_time);
        const scheduleEndTime = new Date(schedule.date + "T" + schedule.end_time);

        // Check for any overlap
        return (startTime < scheduleEndTime && endTime > scheduleStartTime);
    });
};


  const handleTimeslotSelection = (timeslot) => {
    const [hours, minutes] = timeslot.split(":").map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
  
    const endTime = new Date(startTime);
    endTime.setMinutes(startTime.getMinutes() + 15);

    // Reset custom date and time when an available timeslot is selected
    setCustomDate(null);
    setCustomTime(null);
  
    // Check if the clicked timeslot is already selected
    if (selectedTime && selectedTime.formattedStartTime === timeslot) {
      // If already selected, deselect it
      setIsTimeslotSelected(false);
      setSelectedTime(null);
    } else {
      // If not selected, update the selection
      setIsTimeslotSelected(true);
      setSelectedTime({
        startTime: startTime,
        endTime: endTime,
        formattedStartTime: timeslot,
      });
    }
  };
  

const handleTimeslotConfirmation = async () => {
    setLoading(true);

    // Use custom date and time if provided, else use the selected values
    const scheduledDate = customDate || selectedDate.toISOString().split("T")[0];
    const scheduledTime = customTime || selectedTime.formattedStartTime;

    const currentPanelsData =
        projectPanels[selectedProjectId] &&
        projectPanels[selectedProjectId][selectedStudent.id];
    const panelIds = currentPanelsData
        ? currentPanelsData.panels.map((panel) => panel.id)
        : [];

    const postData = {
        student_id: selectedStudent.id,
        project_id: selectedProjectId,
        programCoordinator_id: programCoordinatorId,
        date: scheduledDate,
        start_time: scheduledTime,
        duration: "00:15:00", //fixed 15 minutes duration
        panels_id: panelIds,
    };

    try {
        let response;
        const existingSchedule = presentationSchedules.find(
            (s) =>
                s.project.id === selectedProjectId &&
                s.student.id === selectedStudent.id
        );

        if (existingSchedule) {
            response = await api.patch(
                `/presentation-schedule/${existingSchedule.id}/`,
                postData
            );
        } else {
            response = await api.post("/presentation-schedule/", postData);
        }

        console.log("Schedule updated/created:", response.data);
        handleAlertOpen("Presentation schedule updated successfully!", "success");
        fetchData(); // Refresh data after update

        // Clear custom date and time after successful update
        setCustomDate(null);
        setCustomTime(null);
    } catch (error) {
        console.error("Error updating/creating schedule:", error.response.data);
        handleAlertOpen(
            "Error updating/creating schedule. Please try again.",
            "error"
        );
    } finally {
        setLoading(false);
        handleCloseDialog();
    }
};


const handleDateChange = (newDate) => {
  const utcDate = new Date(
    Date.UTC(newDate.getFullYear(), newDate.getMonth(), newDate.getDate())
  );
  setSelectedDate(utcDate);
  console.log("Selected UTC date:", utcDate);

  // Update the state with recommended slots for the selected date
  const newRecommendedSlots = generateRecommendedTimeslots(newDate);
  setRecommendedSlots(newRecommendedSlots);

  // Use the state callback function to ensure the most up-to-date state
  setSelectedDatesWithRecommendedSlotsMap((prevMap) => {
    // Fetch data and update the state based on the previous state
    const newMap = generateDatesWithRecommendedSlotsMap(
      selectedProjectId,
      selectedStudent.id
    );
    return newMap;
  });
};



  const generateRecommendedTimeslots = (date) => {
    const dateString = date.toISOString().split("T")[0];
    const panelData = projectPanels[selectedProjectId]?.[selectedStudent.id];
  
    if (!panelData || panelData.panels.length === 0) {
      console.error("No panels assigned for the selected student");
      return [];
    }
  
    const assignedPanelIds = panelData.panels.map(panel => panel.id);
    const dayAvailability = availability.filter(
      item => item.date === dateString && assignedPanelIds.includes(item.panel.id)
    );
  
    // Create a list of all time ranges for each panel
    let timeRangesForPanels = assignedPanelIds.map(panelId => {
      return dayAvailability
        .filter(item => item.panel.id === panelId)
        .map(item => ({
          startTime: new Date(item.date + 'T' + item.start_time),
          endTime: new Date(item.date + 'T' + item.end_time)
        }));
    });
  
    // Find overlapping time slots
    let overlappingSlots = [];
    timeRangesForPanels[0].forEach(range1 => {
      timeRangesForPanels[1].forEach(range2 => {
        // Check if there's an overlap
        let start = new Date(Math.max(range1.startTime, range2.startTime));
        let end = new Date(Math.min(range1.endTime, range2.endTime));
        if (start < end) {
          // Now, break this time range into 15-minute slots and add to overlappingSlots
          let current = new Date(start);
          while (current < end) {
            overlappingSlots.push(new Date(current));
            current = new Date(current.setMinutes(current.getMinutes() + 15));
          }
        }
      });
    });
  
    // Filter out booked slots and format the times
    return overlappingSlots.filter(slot => !isTimeslotBooked(slot)).map(slot => {
      const hours = slot.getHours().toString().padStart(2, '0');
      const minutes = slot.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    });
  };
  

const generateDatesWithRecommendedSlotsMap = (projectId, studentId) => {
  let newMap = new Map();
  const panelData = projectPanels[projectId]?.[studentId];

  if (panelData && panelData.panels.length > 0) {
    availability.forEach((item) => {
      const date = new Date(item.date);
      const recommendedSlots = generateRecommendedTimeslots(date, panelData.panels);
      if (recommendedSlots.length > 0) {
        newMap.set(date.toDateString(), true);
      }
    });
  }
  return newMap;
};

useEffect(() => {
  if (selectedProjectId !== null && selectedStudent !== null) {
    // Fetch the data and update the selectedDatesWithRecommendedSlotsMap
    const newMap = generateDatesWithRecommendedSlotsMap(selectedProjectId, selectedStudent.id);
    setSelectedDatesWithRecommendedSlotsMap(newMap);
    // Fetch other necessary data here if needed
  }
}, [selectedProjectId, selectedStudent]);



  return (
    <ThemeProvider theme={theme}>
      <CoordinatorNavigationBar />
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
          <Box sx={{ margin: "30px", marginTop: "0.2rem" }}>
            <Paper sx={{ width: "100%", overflow: "hidden" }}>
              <Grid container justifyContent="flex-end"></Grid>
              <TableContainer>
                <Table
                  stickyHeader
                  aria-label="sticky table"
                  id="presentation_schedule_table"
                >
                  <TableHead>
                    <TableRow>
                      {columns.map((column) => (
                        <StyledTableCell
                          key={column.id}
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
                    {paginatedProjects.map((row, index) => {
                      const projectNumber = index + 1;
                      // Find the schedule for this project and student
                      const schedule = presentationSchedules.find(
                        (s) =>
                          s.project.id === row.id &&
                          s.student.id === row.student.id
                      );
                      const timeslot = schedule
                        ? new Date(schedule.date).toLocaleDateString() +
                          " " +
                          schedule.start_time +
                          " - " +
                          schedule.end_time
                        : "";

                      const googleMeetLink = schedule
                        ? schedule.google_meet_link
                        : "";
                      return (
                        <StyledTableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={`${row.id}-${index}`}
                        >
                          <StyledTableCell>{projectNumber}</StyledTableCell>
                          <StyledTableCell>{row.title}</StyledTableCell>
                          <StyledTableCell>
                            {row.student_fullname}
                          </StyledTableCell>
                          <StyledTableCell>
                            {row.student_username}
                          </StyledTableCell>
                          <StyledTableCell>
                            {projectPanels[row.id] &&
                            projectPanels[row.id][row.student.id] &&
                            projectPanels[row.id][row.student.id].panels
                              ? projectPanels[row.id][
                                  row.student.id
                                ].panels.map((panel, idx, arr) => (
                                  <span key={idx}>
                                    {panel.full_name}
                                    {idx !== arr.length - 1 ? ", " : ""}
                                    <br />
                                  </span>
                                ))
                              : null}
                          </StyledTableCell>

                          <StyledTableCell
                            dangerouslySetInnerHTML={{
                              __html: schedule
                                ? `${new Date(
                                    schedule.date
                                  ).toLocaleDateString()} 
         (${new Date(schedule.date).toLocaleDateString(undefined, {
           weekday: "short",
         })}) <br> 
         ${extractHourAndMinute(schedule.start_time)} - 
         ${extractHourAndMinute(schedule.end_time)}`
                                : "",
                            }}
                          ></StyledTableCell>

                          <StyledTableCell style={{ width: "10%" }}>
                            {googleMeetLink && (
                              <a
                                href={googleMeetLink}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {googleMeetLink}
                              </a>
                            )}
                          </StyledTableCell>

                          <StyledTableCell>
                            <Button
                              onClick={() => handleOpenArrangeDialog(row)}
                              variant="text"
                            >
                              {timeslot && googleMeetLink
                                ? "Re-arrange"
                                : "Arrange"}
                            </Button>
                          </StyledTableCell>
                        </StyledTableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[10, 25, 100]}
                component="div"
                count={filteredProjects.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </Paper>
          </Box>
          <Button
            onClick={generateCSV}
            variant="contained"
            color="primary"
            sx={{ marginLeft: "30px", marginBottom: "20px" }}
          >
            Generate csv
          </Button>
        </Grid>
      </Grid>
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth={false}
        fullWidth
        PaperProps={{
          style: {
            width: "fit-content",
            maxWidth: "none",
            margin: "0 auto",
          },
        }}
      >
        <DialogTitle
          id="assign-panels-dialog-title"
          sx={{
            bgcolor: "primary.light",
            color: "common.white",
            position: "relative",
          }}
        >
          Presentation Timeslot
          <IconButton
            aria-label="close"
            onClick={handleCloseDialog}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon sx={{ color: "white" }} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom style={{ marginTop: "15px" }}>
            Select a Date
          </Typography>
          {datesWithRecommendedSlotsMap && (
            <MyCalendarComponent
              onChange={handleDateChange}
              value={selectedDate}
              datesWithRecommendedSlotsMap={selectedDatesWithRecommendedSlotsMap}
            />
          )}

          <Typography variant="h6" gutterBottom style={{ marginTop: "20px" }}>
            Available Timeslots
          </Typography>
          <List>
            {generateRecommendedTimeslots(selectedDate).map((slot, index) => {
                const isSelected = selectedTime && selectedTime.formattedStartTime === slot;

              const isBooked = isTimeslotBooked(
                new Date(selectedDate.toISOString().split("T")[0] + "T" + slot)
              );

              const [hours, minutes] = slot.split(":").map(Number);
              const endTime = new Date();
              endTime.setHours(hours, minutes + 15, 0, 0);
              const endHours = endTime.getHours().toString().padStart(2, "0");
              const endMinutes = endTime
                .getMinutes()
                .toString()
                .padStart(2, "0");
              const endTimeFormatted = `${endHours}:${endMinutes}`;

              return (
                <ListItem
                  key={index}
                  onClick={() =>
                    isBooked ? null : handleTimeslotSelection(slot)
                  }
                  style={{
                    backgroundColor: isSelected
                      ? "#D6EAF8"
                      : isBooked
                      ? "#f0f0f0"
                      : "transparent",
                    cursor: isBooked ? "not-allowed" : "pointer",
                    textDecoration: isBooked ? "line-through" : "none",
                  }}
                  disabled={isBooked}
                >
                  <ListItemText primary={`${slot} - ${endTimeFormatted}`} />
                </ListItem>
              );
            })}
          </List>

          <Typography variant="h6" gutterBottom style={{ marginTop: "20px" }}>
            Custom Timeslot
          </Typography>
          <TextField
            label="Date"
            type="date"
            value={customDate || ""}
            onChange={(e) => {
              setCustomDate(e.target.value);
              setIsTimeslotSelected(false);
              setSelectedTime(null);
            }}
            sx={{ marginRight: 2 }}
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="Time"
            type="time"
            value={customTime || ""}
            onChange={(e) => {
              setCustomTime(e.target.value);
              setIsTimeslotSelected(false);
              setSelectedTime(null);
            }}
            InputLabelProps={{
              shrink: true,
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleTimeslotConfirmation}
            color="primary"
            disabled={
              loading || (!isTimeslotSelected && !customDate && !customTime)
            } // Updated logic
          >
            {loading ? <CircularProgress size={24} /> : "Confirm Timeslot"}
          </Button>
        </DialogActions>
      </Dialog>

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