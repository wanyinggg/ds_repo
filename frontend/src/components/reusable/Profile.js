import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Grid,
  Container,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from "@mui/material";
import {
  AccountCircle as AccountCircleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Email as EmailIcon,
} from "@mui/icons-material"; // Import icons as needed
import StudentNavigationBar from "./StudentNavigationBar";
import SupervisorNavigationBar from "./SupervisorNavigationBar";
import AdminNavigationBar from "./AdminNavigationBar";
import CoordinatorNavigationBar from "./CoordinatorNavigationBar";
import PanelNavigationBar from "./PanelNavigationBar";
import api from "../axios";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentRole = params.get("role");

  useEffect(() => {
    const user = sessionStorage.getItem("user") || localStorage.getItem("user");

    if (user) {
      setUser(JSON.parse(user));
    }

    console.log("User data:", user);
  }, []);

  useEffect(() => {
    if (user && user.id) {
      api
        .get(`/users/${user.id}/`)
        .then((response) => {
          setUserDetail(response.data);
        })
        .catch((error) => {
          console.error(error.response.data);
        });
    }
  }, [user]);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        {currentRole === "programcoordinator" ? (
          <CoordinatorNavigationBar />
        ) : currentRole === "admin" ? (
          <AdminNavigationBar />
        ) : currentRole === "supervisor" ? (
          <SupervisorNavigationBar />
        ) : currentRole === "panel" ? (
          <PanelNavigationBar />
        ) : (
          <StudentNavigationBar />
        )}
      </Grid>

      <Grid item xs={12}>
        <Container maxWidth="md">
          <Paper elevation={3} style={{ padding: "20px" }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <Avatar
                  style={{
                    width: 100,
                    height: 100,
                    margin: "auto",
                    backgroundColor: "#3f51b5",
                  }}
                >
                  {user && user.full_name[0]}
                </Avatar>
              </Grid>
              <Grid item xs={12} sm={8}>
                <List>
                  <ListItem>
                    <IconButton color="primary">
                      <PersonIcon />
                    </IconButton>
                    <ListItemText
                      primary="Full Name"
                      secondary={
                        userDetail ? userDetail.full_name : "Not Available"
                      }
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <IconButton color="primary">
                      <EmailIcon />
                    </IconButton>
                    <ListItemText
                      primary="Email"
                      secondary={
                        userDetail ? userDetail.email : "Not Available"
                      }
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <IconButton color="primary">
                      <AccountCircleIcon />
                    </IconButton>
                    <ListItemText
                      primary="Username"
                      secondary={
                        userDetail ? userDetail.username : "Not Available"
                      }
                    />
                  </ListItem>
                  {user && user.groups.includes(1) && (
                    <>
                      <Divider />
                      <ListItem>
                        <IconButton color="primary">
                          <SchoolIcon />
                        </IconButton>
                        <ListItemText
                          primary="Matric Number"
                          secondary={
                            userDetail ? userDetail.username : "Not Available"
                          }
                        />
                      </ListItem>
                    </>
                  )}
                  {/* Add more details as needed */}
                </List>
              </Grid>
            </Grid>
          </Paper>
        </Container>
      </Grid>
    </Grid>
  );
}
