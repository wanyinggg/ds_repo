import { createTheme, responsiveFontSizes,} from "@mui/material/styles";

let theme = createTheme({
    palette: {
        primary: {
        main: "#8950fc",
        },
    },
    });
theme = responsiveFontSizes(theme);

export default theme;
