import BrandingLoginForm from "@/components/auth/branding-login-form";
import LoginForm from "@/components/auth/login-form";

const LoginPage = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left - Branding */}
      <BrandingLoginForm/>

      {/* Right - Form */}
      <LoginForm/>
    </div>
  );
};

export default LoginPage;
