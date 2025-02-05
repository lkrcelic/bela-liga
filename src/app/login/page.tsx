"use client";

import LogInForm from "@/app/login/ui/LogInForm";
import {useRouter} from "next/navigation";
import {useState} from "react";
import Image from "next/image";
import {Box, Button} from "@mui/material";

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
    <>
      <Box sx={{gridArea: "top", alignItems: "center", display: "flex", justifyContent: "center"}}>
        <Image src="/TitleBackgroundSponsors.png"
               alt="Logo"
               width={500}
               height={500}
               style={{width: '80%', height: 'auto', maxWidth: "600px"}}
        />
      </Box>
      <Box sx={{gridArea: "body"}}>
        <LogInForm onFormSubmit={handleFormSubmit}/>
        {success === true && <p className="success">Login successfull!</p>}
        {success === false && <p className="error-button">Username or password are incorrect.</p>}
      </Box>
      <Box
        sx={{
          gridArea: "actions",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Button
          onClick={() => router.push('/signup')}
          variant="text"
          color="primary"
          sx={{
            textTransform: "none",
            fontSize: "16px",
          }}
        >
          Nemaš profil? Registriraj se
        </Button>
      </Box>
    </>
  );
}
