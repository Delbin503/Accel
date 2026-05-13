import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useAppStore } from "store";
import { PrimaryButton } from "components/common/Button";
import { useLoginUserMutation } from "services/auth";

const Login = () => {
  const navigate = useNavigate();
  const { setUser, setLoading, setError } = useAppStore();
  const [showPassword, setShowPassword] = useState(false);
  const loginUserMutation = useLoginUserMutation();

  // Validation schema using Yup
  const validationSchema = Yup.object({
    nric: Yup.string().required("nric is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  // Initial form values
  const initialValues = {
    nric: "",
    password: "",
  };

  // Handle form submission
  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await loginUserMutation.mutateAsync({
        email: values?.nric?.trim(),
        password: values?.password?.trim(),
      });

      //   Store token in localStorage
      localStorage.setItem("accessToken", response.token);

      // Update user state
      setUser({
        name: response.currentUser.name,
        nric: response.currentUser.nric,
        token: response.token,
      });

      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      setError(error.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img src="/icons/accel-logo-lg.svg" alt="Accel" className="h-[61px]" />
        </div>

        {/* Login Card */}
        <div className="bg-surface-deeper rounded-lg border border-neutral-700 p-8">
          <h1 className="text-2xl font-semibold text-white mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-400 text-sm mb-6">
            Sign in to your account to continue
          </p>

          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting, errors, touched }) => (
              <Form className="space-y-4">
                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm text-textSecondary font-medium mb-2"
                  >
                    NRIC <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="text"
                    name="nric"
                    id="nric"
                    placeholder="Enter your NRIC"
                    className={`w-full px-4 py-2.5 bg-transparent text-textSecondary rounded-lg border ${
                      errors.nric && touched.nric
                        ? "border-red-500"
                        : "border-neutral-700"
                    } focus:border-brand focus:outline-none placeholder-gray-500 hover:border-neutralHover`}
                  />
                  <ErrorMessage
                    name="nric"
                    component="p"
                    className="mt-1 text-sm text-red-400"
                  />
                </div>

                {/* Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-sm text-textSecondary font-medium mb-2"
                  >
                    Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Field
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      placeholder="Enter your password"
                      className={`w-full px-4 py-2.5 pr-12 bg-transparent text-textSecondary rounded-lg border ${
                        errors.password && touched.password
                          ? "border-red-500"
                          : "border-neutral-700"
                      } focus:border-brand focus:outline-none placeholder-gray-500 hover:border-neutralHover`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  <ErrorMessage
                    name="password"
                    component="p"
                    className="mt-1 text-sm text-red-400"
                  />
                </div>

                {/* Submit Button */}
                <PrimaryButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Signing in..." : "Sign In"}
                </PrimaryButton>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default Login;
