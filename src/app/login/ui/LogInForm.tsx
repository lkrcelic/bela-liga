"use client";

import {useState} from "react";
import styles from "@/app/styles/Form.modules.css";
import {PlayerCreate} from "@/app/interfaces/player";
import {LoginUser, LoginUserInterface} from "@/app/interfaces/login";
import {loginUser} from "@/app/fetchers/authentication/login";

type FormField = keyof typeof LoginUser.shape;
type ErrorState = Partial<Record<FormField, string>>;

interface LogInFormProperties {
  onFormSubmit?: (success: boolean) => void;
}

export default function LogInForm({onFormSubmit}: LogInFormProperties) {
  let initialState = {
    username: "",
    password: "",
  } as LoginUserInterface;
  const [formData, setFormData] = useState(initialState);
  const [errors, setErrors] = useState<ErrorState>({});

  const handleChange = (e: any) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});

    const fieldName = name as FormField;
    try {
      PlayerCreate.pick({[fieldName]: true} as Record<FormField, true>).parse({[name]: value});
      setErrors((prevErrors) => ({...prevErrors, [fieldName]: undefined}));
    } catch (error: any) {
      if (error.errors && error.errors[0]) {
        setErrors((prevErrors) => ({
          ...prevErrors,
          [fieldName]: error.errors[0].message,
        }));
      }
    }
  };

  async function handleSubmit(e: any) {
    e.preventDefault();
    try {
      const isAllFieldsFilled = Object.values(formData).every((value) => (value as string).trim() !== "");
      if (!isAllFieldsFilled) throw new Error("Required properties are empty.");
    } catch (error) {
      let keys = Object.keys(formData) as FormField[];
      keys.forEach((key) => {
        if ((formData[key] as string).trim() === "") {
          errors[key] = key + " is a required property!";
        }
      });
      setErrors((prevErrors) => ({
        ...prevErrors,
      }));
      return;
    }
    try {
      const parsedData = LoginUser.parse(formData);
      let success = await loginUser(parsedData);
      if (onFormSubmit) onFormSubmit(success);
      if (success) setFormData({...initialState});
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label htmlFor="username">Username</label>
      <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} />
      {errors.username && <p className="error">{errors.username}</p>}
      <label htmlFor="password" className={styles.label}>
        Password
      </label>
      <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} />
      {errors.password && <p className="error">{errors.password}</p>}
      <button type="submit" className={styles.button}>
        Submit
      </button>
    </form>
  );
}
