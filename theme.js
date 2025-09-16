// theme.js
import { DefaultTheme } from 'react-native-paper';

const theme = {
  ...DefaultTheme, // safe across Paper versions
  colors: {
    ...DefaultTheme.colors,
    primary: '#2dfb6e',
    surface: '#123a2d',
    background: '#0b3d2e',
    text: '#e8fff1',
    outline: 'rgba(45,251,110,.35)',
  },
};

export default theme;
