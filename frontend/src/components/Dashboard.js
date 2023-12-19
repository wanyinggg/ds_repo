import React, { useEffect, useState } from "react";
import {
  createTheme,
  ThemeProvider,
  Typography,
  Accordion,
  AccordionDetails,
  Box,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Menu,
  MenuItem,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import CoordinatorNavigationBar from "./reusable/CoordinatorNavigationBar";
import CloseIcon from "@mui/icons-material/Close";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import { scaleOrdinal } from "d3-scale";
import { schemeSet2 } from "d3-scale-chromatic";
import api from "./axios";

import { styled } from "@mui/material/styles";

import Paper from "@mui/material/Paper";

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

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

const COLORS = ["#8884d8", "#82ca9d"];

const colorScale = scaleOrdinal(schemeSet2);

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [lecturerCount, setLecturerCount] = useState(0);
  const [isStudentsExpanded, setStudentsExpanded] = useState(false);
  const [isLecturersExpanded, setLecturersExpanded] = useState(false);
  const [lecturerData, setLecturerData] = useState([]);
  const [projects, setProjects] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [studentMenuAnchorEl, setStudentMenuAnchorEl] = useState(null);
  const [lecturerMenuAnchorEl, setLecturerMenuAnchorEl] = useState(null);
  const [studentsPerLecturerDialogOpen, setStudentsPerLecturerDialogOpen] =
    useState(false);
  const [sortDirection, setSortDirection] = useState("asc");
  const [sortColumn, setSortColumn] = useState("full_name");
  const [sortLecturerColumn, setSortLecturerColumn] = useState(null);
  const [sortLecturerDirection, setSortLecturerDirection] = useState("asc");
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState([]);
  const [maxYAxis, setMaxYAxis] = useState(0);

  const handleStudentMenuClick = (event) => {
    setStudentMenuAnchorEl(event.currentTarget);
  };

  const handleLecturerMenuClick = (event) => {
    setLecturerMenuAnchorEl(event.currentTarget);
  };

  const handleCloseStudentMenu = () => {
    setStudentMenuAnchorEl(null);
  };

  const handleCloseLecturerMenu = () => {
    setLecturerMenuAnchorEl(null);
  };

  const handleShowStudentsWithoutProjects = () => {
    setOpenDialog(true);
    handleCloseStudentMenu();
  };

  const handleShowStudentsPerLecturer = () => {
    setStudentsPerLecturerDialogOpen(true);
  };

  useEffect(() => {
    fetchUsersByGroup(1); // For students
    fetchUsersByGroup(2); // For lecturers
    fetchProjects();
    fetchStudentPerLecturer();
    fetchGrades();
    fetchScores();
  }, []);

  useEffect(() => {
    setStudentCount(students.length);
    setLecturerCount(lecturers.length);
  }, [students, lecturers]);

  const fetchProjects = () => {
    api
      .get("/projects/")
      .then((response) => {
        setProjects(response.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const fetchStudentPerLecturer = () => {
    api
      .get("/students-per-lecturer/")
      .then((response) => {
        setLecturerData(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        console.error("Failed to fetch students per lecturer data:", error);
      });
  };

  const fetchUsersByGroup = (groupID) => {
    api
      .get("/users/")
      .then((response) => {
        // Filter to include only users from the specified group and who are active
        let filteredUsers = response.data.filter(user => 
          user.groups.includes(groupID) && user.is_active === true
        );

        if (groupID === 1) {
          setStudents(filteredUsers); // groupID 1 is for students
        } else if (groupID === 2) {
          setLecturers(filteredUsers); // groupID 2 is for lecturers
        }
      })
      .catch((error) => {
        console.log(error);
      });
};


  const fetchGrades = () => {
    api
      .get("/total_scores/")
      .then((response) => {
        const grades = response.data.map((item) => item.grade);
        const gradeCounts = {};
        grades.forEach((grade) => {
          gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        });
        const processedData = Object.keys(gradeCounts).map((grade) => ({
          name: grade,
          value: gradeCounts[grade],
        }));
        setGradeDistribution(processedData);
      })
      .catch((error) => {
        console.error("Failed to fetch grade distribution:", error);
      });
  };

  const fetchScores = () => {
    api
      .get("/total_scores/")
      .then((response) => {
        const scoreRanges = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const scoreCounts = {};
        scoreRanges.forEach((range) => {
          scoreCounts[`${range - 10}-${range}`] = 0;
        });
        response.data.forEach((item) => {
          const score = item.total_score;
          for (let i = 1; i < scoreRanges.length; i++) {
            if (score <= scoreRanges[i]) {
              scoreCounts[`${scoreRanges[i - 1]}-${scoreRanges[i]}`]++;
              break;
            }
          }
        });
        const processedData = Object.keys(scoreCounts).map((range) => ({
          range: range,
          count: scoreCounts[range],
        }));
        setScoreDistribution(processedData);

        // Compute the max count
        const maxCount = Math.max(...processedData.map((item) => item.count));
        setMaxYAxis(maxCount);
      })
      .catch((error) => {
        console.error("Failed to fetch score distribution:", error);
      });
  };

  const maxWidth = "calc(50% - 40px)";

  const cardStyle1 = {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    "&:hover": {
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
      transform: "scale(1.05)",
    },
  };

  const cardStyle = {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "25px",
    backgroundColor: "#f5f5f5",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
    borderRadius: "10px",
    border: "1px solid #e0e0e0",
    cursor: "pointer",
    transition: "0.3s",
    width: maxWidth,
    "&:hover": {
      boxShadow: "0 6px 12px rgba(0, 0, 0, 0.2)",
      transform: "scale(1.05)",
    },
  };

  const activeStudents = students.filter(student => student.is_active === 1);

  // Processing the projects to determine which students are assigned
  const studentsWithProjectsIds = projects
  .map(project => project.assigned_to_id)
  .flat();
const uniqueStudentsWithProjectsIds = [...new Set(studentsWithProjectsIds)];

// Filtering out active students who are unassigned
const unassignedStudents = students.filter(
  student => !uniqueStudentsWithProjectsIds.includes(student.id)
);

// Preparing the data for the pie chart
const data = [
  { name: "With Projects", Students: uniqueStudentsWithProjectsIds.length },
  { name: "Without Projects", Students: unassignedStudents.length },
];

  const maxDataValue = Math.max(
    ...lecturerData.map((item) => item.student_count)
  );
  const yAxisTicks = Array.from({ length: maxDataValue + 1 }, (_, i) => i);

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedStudents = [...students].sort((a, b) => {
    let comparison = 0;
    if (a[sortColumn] > b[sortColumn]) {
      comparison = 1;
    } else if (a[sortColumn] < b[sortColumn]) {
      comparison = -1;
    }
    return sortDirection === "desc" ? comparison * -1 : comparison;
  });

  const handleLecturerSort = (column) => {
    let newDirection = "asc";
    if (sortLecturerColumn === column && sortLecturerDirection === "asc") {
      newDirection = "desc";
    }
    setSortLecturerColumn(column);
    setSortLecturerDirection(newDirection);

    const sortedLecturers = [...lecturers].sort((a, b) => {
      if (newDirection === "asc") {
        return a[column].localeCompare(b[column]);
      } else {
        return b[column].localeCompare(a[column]);
      }
    });
    setLecturers(sortedLecturers);
  };

  return (
    <ThemeProvider theme={theme}>
      <CoordinatorNavigationBar />
      {/* Num of students and lecturers */}
      <Box
        padding={3}
        display="flex"
        justifyContent="space-between"
        marginBottom={3}
      >
        <Box
          style={{
            ...cardStyle,
            marginRight: "15px",
          }}
          onClick={() => setStudentsExpanded((prev) => !prev)}
        >
          <Box>
            <Typography variant="h4" style={{ marginBottom: "10px" }}>
              {studentCount}
            </Typography>
            <Typography variant="subtitle2">Students</Typography>
          </Box>
          {isStudentsExpanded ? (
            <ExpandLessIcon color="action" style={{ marginTop: "15px" }} />
          ) : (
            <ExpandMoreIcon color="action" style={{ marginTop: "15px" }} />
          )}
        </Box>

        <Box
          style={{
            ...cardStyle,
            marginLeft: "15px",
          }}
          onClick={() => setLecturersExpanded((prev) => !prev)}
        >
          <Box>
            <Typography variant="h4" style={{ marginBottom: "10px" }}>
              {lecturerCount}
            </Typography>
            <Typography variant="subtitle2">Lecturers</Typography>
          </Box>
          {isLecturersExpanded ? (
            <ExpandLessIcon color="action" style={{ marginTop: "15px" }} />
          ) : (
            <ExpandMoreIcon color="action" style={{ marginTop: "15px" }} />
          )}
        </Box>
      </Box>

      {/* Namelist for students and lecturers */}
      <Box display="flex" justifyContent="space-between">
        {isStudentsExpanded && (
          <Box style={{ width: maxWidth, marginLeft: "30px" }}>
            <Accordion expanded>
              <AccordionDetails>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        onClick={() => handleSort("full_name")}
                        style={{ cursor: "pointer" }}
                      >
                        <strong>Name</strong>
                        {sortColumn === "full_name"
                          ? sortDirection === "asc"
                            ? "↓"
                            : "↑"
                          : "↕"}
                      </TableCell>
                      <TableCell
                        onClick={() => handleSort("username")}
                        style={{ cursor: "pointer" }}
                      >
                        <strong>Matric Number</strong>
                        {sortColumn === "username"
                          ? sortDirection === "asc"
                            ? "↓"
                            : "↑"
                          : "↕"}
                      </TableCell>
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    {sortedStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.full_name}</TableCell>
                        <TableCell>{student.username}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {isLecturersExpanded && (
          <Box
            style={{ width: maxWidth, marginRight: "30px", marginLeft: "auto" }}
          >
            <Accordion expanded>
              <AccordionDetails>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell
                        onClick={() => handleLecturerSort("full_name")}
                        style={{ cursor: "pointer" }}
                      >
                        <strong>Name</strong>
                        {sortLecturerColumn === "full_name"
                          ? sortLecturerDirection === "asc"
                            ? "↓"
                            : "↑"
                          : "↕"}
                      </TableCell>
                      <TableCell >
                        <strong>Email</strong>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lecturers.map((lecturer) => (
                      <TableRow key={lecturer.id}>
                        <TableCell>{lecturer.full_name}</TableCell>
                        <TableCell>{lecturer.email}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionDetails>
            </Accordion>
          </Box>
        )}
      </Box>

      <Grid container spacing={4} padding="1.5em">
        {/* Student Project Allocation */}
        <Grid item xs={12} lg={6} style={{ flexDirection: "column" }}>
          <Item style={{ ...cardStyle1 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <Box flex={1} display="flex" justifyContent="center">
                <Typography variant="h6" style={{ marginBottom: "5px" }}>
                  Student Project Allocation
                </Typography>
              </Box>
              <IconButton onClick={handleStudentMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={studentMenuAnchorEl}
                keepMounted
                open={Boolean(studentMenuAnchorEl)}
                onClose={handleCloseStudentMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={handleShowStudentsWithoutProjects}>
                  Show Students Without Project
                </MenuItem>
              </Menu>
            </Box>

            {data && data.length > 0 ? (
              <PieChart width={400} height={400}>
                <Pie
                  data={data}
                  cx={200}
                  cy={150}
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="Students"
                  label
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <Typography
                variant="body1"
                style={{ textAlign: "center", marginTop: "1em" }}
              >
                No data available for student project allocation.
              </Typography>
            )}
          </Item>
        </Grid>

        {/* Student Per Lecturer */}
        <Grid item xs={12} lg={6} style={{ flexDirection: "column" }}>
          <Item style={{ ...cardStyle1 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <Box flex={1} display="flex" justifyContent="center">
                <Typography variant="h6" style={{ marginBottom: "5px" }}>
                  Student per Lecturer
                </Typography>
              </Box>
              <IconButton onClick={handleLecturerMenuClick}>
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={lecturerMenuAnchorEl}
                keepMounted
                open={Boolean(lecturerMenuAnchorEl)}
                onClose={handleCloseLecturerMenu}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={handleShowStudentsPerLecturer}>
                  Show Students for each Lecturer
                </MenuItem>
              </Menu>
            </Box>
            {lecturerData && lecturerData.length > 0 ? (
              <BarChart
              width={600} 
              height={400}
              data={lecturerData}
              margin={{ top: 20, right: 30, left: 20, bottom: 100 }} 
              barSize={20}
              >
                <XAxis
                  dataKey="created_by__full_name"
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  tick={{ fontSize: 12 }}
                  tickMargin={10}
                />

                <YAxis
                  tickFormatter={(value) => Math.round(value)}
                  ticks={yAxisTicks}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />

                <Bar dataKey="student_count" fill="#8884d8" />
              </BarChart>
            ) : (
              <Typography
                variant="body1"
                style={{ textAlign: "center", marginTop: "1em" }}
              >
                No data available for students per lecturer.
              </Typography>
            )}
          </Item>
        </Grid>
      </Grid>

      <Grid container spacing={4} padding="1.5em">
        {/* Score Distribution */}
        <Grid item xs={12} lg={6} style={{ flexDirection: "column" }}>
          <Item style={{ ...cardStyle1 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <Box flex={1} display="flex" justifyContent="center">
                <Typography variant="h6" style={{ marginBottom: "5px" }}>
                  Score Distribution
                </Typography>
              </Box>
            </Box>
            {scoreDistribution && scoreDistribution.length > 0 ? (
              <BarChart width={500} height={300} data={scoreDistribution}>
                <XAxis dataKey="range" interval={0} angle={-25} />
                <YAxis
                  tickFormatter={(value) => Math.round(value)}
                  ticks={[0, maxYAxis]}
                  domain={[0, maxYAxis]}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#8884d8" />
              </BarChart>
            ) : (
              <Typography
                variant="body1"
                style={{ textAlign: "center", marginTop: "1em" }}
              >
                No data available for score distribution.
              </Typography>
            )}
          </Item>
        </Grid>

        {/* Grade Distribution */}
        <Grid item xs={12} lg={6} style={{ flexDirection: "column" }}>
          <Item style={{ ...cardStyle1 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
            >
              <Box flex={1} display="flex" justifyContent="center">
                <Typography variant="h6" style={{ marginBottom: "5px" }}>
                  Grades Distribution
                </Typography>
              </Box>
            </Box>
            {gradeDistribution && gradeDistribution.length > 0 ? (
              <PieChart width={400} height={300}>
                <Pie
                  data={gradeDistribution}
                  cx={200}
                  cy={150}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label
                >
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`gradeCell-${index}`} fill={colorScale(index)} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            ) : (
              <Typography
                variant="body1"
                style={{ textAlign: "center", marginTop: "1em" }}
              >
                No data available for grade distribution.
              </Typography>
            )}
          </Item>
        </Grid>
      </Grid>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle
          style={{
            backgroundColor: theme.palette.primary.light,
            color: "white",
            position: "relative",
          }}
        >
          Students Without Project
          <IconButton
            onClick={() => setOpenDialog(false)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent style={{ padding: "20px 30px" }}>
          <Table size="small">
            <TableHead>
              <TableRow style={{ backgroundColor: "#f5f5f5" }}>
                <TableCell>
                  <strong>Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Matric Number</strong>
                </TableCell>
                <TableCell>
                  <strong>Email</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {unassignedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.full_name}</TableCell>
                  <TableCell>{student.username}</TableCell>
                  <TableCell>
                    <a
                      href={`mailto:${student.email}`}
                      style={{
                        textDecoration: "none",
                        color: theme.palette.primary.main,
                      }}
                    >
                      {student.email}
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      <Dialog
        open={studentsPerLecturerDialogOpen}
        onClose={() => setStudentsPerLecturerDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle
          style={{
            backgroundColor: theme.palette.primary.light,
            color: "white",
            position: "relative",
          }}
        >
          Students per Lecturer
          <IconButton
            onClick={() => setStudentsPerLecturerDialogOpen(false)}
            style={{
              position: "absolute",
              right: "10px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "white",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Lecturer</strong>
                </TableCell>
                <TableCell>
                  <strong>Student Name</strong>
                </TableCell>
                <TableCell>
                  <strong>Matric Number</strong>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lecturerData.map((lecturer, index) => {
                const studentCount = lecturer.student_names?.length || 0;
                return lecturer.student_names?.map(
                  (studentName, studentIndex) => (
                    <TableRow key={`${index}-${studentIndex}`}>
                      {studentIndex === 0 ? (
                        <TableCell rowSpan={studentCount}>
                          {lecturer.created_by__full_name}
                        </TableCell>
                      ) : null}
                      <TableCell>{studentName}</TableCell>
                      <TableCell>
                        {lecturer.student_matric_numbers[studentIndex]}
                      </TableCell>
                    </TableRow>
                  )
                );
              })}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>
    </ThemeProvider>
  );
}
