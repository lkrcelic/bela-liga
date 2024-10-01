"use client";

import React from "react";
import theme from "@/app/styles/theme";
import {ThemeProvider} from "@mui/system";

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
        <ThemeProvider theme={theme}>
            <body style={{ backgroundColor: '#F5F5F5' }}>{children}</body>
        </ThemeProvider>
        </html>
    );
}
