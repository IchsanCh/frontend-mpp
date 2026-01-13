import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import logo from "../assets/images/logo.webp";
import { authService } from "../services/api";
const APP_NAME = import.meta.env.VITE_APP_NAME || "SANDIGI";
export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [touched, setTouched] = useState({ email: false, password: false });
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");

  const validateEmail = (value) => {
    if (!value) return "Email wajib diisi";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Format email tidak valid";
    return "";
  };

  const validatePassword = (value) => {
    if (!value) return "Password wajib diisi";
    if (value.length < 6) return "Password minimal 6 karakter";
    return "";
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setLoginError("");
    if (touched.email) {
      setErrors({ ...errors, email: validateEmail(value) });
    }
  };

  const handlePasswordChange = (e) => {
    const value = e.target.value;
    setPassword(value);
    setLoginError("");
    if (touched.password) {
      setErrors({ ...errors, password: validatePassword(value) });
    }
  };

  const handleEmailBlur = () => {
    setTouched({ ...touched, email: true });
    setErrors({ ...errors, email: validateEmail(email) });
    setFocusedField(null);
  };

  const handlePasswordBlur = () => {
    setTouched({ ...touched, password: true });
    setErrors({ ...errors, password: validatePassword(password) });
    setFocusedField(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    setTouched({ email: true, password: true });
    setErrors({ email: emailError, password: passwordError });
    setLoginError("");

    if (!emailError && !passwordError) {
      setIsLoading(true);
      try {
        const response = await authService.login(email, password);

        authService.saveToken(response.token);
        authService.saveUser(response.user);

        navigate("/admin/dashboard");
      } catch (error) {
        setLoginError(error.message || "Login gagal. Silakan coba lagi.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const isEmailValid = email && !errors.email && touched.email;
  const isPasswordValid = password && !errors.password && touched.password;

  return (
    <div className="min-h-screen flex items-center justify-center bgcolor4 p-4">
      <div className="w-full max-w-md">
        <div className="card bg-base-100 shadow-xl border borderc2 hover:shadow-2xl transition-all duration-200 bgcolor3">
          <div className="card-body p-8">
            <div className="text-center mb-8">
              <div className="avatar placeholder mb-4">
                <img
                  src={logo}
                  alt="Logo Instansi"
                  className="h-full object-cover w-16"
                />
              </div>
              <h2 className="text-2xl font-bold text-base-content">
                Login {APP_NAME}
              </h2>
            </div>

            {loginError && (
              <div className="alert alert-error mb-4">
                <AlertCircle className="h-5 w-5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black font-semibold">
                    Email
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 stroke-current transition-all duration-100 z-[10] ${
                        focusedField === "email"
                          ? "text-primary scale-110"
                          : errors.email && touched.email
                          ? "text-error"
                          : isEmailValid
                          ? "text-success"
                          : "text-base-content"
                      }`}
                    />
                  </div>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    className={`input input-bordered w-full pl-12 pr-12 transition-all duration-100 ${
                      focusedField === "email"
                        ? "input-primary border-2"
                        : errors.email && touched.email
                        ? "input-error"
                        : isEmailValid
                        ? "input-success"
                        : ""
                    }`}
                    value={email}
                    onChange={handleEmailChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={handleEmailBlur}
                    disabled={isLoading}
                  />
                  {touched.email && (
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      {errors.email ? (
                        <AlertCircle className="h-5 w-5 text-error" />
                      ) : isEmailValid ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : null}
                    </div>
                  )}
                </div>
                {touched.email && errors.email && (
                  <label className="label">
                    <span className="label-text-alt text-error font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.email}
                    </span>
                  </label>
                )}
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text text-black font-semibold">
                    Password
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock
                      className={`h-5 w-5 transition-all duration-100 z-[10] ${
                        focusedField === "password"
                          ? "text-primary scale-110"
                          : errors.password && touched.password
                          ? "text-error"
                          : isPasswordValid
                          ? "text-success"
                          : "text-base-content"
                      }`}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Masukkan password"
                    className={`input input-bordered w-full pl-12 pr-20 transition-all duration-100 ${
                      focusedField === "password"
                        ? "input-primary border-2"
                        : errors.password && touched.password
                        ? "input-error"
                        : isPasswordValid
                        ? "input-success"
                        : ""
                    }`}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={handlePasswordBlur}
                    disabled={isLoading}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center gap-2">
                    {touched.password && (
                      <>
                        {errors.password ? (
                          <AlertCircle className="h-5 w-5 text-error" />
                        ) : isPasswordValid ? (
                          <CheckCircle2 className="h-5 w-5 text-success" />
                        ) : null}
                      </>
                    )}
                    <button
                      type="button"
                      className="btn btn-ghost btn-xs btn-circle"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                {touched.password && errors.password && (
                  <label className="label">
                    <span className="label-text-alt text-error font-semibold flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {errors.password}
                    </span>
                  </label>
                )}
              </div>

              <button
                type="submit"
                className="btn bg-0 hover:bg-white hover:text-black shadow-md hover:shadow-xl transition-all duration-200 text-white w-full gap-2 group"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Memproses...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <span className="text-center mt-2 text-black">
              &copy; Mall Pelayanan Publik Kajen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
