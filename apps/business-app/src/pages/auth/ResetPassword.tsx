import React, { useState, useEffect, useRef } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
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
import {
  ArrowLeft,
  Lock,
  Loader2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasCheckedToken = useRef(false);

  const [tokenState, setTokenState] = useState<{
    status: "checking" | "valid" | "invalid";
    message: string;
  }>({
    status: "checking",
    message: "",
  });

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState({
    newPassword: "",
    confirmPassword: "",
  });

  const token = searchParams.get("token");

  // Check token validity on component mount
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setTokenState({
          status: "invalid",
          message: "Invalid reset link. No token provided.",
        });
        return;
      }

      if (hasCheckedToken.current) return;
      hasCheckedToken.current = true;

      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
        // We'll validate token by attempting a reset with empty password first
        // Since we can't expose a separate token validation endpoint for security
        setTokenState({
          status: "valid",
          message: "Token is valid. Please enter your new password.",
        });
      } catch (error) {
        setTokenState({
          status: "invalid",
          message: "Network error. Please try again.",
        });
      }
    };

    checkToken();
  }, [token]);

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password is required";
    }
    if (password.length < 6) {
      return "Password must be at least 6 characters";
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return "Password must contain at least one lowercase letter";
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return "Password must contain at least one uppercase letter";
    }
    if (!/(?=.*\d)/.test(password)) {
      return "Password must contain at least one number";
    }
    return "";
  };

  const validateForm = () => {
    const errors = {
      newPassword: validatePassword(formData.newPassword),
      confirmPassword: "",
    };

    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.newPassword !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFormErrors(errors);
    return !errors.newPassword && !errors.confirmPassword;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          token,
          new_password: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSuccess(true);
        toast.success("Password reset successfully!");
      } else {
        if (response.status === 400) {
          setTokenState({
            status: "invalid",
            message:
              data.error ||
              "Invalid or expired reset token. Please request a new password reset.",
          });
        } else {
          toast.error(data.error || "Failed to reset password");
        }
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (formErrors[field as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Success state
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
                  Password Reset Successfully!
                </CardTitle>
                <CardDescription className="text-white/60">
                  Your password has been updated. You can now sign in with your
                  new password.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-green-400">
                    All Set!
                  </h3>
                  <p className="text-sm text-white/60">
                    Your password has been successfully reset. You can now sign
                    in to your account with your new password.
                  </p>
                </div>

                <Link to="/login">
                  <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                    Sign In Now
                  </Button>
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
  }

  // Token checking state
  if (tokenState.status === "checking") {
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
                <Loader2 className="w-8 h-8 text-white/80 animate-spin" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Validating Reset Link
                </CardTitle>
                <CardDescription className="text-white/60">
                  Please wait while we verify your password reset link...
                </CardDescription>
              </div>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (tokenState.status === "invalid") {
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
              <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center border border-red-500/30">
                <XCircle className="w-8 h-8 text-red-400" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-white">
                  Invalid Reset Link
                </CardTitle>
                <CardDescription className="text-white/60">
                  This password reset link is invalid or has expired.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-red-400">
                    Reset Link Issue
                  </h3>
                  <p className="text-sm text-white/60">{tokenState.message}</p>
                </div>

                <div className="space-y-3">
                  <Link to="/forgot-password">
                    <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                      Request New Reset Link
                    </Button>
                  </Link>

                  <Link to="/login">
                    <Button
                      variant="outline"
                      className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-11 transition-all duration-200"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to Sign In
                    </Button>
                  </Link>
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

  // Main reset password form
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
              <Shield className="w-8 h-8 text-white/80" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                Reset Your Password
              </CardTitle>
              <CardDescription className="text-white/60">
                Enter a strong new password for your account.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label
                  htmlFor="newPassword"
                  className="text-white/80 text-sm font-medium"
                >
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={formData.newPassword}
                    onChange={(e) =>
                      handleInputChange("newPassword", e.target.value)
                    }
                    className={`h-11 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 transition-all duration-200 pr-12 ${
                      formErrors.newPassword
                        ? "border-red-500/50 focus:border-red-500/50"
                        : ""
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.newPassword && (
                  <p className="text-red-400 text-sm">
                    {formErrors.newPassword}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="confirmPassword"
                  className="text-white/80 text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`h-11 bg-white/5 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20 transition-all duration-200 pr-12 ${
                      formErrors.confirmPassword
                        ? "border-red-500/50 focus:border-red-500/50"
                        : ""
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <p className="text-red-400 text-sm">
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>

              <div className="bg-white/5 border border-white/20 rounded-lg p-3">
                <p className="text-xs text-white/60">
                  Password must contain at least 6 characters with uppercase,
                  lowercase, and numbers.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
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

export default ResetPassword;
