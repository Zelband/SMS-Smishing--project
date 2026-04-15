import { createBrowserRouter } from "react-router";
import { SignIn } from "./components/SignIn";
import { EnterPassword } from "./components/EnterPassword";
import { VerifyMfa } from "./components/VerifyMfa";
import { EnterCode } from "./components/EnterCode";
import { Dashboard } from "./components/Dashboard";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: SignIn,
  },
  {
    path: "/sign-in",
    Component: SignIn,
  },
  {
    path: "/password",
    Component: EnterPassword,
  },
  {
    path: "/verify",
    Component: VerifyMfa,
  },
  {
    path: "/enter-code",
    Component: EnterCode,
  },
  {
    path: "/dashboard",
    Component: Dashboard,
  },
]);
