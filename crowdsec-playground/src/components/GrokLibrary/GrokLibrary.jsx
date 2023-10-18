import { Fragment, useEffect, useState } from "react";
import {
  TableRow,
  TableCell,
  Box,
  Pagination,
  Select,
  MenuItem,
  TableHead,
  IconButton,
  TableContainer,
  Table,
  TextField,
  Typography,
  Collapse,
  Paper,
  TableBody,
} from "@mui/material";

import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

import EditPattern from "src/components/GrokLibrary/EditPattern";
import AddPattern from "src/components/GrokLibrary/AddPattern";

const GrokLibrary = ({ onPatternUpdate }) => {
  const [patterns, setPatterns] = useState(window.getGrokPatterns());
  const [currentPagePatternKeys, setCurrentPagePatternKeys] = useState([]);
  const [search, setSearch] = useState("");
  const [patternsOpenState, setPatternsOpenState] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    onPatternUpdate(patterns);
  }, [onPatternUpdate, patterns]);

  const updateSearch = (event) => {
    setSearch(event.target.value);
  };

  const handleOpen = (key) => {
    setPatternsOpenState((prevState) => ({
      ...prevState,
      [key]: true,
    }));
  };

  const handleClose = (key) => {
    setPatternsOpenState((prevState) => ({
      ...prevState,
      [key]: false,
    }));
  };

  const addPattern = (patternKey, patternValue) => {
    if (patternKey && patternValue) {
      let ret = window.addPattern(patternKey, patternValue);
      if (ret.error !== undefined) {
        return [false, ret.error];
      }
      setPatterns((prevState) => {
        return {
          ...prevState.patterns,
          [patternKey]: patternValue,
        };
      });
    }

    return [true, ""];
  };

  const editPattern = (patternKey, patternValue) => {
    let ret = window.editPattern(patternKey, patternValue);
    if (ret.error !== undefined) {
      console.log("Error editing pattern: ", ret.error);
      return [false, ret.error];
    }
    setPatterns(() => window.getGrokPatterns());
    return [true, ""];
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  useEffect(() => {
    if (search === "") {
      setPatterns(() => window.getGrokPatterns());
    } else {
      setPatterns(() => {
        let filteredPatterns = {};
        for (let key in patterns) {
          if (key.toLowerCase().indexOf(search.toLowerCase()) !== -1) {
            filteredPatterns[key] = patterns[key];
          }
        }
        return filteredPatterns;
      });
    }
  }, [patterns, search]);

  useEffect(() => {
    setCurrentPagePatternKeys(
      Object.keys(patterns)
        .sort()
        .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage),
    );
  }, [currentPage, patterns, rowsPerPage]);

  return (
    <div>
      <h1>Grok Pattern Library</h1>

      <AddPattern addPattern={addPattern} />
      <TextField
        name="search"
        value={search}
        onChange={updateSearch}
        label="Search Patterns"
        fullWidth
      />
      <TableContainer component={Paper}>
        <div style={{ maxHeight: "700px", overflow: "auto" }}>
          <Table aria-label="simple table" size="small">
            <TableHead>
              <TableRow>
                <TableCell>Pattern</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentPagePatternKeys.map((key) => (
                <Fragment key={key}>
                  <TableRow
                    key={key}
                    sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
                  >
                    <TableCell component="th" scope="row">
                      <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          patternsOpenState[key]
                            ? handleClose(key)
                            : handleOpen(key);
                        }}
                      >
                        <ExpandMoreIcon
                          style={{
                            transform: patternsOpenState[key]
                              ? "rotate(360deg)"
                              : "rotate(270deg)",
                            transition: "transform 0.1s",
                          }}
                        />
                      </IconButton>
                      {key}
                    </TableCell>
                    <TableCell align="right">
                      <EditPattern
                        patternKey={key}
                        patternValue={patterns[key]}
                        editPattern={editPattern}
                      />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={6}
                    >
                      <Collapse
                        in={patternsOpenState[key]}
                        timeout="auto"
                        unmountOnExit
                      >
                        <Box margin={1}>
                          <Typography
                            variant="body1"
                            gutterBottom
                            component="div"
                          >
                            {patterns[key]}
                          </Typography>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </TableContainer>
      <div style={{ display: "flex", alignItems: "center", marginTop: "10px" }}>
        <Pagination
          count={Math.ceil(Object.keys(patterns).length / rowsPerPage)}
          page={currentPage}
          onChange={handlePageChange}
        />
        Number of items per page:
        <Select value={rowsPerPage} onChange={handleRowsPerPageChange}>
          {[10, 20, 30, 50].map((num) => (
            <MenuItem key={num} value={num}>
              {num}
            </MenuItem>
          ))}
        </Select>
      </div>
    </div>
  );
};

export default GrokLibrary;
