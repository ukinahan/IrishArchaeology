// Root entry point — redirect to the splash/selection screen.
// The actual splash UI lives at /welcome so that the explorer tab
// (also at /) doesn't shadow it when navigating "Back to start".
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/welcome" />;
}
