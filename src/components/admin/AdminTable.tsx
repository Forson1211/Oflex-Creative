import * as React from "react";

import { cn } from "@/lib/utils";

export const ADMIN_TABLE_HEADER_CLASS =
  "sticky top-0 z-10 bg-muted/80 backdrop-blur supports-[backdrop-filter]:bg-muted/60";

type AdminTableContainerProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared wrapper for admin tables:
 * - Card styling
 * - Horizontal scroll on small screens
 */
export function AdminTableContainer({ children, className }: AdminTableContainerProps) {
  return (
    <div className={cn("bg-card border border-border rounded-xl overflow-hidden", className)}>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

type AdminTableProps = React.TableHTMLAttributes<HTMLTableElement> & {
  /** Tailwind min-width class for the table, e.g. "min-w-[760px]" */
  minWidthClassName?: string;
  containerClassName?: string;
};

/**
 * Convenience component for native <table> usage inside admin pages.
 * (Use AdminTableContainer for shadcn <Table>.)
 */
export function AdminTable({
  className,
  minWidthClassName,
  containerClassName,
  children,
  ...props
}: AdminTableProps) {
  return (
    <AdminTableContainer className={containerClassName}>
      <table
        {...props}
        className={cn("w-full", minWidthClassName, className)}
      >
        {children}
      </table>
    </AdminTableContainer>
  );
}
