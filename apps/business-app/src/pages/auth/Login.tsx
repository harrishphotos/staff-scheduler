import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store/store";
import { login } from "../../store/slices/authSlice";
import { useNavigate, useLocation, Link } from "react-router-dom";
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
import { Eye, EyeOff, User, Lock, Loader2 } from "lucide-react";

const Login = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const { status, error } = useSelector((state: RootState) => state.auth);

  // Timer effect to track loading time
  useEffect(() => {
    let interval: number;
    if (status === "loading") {
      setLoadingTime(0);
      interval = window.setInterval(() => {
        setLoadingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setLoadingTime(0);
    }
    return () => {
      if (interval) window.clearInterval(interval);
    };
  }, [status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resultAction = await dispatch(login({ email, password }));

    if (login.fulfilled.match(resultAction)) {
      customToast.success("Welcome back!");
      navigate(from, { replace: true });
    } else if (login.rejected.match(resultAction)) {
      customToast.error(resultAction.payload as string);
    }
  };

  const getLoadingMessage = () => {
    if (loadingTime < 5) return "Signing in...";
    if (loadingTime < 15) return "Connecting to server...";
    return "Server is waking up, please wait...";
  };

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
              <User className="w-7 h-7 text-white/75" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold text-white/95">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-white/55 text-sm">
                Sign in to your account to continue
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
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10"
                  />
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/50" />
                </div>
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
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="pl-10 pr-10 h-10 bg-white/5 border-white/10 text-white/90 placeholder:text-white/40 focus:border-white/20 focus:ring-1 focus:ring-white/10"
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
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-white/95 text-black hover:bg-white/85 font-medium h-10 transition-all duration-200 mt-4"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    {getLoadingMessage()}
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>

              {status === "loading" && loadingTime > 10 && (
                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-3 rounded-md text-sm text-center">
                  The server may be starting up from sleep mode. This can take
                  up to a minute on the first request.
                </div>
              )}

              <div className="text-center pt-1">
                <Link
                  to="/forgot-password"
                  className="text-sm text-white/55 hover:text-white/80 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
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
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-white/85 hover:text-white/95 underline underline-offset-4 font-medium transition-colors"
                >
                  Create one here
                </Link>
              </p>
              <p className="text-xs text-white/35">
                Secure login protected by enterprise-grade encryption
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
};

export default Login;
