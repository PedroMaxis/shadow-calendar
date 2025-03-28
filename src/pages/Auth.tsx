
import { useState } from "react";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);

  const toggleForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold mb-2">Minimal Calendar</h1>
        <p className="text-muted-foreground">
          A simple calendar app for managing your events
        </p>
      </div>
      
      {isLogin ? (
        <LoginForm onSwitch={toggleForm} />
      ) : (
        <RegisterForm onSwitch={toggleForm} />
      )}
    </div>
  );
};

export default Auth;
