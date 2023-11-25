import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Backdrop,
  TablePagination,
} from "@mui/material";
import SortIcon from "@mui/icons-material/Sort";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { tableCellClasses } from "@mui/material/TableCell";
import { ThemeProvider, createTheme, styled } from "@mui/material/styles";
import api from "./axios";
import AdminNavigationBar from "./reusable/AdminNavigationBar";
import Theme from "./reusable/Theme";

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

const AdminUser = () => {
  const [users, setUsers] = React.useState([]);
  const [openDialog, setOpenDialog] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [selectedGroup, setSelectedGroup] = React.useState(1); // Default group: student
  const [roleGroup, setRoleGroup] = React.useState("");
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] =
    React.useState(false);
  const [selectedUserForDeletion, setSelectedUserForDeletion] =
    React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [sortField, setSortField] = React.useState("");
  const [sortDirection, setSortDirection] = React.useState("asc");
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [lecturerRoles, setLecturerRoles] = React.useState([]);
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState("");
  const [alertSeverity, setAlertSeverity] = React.useState("success");

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    api
      .get(`/users/`)
      .then((response) => {
        console.log("All users from API:", response.data);

        let usersInSelectedGroup; 
        if (selectedGroup) {
          usersInSelectedGroup = response.data.filter((user) => {
            // For students (group ID 1 is for students), check if the user is active
            if (selectedGroup === 1) {
              return user.groups.includes(selectedGroup) && user.is_active ;
            }
            return user.groups.includes(selectedGroup); 
          });
        }  else {
          usersInSelectedGroup = response.data;
        }
        setUsers(usersInSelectedGroup);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  React.useEffect(() => {
    fetchUsers(); // Fetch users again when group changes
  }, [selectedGroup]);

  const handleAddUser = () => {
    let selectedGroupValue;
    let selectedLecturerValue = [];

    switch (roleGroup) {
      case "Student":
        selectedGroupValue = [1];
        break;
      case "Lecturer":
        selectedGroupValue = [2];
        if (lecturerRoles.includes("Program Coordinator")) {
          selectedLecturerValue.push(4);
        }
        break;
      case "Admin":
        selectedGroupValue = [3];
        break;
    }

    const updatedGroups = [
      ...new Set([...selectedGroupValue, ...selectedLecturerValue]),
    ];

    const newUser = {
      full_name: fullName,
      username: username,
      email: email,
      password: "fsktm12345",
      lecturerRoles: lecturerRoles,
      groups: updatedGroups,
    };

    api
      .post("/users/", newUser)
      .then((response) => {
        const createdUser = {
          id: users.length + 1,
          username: response.data.username,
          full_name: response.data.full_name,
          email: response.data.email,
          groups: [response.data.groups],
        };
        setUsers((prevUsers) => [...prevUsers, createdUser]);
        setUsername("");
        setEmail("");
        setSelectedGroup(selectedGroup);
        setOpenDialog(false);
        handleAlertOpen("User created successfully!", "success");

        fetchUsers();
      })
      .catch((error) => {
        console.log(error.response.data);
      });
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    let selectedGroupValue;
    let selectedLecturerValue = [];

    switch (roleGroup) {
      case "Student":
        selectedGroupValue = [1];
        break;
      case "Lecturer":
        selectedGroupValue = [2];
        if (lecturerRoles.includes("Program Coordinator")) {
          selectedLecturerValue.push(4);
        }
        break;
      case "Admin":
        selectedGroupValue = [3];
        break;
    }

    const updatedGroups = [
      ...new Set([...selectedGroupValue, ...selectedLecturerValue]),
    ];

    const updatedUser = {
      id: selectedUser.id,
      full_name: fullName,
      username: username,
      email: email,
      lecturerRoles: lecturerRoles,
      groups: updatedGroups,
    };

    api
      .put(`/users/${selectedUser.id}/`, updatedUser)
      .then((response) => {
        setUsers((prevUsers) => {
          const updatedUsers = prevUsers.map((user) => {
            if (user.id === response.data.id) {
              return {
                id: user.id,
                username: response.data.username,
                full_name: response.data.full_name,
                email: response.data.email,
                lecturerRoles: response.data.lecturerRoles,
                groups: [response.data.groups], // Update to match the response data
              };
            }
            return user;
          });
          return updatedUsers;
        });
        setUsername("");
        setEmail("");
        setSelectedUser(null);
        setOpenDialog(false);
        handleAlertOpen("User updated successfully!", "success");

        fetchUsers();
      })
      .catch((error) => {
        console.log(error.response.data);
      });
  };

  const handleDeleteUser = (id) => {
    const selectedUser = users.find((user) => user.id === id);
    setSelectedUserForDeletion(selectedUser);
    setDeleteConfirmationOpen(true);
  };

  const handleConfirmDeleteUser = (user) => {
    if (!user) return;

    api
      .delete(`/users/${user.id}/`)
      .then(() => {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
        setDeleteConfirmationOpen(false);
        handleAlertOpen("User deleted successfully!", "success");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleOpenAddDialog = () => {
    setOpenDialog(true);
    setSelectedUser(null);
    setFullName("");
    setUsername("");
    setEmail("");
  };

  const handleOpenEditDialog = (user) => {
    setOpenDialog(true);
    setSelectedUser(user);
    setUsername(user.username);
    setFullName(user.full_name);
    setEmail(user.email);

    let userRole;

    switch (user.groups[0]) {
      case 1:
        userRole = "Student";
        break;
      case 2:
        userRole = "Lecturer";
        break;
      case 3:
        userRole = "Admin";
        break;
      case 3:
        userRole = "Program Coordinator";
        break;
      default:
        userRole = "Student"; // Default role
    }

    setRoleGroup(userRole);

    // // Set lecturer roles
    // const userLecturerRoles = user.groups
    //   .filter((group) => group === 2) // Assuming group 2 is for Lecturers
    //   .map((group) => groupToRole(group))
    //   .flat();

    // setLecturerRoles(userLecturerRoles);
    let roles = [];

    user.groups.forEach((group) => {
      switch (group) {
        case 2:
          roles = [...roles, ...["Supervisor, Panel"]];
          break;
        case 4:
          roles = [...roles, "Program Coordinator"];
          break;
      }
    });

    setLecturerRoles(roles);
  };

  const getLecturerRole = (group) => {
    switch (group) {
      case 2:
        return ["Supervisor, Panel"];
      case 4:
        return ["Program Coordinator"];
    }
  };

  const handleLecturerRolesChange = (event) => {
    setLecturerRoles(event.target.value);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setFullName("");
    setUsername("");
    setEmail("");
  };

  const handleRoleChange = (event) => {
    setSelectedGroup(event.target.value);
  };

  const handleRoleDialogChange = (event) => {
    setRoleGroup(event.target.value);
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
  

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default sort direction to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredUsers = users.filter((user) => {
    const { username, email, full_name } = user;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return (
      username.toLowerCase().includes(lowerCaseSearchTerm) ||
      email.toLowerCase().includes(lowerCaseSearchTerm) ||
      full_name.toLowerCase().includes(lowerCaseSearchTerm)
    );
  });

  const sortedUsers = filteredUsers.sort((a, b) => {
    const fieldA = a[sortField]?.toLowerCase();
    const fieldB = b[sortField]?.toLowerCase();

    if (fieldA < fieldB) {
      return sortDirection === "asc" ? -1 : 1;
    }
    if (fieldA > fieldB) {
      return sortDirection === "asc" ? 1 : -1;
    }
    return 0;
  });

  const paginatedUsers = sortedUsers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div>
      <AdminNavigationBar />
      <ThemeProvider theme={Theme}>
        <Grid container justifyContent="flex-end" sx={{ padding: "1rem" }}>
          <Grid item>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add User
            </Button>
          </Grid>
          <Grid item>
            <TextField
              label="Search"
              variant="outlined"
              size="small"
              value={searchTerm}
              onChange={handleSearch}
              sx={{ marginLeft: "1rem" }}
            />
          </Grid>
        </Grid>
        <Grid container spacing={2} sx={{ padding: "1rem" }}>
          <Grid item xs={12}>
            <FormControl sx={{ paddingTop: "1rem", paddingBottom: "1rem" }}>
              <InputLabel id="role-label">User Group</InputLabel>
              <Select
                labelId="role-label"
                id="role-select"
                value={selectedGroup}
                onChange={handleRoleChange}
              >
                <MenuItem value={1}>Student</MenuItem>
                <MenuItem value={2}>Lecturer</MenuItem>
                <MenuItem value={3}>Admin</MenuItem>
              </Select>
            </FormControl>
            <TableContainer
              component={Paper}
              sx={{ maxWidth: "100%", overflowX: "auto" }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <StyledTableCell>No.</StyledTableCell>
                    <StyledTableCell
                      onClick={() => handleSort("username")}
                      style={{ cursor: "pointer" }}
                    >
                      Username
                      <SortIcon
                        sx={{
                          verticalAlign: "middle",
                          marginLeft: "0.2rem",
                          fontSize: "1rem",
                        }}
                        className={
                          sortField === "username" && sortDirection === "asc"
                            ? "asc"
                            : "desc"
                        }
                      />
                    </StyledTableCell>
                    <StyledTableCell
                      onClick={() => handleSort("email")}
                      style={{ cursor: "pointer" }}
                    >
                      Email
                      <SortIcon
                        sx={{
                          verticalAlign: "middle",
                          marginLeft: "0.2rem",
                          fontSize: "1rem",
                        }}
                        className={
                          sortField === "email" && sortDirection === "asc"
                            ? "asc"
                            : "desc"
                        }
                      />
                    </StyledTableCell>
                    <StyledTableCell
                      onClick={() => handleSort("full_name")}
                      style={{ cursor: "pointer" }}
                    >
                      Full Name
                      <SortIcon
                        sx={{
                          verticalAlign: "middle",
                          marginLeft: "0.2rem",
                          fontSize: "1rem",
                        }}
                        className={
                          sortField === "full_name" && sortDirection === "asc"
                            ? "asc"
                            : "desc"
                        }
                      />
                    </StyledTableCell>
                    {selectedGroup === 2 && (
                      <StyledTableCell
                        onClick={() => handleSort("groups")}
                        style={{ cursor: "pointer" }}
                      >
                        Lecturer Roles
                        <SortIcon
                          sx={{
                            verticalAlign: "middle",
                            marginLeft: "0.2rem",
                            fontSize: "1rem",
                          }}
                          className={
                            sortField === "groups" && sortDirection === "asc"
                              ? "asc"
                              : "desc"
                          }
                        />
                      </StyledTableCell>
                    )}

                    <StyledTableCell>Actions</StyledTableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {paginatedUsers.map((user, index) => {
                    let userRole;

                    switch (user.groups[0]) {
                      case 1:
                        userRole = "Student";
                        break;
                      case 2:
                        userRole = "Lecturer";
                        break;
                      case 3:
                        userRole = "Admin";
                        break;
                      default:
                        userRole = "Student"; // Default role
                    }

                    return (
                      <TableRow key={user.id}>
                        <StyledTableCell>
                          {index + 1 + page * rowsPerPage}
                        </StyledTableCell>
                        <StyledTableCell>{user.username}</StyledTableCell>
                        <StyledTableCell>{user.email}</StyledTableCell>
                        <StyledTableCell>{user.full_name}</StyledTableCell>
                        {selectedGroup === 2 && (
                          <StyledTableCell>
                            {user.groups
                              .map((group) => getLecturerRole(group))
                              .join(", ")}
                          </StyledTableCell>
                        )}

                        <StyledTableCell>
                          <IconButton
                            edge="start"
                            aria-label="edit"
                            sx={{ marginRight: "2rem" }}
                            onClick={() => handleOpenEditDialog(user)}
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            edge="start"
                            aria-label="delete"
                            onClick={() => handleDeleteUser(user.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </StyledTableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={sortedUsers.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableContainer>
          </Grid>
        </Grid>

        <Dialog open={openDialog} onClose={handleCloseDialog}>
          <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
          <DialogContent>
            <TextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              sx={{ mb: 2, mt: 2 }}
            />
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <TextField
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
              sx={{ mb: 2 }}
            />
            <Grid container direction="column" spacing={2}>
              <Grid item xs={12}>
                <FormControl sx={{ mt: 2, width: "100%" }}>
                  <InputLabel
                    id="role-label"
                    sx={{
                      mr: 2,
                      "&.Mui-focused": {
                        transform: "translate(14px, -14px) scale(0.75)",
                      },
                      "&.MuiInputLabel-shrink": {
                        transform: "translate(14px, -14px) scale(0.75)",
                      },
                    }}
                  >
                    User Group
                  </InputLabel>

                  <Select
                    labelId="role-label"
                    id="role-select"
                    value={roleGroup}
                    onChange={handleRoleDialogChange}
                    sx={{ minWidth: "5rem" }}
                  >
                    <MenuItem value={"Student"}>Student</MenuItem>
                    <MenuItem value={"Lecturer"}>Lecturer</MenuItem>
                    <MenuItem value={"Admin"}>Admin</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {roleGroup.includes("Lecturer") && (
                <Grid item xs={12}>
                  <FormControl sx={{ mt: 2, width: "100%" }}>
                    <InputLabel
                      id="lecturer-role-label"
                      sx={{
                        "&.Mui-focused": {
                          transform: "translate(14px, -14px) scale(0.75)",
                        },
                        "&.MuiInputLabel-shrink": {
                          transform: "translate(14px, -14px) scale(0.75)",
                        },
                      }}
                    >
                      Lecturer Roles
                    </InputLabel>

                    <Select
                      labelId="lecturer-role-label"
                      id="lecturer-role-select"
                      multiple
                      value={lecturerRoles}
                      onChange={handleLecturerRolesChange}
                      sx={{ minWidth: "10rem" }}
                    >
                      <MenuItem value={"Supervisor, Panel"}>
                        Supervisor, Panel
                      </MenuItem>
                      <MenuItem value={"Program Coordinator"}>
                        Program Coordinator
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            {selectedUser ? (
              <Button onClick={handleEditUser}>Save Changes</Button>
            ) : (
              <Button onClick={handleAddUser}>Add User</Button>
            )}
          </DialogActions>
        </Dialog>

        <Dialog
          open={deleteConfirmationOpen}
          onClose={() => setDeleteConfirmationOpen(false)}
        >
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the user{" "}
              {selectedUserForDeletion && selectedUserForDeletion.username}?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmationOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleConfirmDeleteUser(selectedUserForDeletion)}
              color="error"
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
        <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={alertOpen}
      >
        <Alert
          severity={alertSeverity}
          onClose={handleAlertClose}
          sx={{
            boxShadow: 24, 
            p: 2, 
            minWidth: '20%', 
            display: 'flex', 
          }}
        >
          {alertMessage}
        </Alert>
      </Backdrop>
      </ThemeProvider>
    </div>
  );
};

export default AdminUser;
