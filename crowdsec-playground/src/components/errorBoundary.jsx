import { Typography, Box } from "@mui/material";
import { useRouteError } from "react-router-dom";

const ErrorBoundary = () => {
  const error = useRouteError();

  return (
    <Box>
      <h1>Error</h1>
      <Typography>{error?.message}</Typography>
    </Box>
  );
};

export default ErrorBoundary;
