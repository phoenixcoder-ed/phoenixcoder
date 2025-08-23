import React from 'react';

import CustomLayout from './shared/components/CustomLayout';

export const Layout = ({
  children,
  toggleTheme,
}: {
  children: React.ReactNode;
  toggleTheme?: () => void;
}) => <CustomLayout toggleTheme={toggleTheme}>{children}</CustomLayout>;
