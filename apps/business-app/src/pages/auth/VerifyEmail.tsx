import React, { useState, useEffect, useRef } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@lib/components/ui/card";
import { Button } from "@lib/components/ui/button";
import { CheckCircle, XCircle, Loader2, ArrowLeft, Mail } from "lucide-react";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const hasVerified = useRef(false); // Prevent double requests in StrictMode
  const [verificationState, setVerificationState] = useState<{
    status: "loading" | "success" | "error";
    message: string;
  }>({
    status: "loading",
    message: "",
  });
  const [countdown, setCountdown] = useState(5);

  const token = searchParams.get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setVerificationState({
          status: "error",
          message: "Invalid verification link. No token provided.",
        });
        return;
      }

      // Prevent double requests caused by React StrictMode
      if (hasVerified.current) {
        return;
      }
      hasVerified.current = true;

      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8081";
        const response = await fetch(
          `${API_URL}/api/auth/verify-email?token=${token}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok) {
          // Check if user was already verified or newly verified
          const isAlreadyVerified = data.already_verified;
          const isNewlyVerified = data.newly_verified;

          setVerificationState({
            status: "success",
            message: data.message || "Email verified successfully!",
          });

          if (isAlreadyVerified) {
            toast.success("Email already verified! You can sign in now.");
          } else if (isNewlyVerified) {
            toast.success("Email verified successfully! You can now sign in.");
          } else {
            toast.success("Email verified successfully! You can now sign in.");
          }
        } else {
          // Handle different error cases based on backend suggestions
          const suggestion = data.suggestion;
          let errorMessage =
            data.error || "Verification failed. Please try again.";

          if (suggestion === "try_login") {
            errorMessage =
              "This verification link may have already been used. If you recently verified your email, try signing in directly.";
            toast.error("Verification link already used. Try signing in!");
          } else if (suggestion === "request_new_token") {
            errorMessage =
              "Verification link has expired. Please register again or contact support.";
            toast.error("Verification link expired");
          } else {
            toast.error(data.error || "Verification failed");
          }

          setVerificationState({
            status: "error",
            message: errorMessage,
          });
        }
      } catch (error) {
        setVerificationState({
          status: "error",
          message: "Network error. Please check your connection and try again.",
        });
        toast.error("Network error occurred");
      }
    };

    verifyEmail();
  }, [token]);

  // Auto redirect to login after successful verification
  useEffect(() => {
    let timer: number;

    if (verificationState.status === "success") {
      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            navigate("/login");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [verificationState.status, navigate]);

  const getStatusConfig = () => {
    switch (verificationState.status) {
      case "loading":
        return {
          icon: <Loader2 className="w-8 h-8 text-white/80 animate-spin" />,
          iconBg: "bg-white/10",
          iconBorder: "border-white/20",
          title: "Verifying Email",
          description: "Please wait while we verify your email address...",
        };
      case "success":
        return {
          icon: <CheckCircle className="w-8 h-8 text-green-400" />,
          iconBg: "bg-green-500/20",
          iconBorder: "border-green-500/30",
          title: "Email Verified!",
          description:
            "Your email has been successfully verified. You can now sign in to your account.",
        };
      case "error":
        return {
          icon: <XCircle className="w-8 h-8 text-red-400" />,
          iconBg: "bg-red-500/20",
          iconBorder: "border-red-500/30",
          title: "Verification Failed",
          description:
            "We couldn't verify your email address. The link may be expired or invalid.",
        };
      default:
        return {
          icon: <Mail className="w-8 h-8 text-white/80" />,
          iconBg: "bg-white/10",
          iconBorder: "border-white/20",
          title: "Email Verification",
          description: "Processing your request...",
        };
    }
  };

  const statusConfig = getStatusConfig();

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
            <div
              className={`mx-auto w-16 h-16 ${statusConfig.iconBg} rounded-full flex items-center justify-center border ${statusConfig.iconBorder}`}
            >
              {statusConfig.icon}
            </div>
            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-white">
                {statusConfig.title}
              </CardTitle>
              <CardDescription className="text-white/60">
                {statusConfig.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {verificationState.status === "loading" && (
              <div className="text-center">
                <div className="bg-white/5 border border-white/20 rounded-lg p-6 space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-white/60 rounded-full animate-bounce delay-200"></div>
                  </div>
                  <p className="text-sm text-white/60">
                    Verifying your email address...
                  </p>
                </div>
              </div>
            )}

            {verificationState.status === "success" && (
              <div className="text-center space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-green-400">
                    Verification Complete!
                  </h3>
                  <p className="text-sm text-white/60">
                    {verificationState.message}
                  </p>
                  <div className="mt-4 p-3 bg-white/5 rounded-md">
                    <p className="text-xs text-white/60">
                      Redirecting to sign in page in{" "}
                      <span className="text-white font-medium">
                        {countdown}
                      </span>{" "}
                      seconds...
                    </p>
                  </div>
                </div>

                <Link to="/login">
                  <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                    Continue to Sign In
                  </Button>
                </Link>
              </div>
            )}

            {verificationState.status === "error" && (
              <div className="text-center space-y-4">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-red-400">
                    Verification Issue
                  </h3>
                  <p className="text-sm text-white/60">
                    {verificationState.message}
                  </p>
                </div>

                <div className="space-y-3">
                  {/* If link was already used, prioritize login */}
                  {verificationState.message.includes("already been used") ||
                  verificationState.message.includes("try signing in") ? (
                    <>
                      <Link to="/login">
                        <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                          Try Signing In
                        </Button>
                      </Link>

                      <Link to="/register">
                        <Button
                          variant="outline"
                          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-11 transition-all duration-200"
                        >
                          Create New Account
                        </Button>
                      </Link>
                    </>
                  ) : verificationState.message.includes("expired") ? (
                    <>
                      <Link to="/register">
                        <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                          Register Again
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
                    </>
                  ) : (
                    /* Default error actions */
                    <>
                      <Link to="/login">
                        <Button className="w-full bg-white text-black hover:bg-white/90 font-medium h-11 transition-all duration-200">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back to Sign In
                        </Button>
                      </Link>

                      <Link to="/register">
                        <Button
                          variant="outline"
                          className="w-full bg-transparent border-white/20 text-white hover:bg-white/10 h-11 transition-all duration-200"
                        >
                          Create New Account
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="text-center space-y-2">
              <p className="text-xs text-white/40">
                Having trouble? Contact our support team for assistance.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-white/40">
            © 2024 StaffScheduler. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
