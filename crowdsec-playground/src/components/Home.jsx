import { Box } from "@mui/material";

export default function Home() {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        justifyContent: "center",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div className="centered">
        Welcome to the CrowdSec Playground!
        <br />
        Here you can debug your grok patterns, create notification templates,
        and more!
      </div>
    </Box>
  );
}
