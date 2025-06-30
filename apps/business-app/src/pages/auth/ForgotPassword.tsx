import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@lib/components/ui/card";
import { Button } from "@lib/components/ui/button";
import { Input } from "@lib/components/ui/input";
import { Label } from "@lib/components/ui/label";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      return "Email is required";
    }
    if (!emailRegex.test(email)) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const emailValidation = validateEmail(email);
    if (emailValidation) {
      setEmailError(emailValidation);
      return;
    }
    setEmailError("");

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset email sent!");
      } else {
        toast.error(data.error || "Failed to send reset email");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);

    // Clear error when user starts typing
    if (emailError) {
      setEmailError("");
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-black/80 border-white/20 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-4 text-center">
              <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/30">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Check Your Email
                </CardTitle>
                <CardDescription className="text-white/60">
                  We've sent a password reset link to your email address.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-green-400">
                    Reset Link Sent!
                  </h3>
                  <p className="text-sm text-white/60">
                    If an account with <strong>{email}</strong> exists, you'll
                    receive a password reset email within a few minutes.
                  </p>
                  <p className="text-xs text-white/40">
                    Don't see it? Check your spam folder or try again.
                  </p>
                </div>

                <div className="space-y-3">
                  <Link to="/login">
                    <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    onClick={() => setIsSuccess(false)}
                    className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-11 transition-all duration-200"
                  >
                    Try Different Email
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="text-center mt-6 text-white/40 text-sm">
            © 2024 Staff Management. All rights reserved.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      {/* Gradient Orbs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-black/80 border-white/20 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-white/10 rounded-full flex items-center justify-center border border-white/20">
              <Mail className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                Forgot Password?
              </CardTitle>
              <CardDescription className="text-white/60">
                Enter your email address and we'll send you a link to reset your
                password.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-white/80 text-sm font-medium"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={handleEmailChange}
                  className={`h-11 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 transition-all duration-200 ${
                    emailError
                      ? "border-red-500/50 focus:border-red-500/50"
                      : ""
                  }`}
                  disabled={isLoading}
                />
                {emailError && (
                  <p className="text-red-400 text-sm">{emailError}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Reset Link...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>

            <div className="text-center">
              <Link
                to="/login"
                className="text-white/60 hover:text-white transition-colors text-sm inline-flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Sign In
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6 text-white/40 text-sm">
          © 2024 Staff Management. All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
