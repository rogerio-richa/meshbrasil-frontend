import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles'; // Import ThemeProvider
import { themeCreator } from './base';

export const ThemeContext = React.createContext((themeName: string): void => {});

const ThemeProviderWrapper: React.FC = (props) => {
  const curThemeName = localStorage.getItem('appTheme') || 'PureLightTheme';
  const [themeName, _setThemeName] = useState(curThemeName);
  const theme = themeCreator(themeName);
  const setThemeName = (themeName: string): void => {
    localStorage.setItem('appTheme', themeName);
    _setThemeName(themeName);
  };

  return (
    <ThemeProvider theme={theme}> {/* Use ThemeProvider */}
      <ThemeContext.Provider value={setThemeName}>
        {props.children}
      </ThemeContext.Provider>
    </ThemeProvider>
  );
};

export default ThemeProviderWrapper;