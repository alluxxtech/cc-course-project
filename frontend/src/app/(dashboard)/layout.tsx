import { AuthGuard } from "../../components/auth-guard";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <AuthGuard>{children}</AuthGuard>;
}
