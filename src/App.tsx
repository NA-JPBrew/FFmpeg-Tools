import { VideoEditor } from './components/VideoEditor'
import { ThemeProvider, CssBaseline, Container, Typography, Box } from '@mui/material';
import { theme } from './theme';
import './App.css'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            FFmpeg Video Filter
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Обработка на видео от страна на клиента, поддържана от WebAssembly
          </Typography>
          <VideoEditor />
        </Box>
      </Container>
    </ThemeProvider>
  )
}

export default App
