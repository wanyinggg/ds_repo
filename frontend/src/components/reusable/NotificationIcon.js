import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import moment from "moment";
import api from "../axios";

function NotificationIcon() {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  // Fetch notifications from API
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications/");
      const sortedNotifications = response.data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotifications(sortedNotifications);
    } catch (error) {
      console.error("Error fetching notifications: ", error);
    }
  };

  fetchNotifications();
}, []);


  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await api.post(`/notifications/${notificationId}/read/`);
      // Update the local state to mark the notification as read
      setNotifications(
        notifications.map((notif) =>
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read: ", error);
    }
  };

  const unreadCount = notifications.filter((notif) => !notif.read).length;

  function getTimeAgo(timestamp) {
    return moment(timestamp).fromNow();
  }

  const handleNotificationClick = async (type, notificationId) => {
    handleMenuClose();
    await markNotificationRead(notificationId);
    console.log("Clicked Notification Type:", type);

    // Navigate based on the notification type
    switch (type) {
      // supervisor page
      case "student_application":
        navigate(`/supervisorapplication`);
        break;
      case "supervisor_evaluation_proposal":
        sessionStorage.setItem("selectedOption", "Proposal");
        navigate(`/supervisorevaluation`);
        break;
      case "supervisor_evaluation_report":
        sessionStorage.setItem("selectedOption", "Report");
        navigate(`/supervisorevaluation`);
        break;
      case "supervisor_evaluation_presentation":
        sessionStorage.setItem("selectedOption", "Presentation");
        navigate(`/supervisorevaluation`);
        break;
      case "supervisor_evaluation_demo":
        sessionStorage.setItem("selectedOption", "Presentation");
        navigate(`/supervisorevaluation`);
        break;
      case "supervisor_evaluation_data_product":
        sessionStorage.setItem("selectedOption", "Presentation");
        navigate(`/supervisorevaluation`);
        break;
      // panel page
      case "panel_project":
      case "panel_presentation":
        navigate(`/panelpresentation`);
        break;
      case "panel_evaluation_score":
      case "panel_evaluation_presentation":
      case "panel_evaluation_demo":
      case "panel_evaluation_data_product":
        case "panel_score_difference":
        navigate(`/panelevaluation`);
        break;  
      // student page
      case "student_project":
        navigate(`/studentproject`);
        break;
      case "student_presentation":
        navigate(`/studentpresentation`);
        break;

      default:
        console.warn(`Unknown notification type: ${type}`);
    }
  };

  const handleDeleteAllNotifications = async () => {
    try {
      await api.delete("/notifications/");
      setNotifications([]);
    } catch (error) {
      console.error("Error deleting all notifications: ", error.response.data);
    }
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleMenuOpen}
        sx={{ p: 0, position: "relative" }}
      >
        <NotificationsIcon sx={{ marginRight: "1.5rem", fontSize: "2rem" }} />
        <Badge
          badgeContent={unreadCount}
          color="error"
          sx={{
            position: "absolute",
            top: "8px",
            right: "25px",
            height: "18px",
            width: "18px",
          }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          style: {
            width: "400px",
          },
        }}
      >
        <Typography
          variant="h6"
          component="div"
          sx={{ px: 2, py: 1.5, fontWeight: "medium" }}
        >
          Notifications
        </Typography>
        <Divider />
        {notifications.length === 0 ? (
          <Typography sx={{ p: 2, textAlign: "center", color: "#888" }}>
            No new notifications
          </Typography>
        ) : (
          notifications.map((notification, index) => (
            <div key={notification.id}>
              <MenuItem
                onClick={() =>
                  handleNotificationClick(
                    notification.type,
                    notification.id
                  )
                }
                sx={{
                  wordWrap: "break-word",
                  whiteSpace: "normal",
                  py: 1,
                  px: 2,
                  backgroundColor: notification.read ? "white" : "#f0f0f0",
                  "&:hover": {
                    backgroundColor: notification.read ? "#f0f0f0" : "#e0e0e0",
                  },
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    textDecoration: "none",
                    fontSize: "0.8rem",
                    color: notification.read ? "#aaa" : "#000",
                    mb: 0.5,
                  }}
                >
                  {notification.message}
                </Typography>
                <Typography
                  variant="caption"
                  component="p"
                  sx={{ color: "#888" }}
                >
                  {getTimeAgo(notification.timestamp)}
                </Typography>
              </MenuItem>
              {index < notifications.length - 1 && <Divider />}
            </div>
          ))
        )}
        <Divider />
        {notifications.length > 0 && (
          <MenuItem
            onClick={handleDeleteAllNotifications}
            sx={{
              justifyContent: "center",
              color: "#f44336",
              fontSize: "0.9rem",
            }}
          >
            Delete All Notifications
          </MenuItem>
        )}

        <Divider />
      </Menu>
    </>
  );
}

export default NotificationIcon;
