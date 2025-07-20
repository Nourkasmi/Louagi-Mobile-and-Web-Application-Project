// app/(passenger)/bookings/index.styles.ts 

import { StyleSheet } from 'react-native';
import { theme } from '../../../src/styles/theme';
import { sharedComponents } from '../../../src/styles/shared/components';

export const styles = StyleSheet.create({
    // Main container
    container: {
        ...theme.utils.container(false),
        backgroundColor: theme.colors.background.primary,
    },

    // Loading and error states
    centered: {
        ...sharedComponents.layouts.centered,
        padding: theme.spacing.huge,
    },

    loadingText: {
        ...theme.typography.body1,
        marginTop: theme.spacing.md,
        color: theme.colors.text.secondary,
    },

    errorText: {
        ...theme.typography.heading4,
        color: theme.colors.text.danger,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },

    retryButton: {
        ...theme.utils.button('primary'),
        paddingHorizontal: theme.spacing.xl,
    },

    retryButtonText: {
        ...theme.typography.buttonMedium,
    },

    // List container
    listContainer: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.huge,
    },

    separator: {
        height: theme.spacing.sm,
    },
});