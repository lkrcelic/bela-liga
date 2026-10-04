import { createTheme, ThemeOptions } from '@mui/material/styles';
import { PaletteColorOptions } from '@mui/material/styles/createPalette';
import {color, font} from './tokens';

// Extend the palette to include custom colors
declare module '@mui/material/styles' {
  interface Palette {
    team1: Palette['primary'];
    team2: Palette['primary'];
  }

  interface PaletteOptions {
    team1?: PaletteColorOptions;
    team2?: PaletteColorOptions;
  }
}

// Extend the components to allow for team1 and team2 colors
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    team1: true;
    team2: true;
  }
}

const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: '#3C4A67',
    },
    secondary: {
      main: '#EDE0BF',
    },
    team1: {
      main: '#386641',
      contrastText: '#ffffff',
    },
    team2: {
      main: '#BC4749',
      contrastText: '#ffffff',
    },
    info: {
      main: '#92AFD7',
    },
    error: {
      main: color.red,
    },
    text: {
      primary: color.ink,
      secondary: color.muted,
    },
    background: {
      default: color.paper,
      paper: color.card,
    }
  },
  shape: {
    borderRadius: 14,
  },
  typography: {
    fontFamily: font.body,
    h1: {
      fontSize: '3rem',
      fontWeight: 700,
      color: '#212121',
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 600,
      color: '#212121',
    },
    h3: {
      fontSize: '2.25rem',
      fontWeight: 500,
      color: '#212121',
    },
    h4: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#212121',
    },
    h7: {
      fontFamily: 'Roboto, sans-serif',
      fontSize: '1.1rem',
      fontWeight: 500,
      color: '#212121',
    },
    body1: {
      fontSize: '1rem',
      color: '#212121',
    },
    body2: {
      fontSize: '0.875rem',
      color: '#757575',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: color.paper,
          color: color.ink,
          fontFamily: font.body,
          WebkitTapHighlightColor: "transparent",
        },
        "button, input, select, textarea": {fontFamily: "inherit"},
        // no double-tap zoom delay on the keypad and other buttons (pinch zoom stays available)
        "button, a, [role=button]": {touchAction: "manipulation"},
        "input::placeholder": {color: color.placeholder, opacity: 1},
        // keyboard focus is always visible; mouse/touch focus is not
        ":focus-visible": {outline: `3px solid ${color.navy}`, outlineOffset: "2px"},
        "@keyframes spLive": {
          "0%": {boxShadow: "0 0 0 0 rgba(188,71,73,.45)"},
          "70%": {boxShadow: "0 0 0 7px rgba(188,71,73,0)"},
          "100%": {boxShadow: "0 0 0 0 rgba(188,71,73,0)"},
        },
        "@keyframes spRowIn": {
          "0%": {opacity: 0, transform: "translateY(-10px) scale(.97)", background: color.cream},
          "60%": {background: color.cream},
          "100%": {opacity: 1, transform: "none", background: "transparent"},
        },
        "@keyframes spRowFlash": {"0%": {background: color.cream}, "100%": {background: "transparent"}},
        "@keyframes spPulse": {"0%, 100%": {transform: "scale(1)"}, "45%": {transform: "scale(1.07)"}},
        "@keyframes spPop": {"0%": {transform: "scale(1)"}, "40%": {transform: "scale(1.4)"}, "100%": {transform: "scale(1)"}},
        "@keyframes spSel": {
          "0%": {transform: "scale(1)"},
          "35%": {transform: "scale(.94)"},
          "70%": {transform: "scale(1.03)"},
          "100%": {transform: "scale(1)"},
        },
        "@keyframes spSpin": {to: {transform: "rotate(360deg)"}},
        "@keyframes spStepIn": {from: {transform: "translateX(28px)", opacity: 0}, to: {transform: "none", opacity: 1}},
        "@keyframes spStepBack": {from: {transform: "translateX(-28px)", opacity: 0}, to: {transform: "none", opacity: 1}},
        "@keyframes spFadeUp": {from: {transform: "translateY(14px)", opacity: 0}, to: {transform: "none", opacity: 1}},
        "@media (prefers-reduced-motion: reduce)": {
          "*, *::before, *::after": {
            animationDuration: "1ms !important",
            animationIterationCount: "1 !important",
            transitionDuration: "1ms !important",
            scrollBehavior: "auto !important",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: ({ownerState, theme}) => ({
          borderRadius: '8px',            // Adds border radius
          textTransform: 'none',          // Removes uppercase text transformation

          // Contained variant for team1
          ...(ownerState.color === 'team1' && ownerState.variant === 'contained' && {
            backgroundColor: theme.palette.team1.main,
            color: theme.palette.team1.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.team1.dark || theme.palette.team1.main,
            },
          }),

          // Outlined variant for team1
          ...(ownerState.color === 'team1' && ownerState.variant === 'outlined' && {
            border: `1px solid ${theme.palette.team1.main}`,
            color: theme.palette.team1.main,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: `${theme.palette.team1.main}0A`, // light transparent background on hover
            },
          }),

          // Contained variant for team2
          ...(ownerState.color === 'team2' && ownerState.variant === 'contained' && {
            backgroundColor: theme.palette.team2.main,
            color: theme.palette.team2.contrastText,
            '&:hover': {
              backgroundColor: theme.palette.team2.dark || theme.palette.team2.main,
            },
          }),

          // Outlined variant for team2
          ...(ownerState.color === 'team2' && ownerState.variant === 'outlined' && {
            border: `1px solid ${theme.palette.team2.main}`,
            color: theme.palette.team2.main,
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: `${theme.palette.team2.main}0A`, // light transparent background on hover
            },
          }),
        }),
      },
    },
  },
};

const theme = createTheme(themeOptions);

export default theme;
