"use client";

import React, {useEffect, useState} from "react";
import {Box, CircularProgress, Divider, Paper, Tab, Tabs, Typography, useMediaQuery, useTheme,} from "@mui/material";
import {Grid} from "@mui/system";
import SingleActionButton from "@/app/_ui/SingleActionButton";
import StandingsTable, {LeagueStandingsItem} from "@/app/_ui/StandingsTable";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {getLeagueStandingsByDateAPI} from "@/app/_fetchers/league/getStandingsByDate";

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const {children, value, index, ...other} = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`standings-tabpanel-${index}`}
      aria-labelledby={`standings-tab-${index}`}
      {...other}
      style={{width: '100%', height: '100%'}}>
      {value === index && (
        <Box sx={{p: {xs: 1, sm: 2}, width: '100%', height: '100%'}}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `standings-tab-${index}`,
    'aria-controls': `standings-tabpanel-${index}`,
  };
}

export default function DailyStandings() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [leagueStandings, setLeagueStandings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);
        const data = await getLeagueStandingsByDateAPI(1);
        setLeagueStandings(data);
      } catch (error) {
        console.error("Error fetching standings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 120px)',
      width: '100%',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <Box sx={{
        gridArea: "top",
        width: "100%",
        backgroundColor: 'none',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        pb: 2,
        position: 'sticky',
        zIndex: 10
      }}>
        <Typography variant="h5" component="h1" sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'primary.main',
          pb: 1
        }}>
          Okupljanje 17.02.2025
        </Typography>
        <Divider/>
      </Box>

      {/* Main Content - Body Grid Area */}
      <Box sx={{
        gridArea: "body",
        width: "100%",
        height: '100%',
        flexDirection: "column",
        overflow: "hidden",
      }}>
        <Paper
          elevation={2}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            width: "100%",
          }}
        >
          <Box sx={{borderBottom: 1, borderColor: 'divider'}}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                backgroundColor: theme.palette.primary.main,
                overflowX: "auto",
                width: "100%",
                color: 'white',
                '& .MuiTab-root': {
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 'medium',
                  fontSize: {xs: '0.85rem', sm: '0.95rem'},
                  py: 2
                },
                '& .Mui-selected': {
                  color: 'inherit !important',
                  fontWeight: 'bold'
                },
                '& .MuiTabs-indicator': {
                  backgroundColor: theme.palette.secondary.main,
                  height: 3
                }
              }}
            >
              <Tab label="Tablica okupljanja" {...a11yProps(0)} />
              <Tab label="Round 12" {...a11yProps(1)} />
              <Tab label="Round 13" {...a11yProps(2)} />
              <Tab label="Round 14" {...a11yProps(3)} />
            </Tabs>
          </Box>

          <Box sx={{
            p: 1,
            borderRadius: 2,
            backgroundColor: 'background.paper',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            pb: 8,
          }}>
            <TabPanel value={tabValue} index={0}>
              {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', p: 4, flex: 1}}>
                  <CircularProgress/>
                </Box>
              ) : (
                <Box sx={{
                  width: "100%",
                  height: '100%',
                  overflowX: 'auto',
                  overflowY: 'hidden'
                }}>
                  <StandingsTable standings={(leagueStandings as LeagueStandingsItem[]) || []}/>
                </Box>
              )}
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Paper
                elevation={0}
                sx={{
                  p: 0.5,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box sx={{position: 'sticky'}}>
                  <Typography variant="h6" sx={{mb: 1, fontWeight: 'medium'}}>Round 12 Results</Typography>
                  <Divider sx={{mb: 2}}/>
                </Box>
                <Box sx={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team A vs Team B</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 162 - 98</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team C vs Team D</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 120 - 142</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team E vs Team F</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 101 - 162</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                </Box>
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box sx={{position: 'sticky'}}>
                  <Typography variant="h6" sx={{mb: 1, fontWeight: 'medium'}}>Round 13 Results</Typography>
                  <Divider sx={{mb: 2}}/>
                </Box>
                <Box sx={{
                  flex: 1,
                  mb: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team A vs Team B</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 162 - 98</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team C vs Team D</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 120 - 142</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team E vs Team F</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 101 - 162</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                </Box>
              </Paper>
            </TabPanel>

            <TabPanel value={tabValue} index={3}>
              <Paper
                elevation={0}
                sx={{
                  p: 1,
                  borderRadius: 2,
                  backgroundColor: 'background.paper',
                  display: 'flex',
                  flexDirection: 'column',
                  height: '100%',
                }}
              >
                <Box sx={{position: 'sticky'}}>
                  <Typography variant="h6" sx={{mb: 1, fontWeight: 'medium'}}>Round 14 Results</Typography>
                  <Divider sx={{mb: 2}}/>
                </Box>
                <Box sx={{
                  flex: 1,
                  mb: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 1,
                  overflowY: 'auto',
                  minHeight: 0,
                }}>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team A vs Team B</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 162 - 98</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team C vs Team D</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 120 - 142</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team E vs Team F</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 101 - 162</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                  <Paper elevation={1} sx={{p: 2, borderRadius: 1, border: '1px solid rgba(0,0,0,0.08)'}}>
                    <Typography variant="subtitle1" fontWeight="bold">Team G vs Team H</Typography>
                    <Typography variant="body2" color="text.secondary">Score: 95 - 108</Typography>
                  </Paper>
                </Box>
              </Paper>
            </TabPanel>
          </Box>
        </Paper>
      </Box>

      <Grid item xs={12} sx={{
        gridArea: "actions",
        width: "100%",
        display: 'flex',
        justifyContent: 'center',
        mt: 2
      }}>
        <SingleActionButton
          fullWidth={isMobile}
          label={"Nazad"}
          onClick={() => window.history.back()}
          icon={<ArrowBackIcon/>}
        />
      </Grid>
    </Box>
  );
}
