"use client";

import {useState} from "react";
import SignUpForm from "../signup/ui/SignUpForm";

export default function SignUp() {
  const [created, setCreated] = useState(false);
  const handleFormSubmit = (success: boolean) => {
    setCreated(success);
  };

  return (
    <div>
      <SignUpForm onFormSubmit={handleFormSubmit} />
      {created && <p className="success">User created!</p>}
    </div>
  );
}
