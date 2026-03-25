import { useLocationInit } from './hooks/useLocationInit';

function App() {
  const { isLoading } = useLocationInit();

  if (isLoading) return null;

  // TODO: render full app layout (issue #8)
  return <></>;
}

export default App;
