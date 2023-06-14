import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import { styled } from '@mui/system';
import { GitHub } from '@mui/icons-material';

import { ReactComponent as CrowdsecLogo } from '../../crowdsec.svg';
import { Link } from 'react-router-dom';

const drawerWidth = 240;

const StyledButton = styled(Button)(({ theme }) => ({
  color: 'white',
  [theme.breakpoints.up('sm')]: {
    margin: theme.spacing(1),
  },
}));

const pages = {
  'Grok Debugger': '/grok',
};

function ResponsiveAppBar() {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <div>
      {Object.keys(pages).map((page) => (
        <StyledButton
          component={Link}
          to={pages[page]}
          key={page}
          onClick={handleDrawerToggle}
        >
          {page}
        </StyledButton>
      ))}
    </div>
  );

  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { xs: 'block', sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <CrowdsecLogo />
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              flexGrow: 1,
              display: { xs: 'none', sm: 'block' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.1rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
            Crowdsec Playground
          </Typography>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="GitHub"
            href="https://github.com/crowdsecurity/crowdsec-wasm-playground"
            target="_blank"
            rel="noopener noreferrer"
          >
          <GitHub />
          </IconButton>
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
            {Object.keys(pages).map((page) => (
              <StyledButton component={Link} to={pages[page]} key={page}>
                {page}
              </StyledButton>
            ))}
          </Box>
        </Toolbar>
      </Container>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            backgroundColor: 'grey.900',
          },
        }}
      >
        {drawer}
      </Drawer>
    </AppBar>
  );
}

export default ResponsiveAppBar;