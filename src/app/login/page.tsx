"use client";

import LogInForm from "@/app/login/ui/LogInForm";
import {useRouter} from "next/navigation";
import {useState} from "react";
import {Alert, Box, Button, Divider, Paper, Typography} from "@mui/material";

export default function LogIn() {
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const router = useRouter();

  const handleFormSubmit = (success: boolean) => {
    setSuccess(success);
    if (success) {
      setTimeout(() => router.push("/"), 100);
    }
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: 'calc(100vh - 90px)',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      px: 2,
      py: 4
    }}>
      <Box sx={{
        width: "100%",
        backgroundColor: 'none',
        pb: 4,
        position: 'sticky',
        zIndex: 10
      }}>
        <Typography variant="h4" component="h1" sx={{
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'primary.main',
          pb: 1,
        }}>
          Piatnik Bela Liga
        </Typography>
      <Divider/>
      </Box>
      <Paper
        elevation={3}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 3,
          borderRadius: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h1"
          sx={{
            mb: 3,
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'primary.main'
          }}
        >
          Prijava
        </Typography>

        <LogInForm onFormSubmit={handleFormSubmit}/>

        {success === true && (
          <Alert severity="success" sx={{mt: 2}}>
            Prijava uspješna!
          </Alert>
        )}

        {success === false && (
          <Alert severity="error" sx={{mt: 2}}>
            Korisničko ime ili lozinka su netočni.
          </Alert>
        )}
      </Paper>

      <Button
        onClick={() => router.push('/signup')}
        variant="text"
        color="primary"
        sx={{
          textTransform: "none",
          fontSize: "16px",
          fontWeight: "medium",
          mt: 3
        }}
      >
        Nemaš profil? Registriraj se
      </Button>
    </Box>
  );
}
