import React, { useEffect } from 'react';
import Button from '@mui/material/Button';
import { createDockerDesktopClient } from '@docker/extension-api-client';
import { Stack, TextField, Typography, Container } from '@mui/material';
import CodeTextArea from '@uiw/react-textarea-code-editor'

// Note: This line relies on Docker Desktop's presence as a host application.
// If you're running this React app in a browser, it won't work properly.
const client = createDockerDesktopClient();

function useDockerDesktopClient() {
  return client;
}

export function App() {
  const [response, setResponse] = React.useState<string>();
	const [fetchItConfig, setFetchItConfig] = React.useState('');
  const ddClient = useDockerDesktopClient();

  const fetchAndDisplayResponse = async () => {
    const result = await ddClient.extension.vm?.service?.get('/hello');
    setResponse(JSON.stringify(result));
  };

	useEffect(() => {
		document.documentElement.setAttribute('data-color-mode', 'dark')
	})

  return (
    <Container style={{
			backgroundColor: "#27272a"
		}}>
      <Typography variant="h2"
				style={{
					color: "#eaeaeb",
				}}
			>FetchIt</Typography>
      <Typography variant="body1"
				style={{
					color: "#f7f7f7"
				}}
				sx={{ mt: 2 }}
			>
				Please provide a configuration for your FetchIt instance:	
			</Typography>
      <Stack direction="column" alignItems="start" spacing={2} sx={{ mt: 4 }}>
			<CodeTextArea
				value={fetchItConfig}
				language="yaml"
				placeholder="Enter your FetchIt config here."
				padding={15}
				onChange={e => setFetchItConfig(e.target.value)}
				style={{
					minWidth: '100%',
					backgroundColor: "#18181b",
					fontSize: 16,
					minHeight: '160px',
					height: 'fit-content',
					borderColor: '#535867',
					borderWidth: '1px',
					borderRadius: '0.25rem'
				}}
			/>
			<Button
				variant='contained'
				onClick={() => console.log('pushed!')}
				sx={{ mt: 2 }}
				style={{
					backgroundColor: '#8c4afd'
				}}
			>Submit</Button>

      </Stack>
    </Container>
  );
}
