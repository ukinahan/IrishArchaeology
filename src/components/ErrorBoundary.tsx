// src/components/ErrorBoundary.tsx
// Top-level error boundary so a render-time crash in any screen falls back
// to a recoverable UI instead of a frozen white app.
import { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, RADII } from '../utils/theme';
import { reportError } from '../utils/telemetry';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    reportError(error, { componentStack: info.componentStack });
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <View style={styles.root}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            The app hit an unexpected error. Tap below to try again.
          </Text>
          <Text style={styles.detail} numberOfLines={3}>
            {this.state.error.message}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Try again</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.forestDark,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  title: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: '800',
    color: COLORS.parchment,
    textAlign: 'center',
  },
  body: {
    fontSize: FONTS.sizes.md,
    color: COLORS.stoneLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  detail: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.stone,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    marginTop: 16,
    backgroundColor: COLORS.gold,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: RADII.full,
  },
  buttonText: {
    color: COLORS.forestDark,
    fontWeight: '700',
    fontSize: FONTS.sizes.md,
  },
});
