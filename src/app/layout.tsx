"use client";

import React from "react";
import theme from "@/app/styles/theme";
import {ThemeProvider} from "@mui/system";
import {Box} from "@mui/material";

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
    <ThemeProvider theme={theme}>
      <body style={{backgroundColor: '#F5F5F5'}}>
      <Box
        sx={{
          display: "grid",
          gridTemplateRows: "auto 1fr auto",
          gridTemplateAreas: `
                    "top"
                    "body"
                    "actions"
                `,
          height: "85vh",
          paddingX: 2,
          paddingTop: 1,
          gap: 4,
        }}
      >
        {children}
      </Box>
      </body>
    </ThemeProvider>
    </html>
  );
}
