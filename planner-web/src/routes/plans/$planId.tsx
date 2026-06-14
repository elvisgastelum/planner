import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, Outlet } from "@tanstack/react-router"
import {
  ArrowDownToLine,
  CalendarDays,
  Home,
  Landmark,
  Menu,
  Repeat,
  Settings,
  Tag,
  TriangleAlert,
} from "lucide-react"
import { useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton, StatusBadge } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.overview(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  errorComponent: ({ error, reset }) => (
    <main className="mx-auto w-full max-w-6xl p-6 text-sm text-destructive">
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={reset}>Reload</Button>
        </CardContent>
      </Card>
    </main>
  ),
  notFoundComponent: NotFoundComponent,
  component: PlanShell,
})

const navItems = [
  { label: "Overview", to: "/plans/$planId", exact: true, icon: Home },
  {
    label: "Accounts",
    to: "/plans/$planId/accounts",
    exact: false,
    icon: Landmark,
  },
  {
    label: "Categories",
    to: "/plans/$planId/categories",
    exact: false,
    icon: Tag,
  },
  {
    label: "Income",
    to: "/plans/$planId/income",
    exact: false,
    icon: ArrowDownToLine,
  },
  {
    label: "Payment Periods",
    to: "/plans/$planId/payment-periods",
    exact: false,
    icon: CalendarDays,
  },
  {
    label: "Recurring Expenses",
    to: "/plans/$planId/recurring-expenses",
    exact: false,
    icon: Repeat,
  },
]

const bottomNavItems = [
  {
    label: "Settings",
    to: "/plans/$planId/edit",
    exact: false,
    icon: Settings,
  },
  {
    label: "Danger Zone",
    to: "/plans/$planId/danger",
    exact: false,
    icon: TriangleAlert,
  },
]

function PlanShell() {
  const { planId } = Route.useParams()
  const { data: overview } = useSuspenseQuery(planQueries.overview(planId))
  const [drawerOpen, setDrawerOpen] = useState(false)

  function handleNav() {
    setDrawerOpen(false)
  }

  return (
    <div className="flex min-h-[calc(100svh-65px)]">
      {/* Desktop sidebar */}
      <aside className="hidden w-60 shrink-0 border-r bg-card/40 md:flex md:flex-col">
        <div className="flex flex-col gap-1 p-4">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Link
              className="truncate text-sm font-semibold transition-colors hover:text-primary"
              params={{ planId }}
              to="/plans/$planId"
            >
              {overview.name}
            </Link>
            <StatusBadge value={overview.status} />
          </div>
          {navItems.map((item) => (
            <SidebarLink
              key={item.to}
              exact={item.exact}
              icon={item.icon}
              label={item.label}
              planId={planId}
              to={item.to}
            />
          ))}
        </div>
        <div className="mt-auto flex flex-col gap-1 p-4 pt-0">
          {bottomNavItems.map((item) => (
            <SidebarLink
              key={item.to}
              exact={item.exact}
              icon={item.icon}
              label={item.label}
              planId={planId}
              to={item.to}
            />
          ))}
        </div>
      </aside>

      {/* Mobile drawer */}
      <Sheet onOpenChange={setDrawerOpen} open={drawerOpen}>
        <SheetTrigger asChild>
          <Button
            className="fixed bottom-4 left-4 z-40 md:hidden"
            size="icon"
            variant="secondary"
          >
            <Menu />
            <span className="sr-only">Open navigation</span>
          </Button>
        </SheetTrigger>
        <SheetContent className="w-60 p-0" showCloseButton={false} side="left">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b p-4">
              <Link
                className="truncate text-sm font-semibold"
                params={{ planId }}
                to="/plans/$planId"
                onClick={handleNav}
              >
                {overview.name}
              </Link>
              <StatusBadge value={overview.status} />
            </div>
            <div className="flex flex-col gap-1 p-4">
              {navItems.map((item) => (
                <SidebarLink
                  key={item.to}
                  exact={item.exact}
                  icon={item.icon}
                  label={item.label}
                  onClick={handleNav}
                  planId={planId}
                  to={item.to}
                />
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-1 border-t p-4">
              {bottomNavItems.map((item) => (
                <SidebarLink
                  key={item.to}
                  exact={item.exact}
                  icon={item.icon}
                  label={item.label}
                  onClick={handleNav}
                  planId={planId}
                  to={item.to}
                />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <main className="min-w-0 flex-1">
        <Outlet />
      </main>
    </div>
  )
}

function SidebarLink({
  exact,
  icon: Icon,
  label,
  onClick,
  planId,
  to,
}: {
  exact: boolean
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: () => void
  planId: string
  to: string
}) {
  return (
    <Link
      activeOptions={exact ? { exact: true } : undefined}
      activeProps={{
        className: "bg-accent text-accent-foreground font-medium",
      }}
      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onClick}
      params={{ planId }}
      to={to}
    >
      <Icon className="size-4" />
      {label}
    </Link>
  )
}

function NotFoundComponent() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Plan not found</h1>
      <p className="text-muted-foreground">
        This plan does not exist or has been deleted.
      </p>
      <Button asChild className="w-fit" variant="outline">
        <Link to="/plans">Back to plans</Link>
      </Button>
    </main>
  )
}
