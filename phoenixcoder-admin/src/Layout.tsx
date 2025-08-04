import type { ReactNode } from "react";
import React from 'react';
import { CheckForApplicationUpdate } from "react-admin";
import CustomLayout from "./shared/components/CustomLayout";

export const Layout = ({ children, toggleTheme }: { children: React.ReactNode, toggleTheme?: () => void }) => (
  <CustomLayout toggleTheme={toggleTheme}>
    {children}
    <CheckForApplicationUpdate />
  </CustomLayout>
);
