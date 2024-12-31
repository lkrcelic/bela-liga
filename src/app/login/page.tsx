"use client";

import LogInForm from "@/app/login/ui/LogInForm";
import {useRouter} from "next/navigation";
import {useState} from "react";

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
    <div>
      <LogInForm onFormSubmit={handleFormSubmit} />
      {success === true && <p className="success">Login successfull!</p>}
      {success === false && <p className="error-button">Username or password are incorrect.</p>}
    </div>
  );
}
