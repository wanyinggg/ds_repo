import React from "react";
import { useEffect, useState } from "react";
import StudentNavigationBar from "./reusable/StudentNavigationBar";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Chip,
} from "@mui/material";
import EventIcon from "@mui/icons-material/Event";
import ScheduleIcon from "@mui/icons-material/Schedule";
import GroupIcon from "@mui/icons-material/Group";
import LinkIcon from "@mui/icons-material/Link";
import api from "./axios";

export default function StudentPresentationTimeslot() {
  const [presentationSchedule, setPresentationSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    // Fetch presentation schedules
    api
      .get("/presentation-schedule/") // Update this endpoint to fetch only the logged-in student's schedule
      .then((response) => {
        setPresentationSchedule(response.data[0]); // Assuming the response is an array and you are interested in the first schedule
        setLoading(false);
      })
      .catch((error) => {
        console.error(
          "Error fetching presentation schedules:",
          error.response.data
        );
        setError(error);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  const extractHourAndMinute = (timeString) => {
    const dateObj = new Date(`1970-01-01T${timeString}Z`);
    const hours = String(dateObj.getUTCHours()).padStart(2, "0");
    const minutes = String(dateObj.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  return (
    <div>
      <StudentNavigationBar />
      {loading && <div>Loading...</div>}
      {error && <div>Error loading data. Please try again later.</div>}
      {presentationSchedule ? (
        <Card
          variant="outlined"
          sx={{ margin: 2, padding: 2, backgroundColor: "#f9f9f9" }}
        >
          <CardContent>
            <Typography
              variant="h5"
              component="div"
              gutterBottom
              sx={{ marginBottom: 2 }}
            >
              Meeting Details
            </Typography>

            <Divider sx={{ marginBottom: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <EventIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Date:{" "}
                  {new Date(presentationSchedule.date).toLocaleDateString()} (
                  {new Date(presentationSchedule.date).toLocaleDateString(
                    undefined,
                    { weekday: "long" }
                  )}
                  )
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="body1">
                  <ScheduleIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Time:{" "}
                  {`${extractHourAndMinute(
                    presentationSchedule.start_time
                  )} - ${extractHourAndMinute(presentationSchedule.end_time)}`}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1" sx={{ marginBottom: 1 }}>
                  <GroupIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Panels
                </Typography>
                {presentationSchedule.panels.map((panel, index) => (
                  <Chip
                    key={index}
                    label={panel.full_name}
                    variant="outlined"
                    sx={{ marginRight: 1, marginBottom: 1 }}
                  />
                ))}
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body1">
                  <LinkIcon
                    color="primary"
                    sx={{ verticalAlign: "middle", marginRight: 1 }}
                  />
                  Google Meet Link:
                  <a
                    href={presentationSchedule.google_meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginLeft: "8px",
                      color: "blue",
                      textDecoration: "underline",
                    }}
                  >
                    {presentationSchedule.google_meet_link}
                  </a>
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ):(
        <Card style={{ height: "150px", display: "flex", justifyContent: "center", alignItems: "center", margin: "15px" }}>
          <Typography variant="body1" color="textSecondary">
            No presentation schedule available.
          </Typography>
        </Card>
      )}
    </div>
  );
}
