import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { register, clearRegisterState } from "../../store/slices/authSlice";
import { Link, useNavigate } from "react-router-dom";
import customToast from "../../utils/toast";
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
  UserPlus,
  ArrowLeft,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Loader2,
  CheckCircle,
} from "lucide-react";

const Register = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});

  const { registerStatus, registerError, registerMessage } = useSelector(
    (state: RootState) => state.auth
  );

  // Clear register state when component mounts
  useEffect(() => {
    dispatch(clearRegisterState());
  }, [dispatch]);

  // Handle success and error messages
  useEffect(() => {
    if (registerStatus === "succeeded" && registerMessage) {
      customToast.success(
        "Registration successful! Check your email for verification."
      );
    } else if (registerStatus === "failed" && registerError) {
      customToast.error(registerError);
    }
  }, [registerStatus, registerError, registerMessage]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!formData.email) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    // Username validation
    if (!formData.username) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters long";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    // Password validation
    if (!formData.password) {
      errors.password = "Password is required";
    } else if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters long";
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear validation error for this field when user starts typing
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const resultAction = await dispatch(
      register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })
    );

    if (register.fulfilled.match(resultAction)) {
      // Success case - form will show success state
    }
  };

  // Show success state after registration
  if (registerStatus === "succeeded" && registerMessage) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/3 rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="relative z-10 w-full max-w-md">
          <Card className="bg-black/80 border-white/15 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 text-center pb-4">
              <div className="mx-auto w-14 h-14 bg-green-500/15 rounded-full flex items-center justify-center border border-green-500/25">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xl font-semibold text-white/95">
                  Registration Successful!
                </CardTitle>
                <CardDescription className="text-white/55 text-sm">
                  Please check your email to verify your account
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-2">
              <div className="text-center space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 space-y-3">
                  <h3 className="text-lg font-semibold text-green-400">
                    Email Verification Required
                  </h3>
                  <p className="text-sm text-white/60">
                    We've sent a verification link to{" "}
                    <strong className="text-white">{formData.email}</strong>.
                    Please click the link in your email to activate your
                    account.
                  </p>
                </div>

                <Link to="/login">
                  <Button className="w-full bg-white/95 text-black hover:bg-white/85 font-medium h-10 transition-all duration-200">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Button>
                </Link>
              </div>

              <div className="text-center space-y-1.5">
                <p className="text-xs text-white/35">
                  Didn't receive the email? Check your spam folder or contact
                  support.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/30">
              © 2024 StaffScheduler. All rights reserved.
            </p>
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
        <Card className="bg-black/80 border-white/15 backdrop-blur-xl shadow-2xl">
          <CardHeader className="space-y-3 text-center pb-4">
            <div className="mx-auto w-14 h-14 bg-white/8 rounded-full flex items-center justify-center border border-white/15">
              <UserPlus className="w-7 h-7 text-white/75" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-white/95">
                Create Account
              </CardTitle>
              <CardDescription className="text-white/55 text-sm">
                Join us and start managing your staff efficiently
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label
                  htmlFor="email"
                  className="text-white/70 text-sm font-medium"
                >
                  Email
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    className={`pl-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 ${
                      validationErrors.email
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : ""
                    }`}
                    required
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                </div>
                {validationErrors.email && (
                  <p className="text-red-400 text-xs">
                    {validationErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="username"
                  className="text-white/70 text-sm font-medium"
                >
                  Username
                </Label>
                <div className="relative">
                  <Input
                    id="username"
                    type="text"
                    placeholder="Choose a username"
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange("username", e.target.value)
                    }
                    className={`pl-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 ${
                      validationErrors.username
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : ""
                    }`}
                    required
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                </div>
                {validationErrors.username && (
                  <p className="text-red-400 text-xs">
                    {validationErrors.username}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="password"
                  className="text-white/70 text-sm font-medium"
                >
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
                    className={`pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 ${
                      validationErrors.password
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : ""
                    }`}
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/75 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="text-red-400 text-xs">
                    {validationErrors.password}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="confirmPassword"
                  className="text-white/70 text-sm font-medium"
                >
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    className={`pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10 ${
                      validationErrors.confirmPassword
                        ? "border-red-500/50 focus:ring-red-500/30"
                        : ""
                    }`}
                    required
                  />
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/50 hover:text-white/75 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-xs">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>

              {registerError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">
                  {registerError}
                </div>
              )}

              <Button
                type="submit"
                disabled={registerStatus === "loading"}
                className="w-full bg-white/95 text-black hover:bg-white/85 font-medium h-10 transition-all duration-200 mt-4"
              >
                {registerStatus === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-white/15" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-black px-2 text-white/50">or</span>
              </div>
            </div>

            <div className="text-center space-y-1.5">
              <p className="text-sm text-white/55">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-white/85 hover:text-white/95 underline underline-offset-4 font-medium transition-colors"
                >
                  Sign in here
                </Link>
              </p>
              <p className="text-xs text-white/35">
                By creating an account, you agree to our terms and privacy
                policy
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

export default Register;
