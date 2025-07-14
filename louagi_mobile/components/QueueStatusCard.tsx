// 📁 louagi_mobile/components/QueueStatusCard.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { getDriverStatus } from '../src/services/api';

interface QueueInfo {
  position: number;
  status: string;
  waitingTimeMinutes: number;
  estimatedDepartureTime: string;
  formattedDepartureTime: string;
  minutesUntilDeparture: number;
  station: string;
  destination: string;
  schedule: string;
  scheduleStatus: string;
}

interface QueueStatusCardProps {
  onRefresh?: () => void;
  onLeaveQueue?: () => void;
}

export const QueueStatusCard: React.FC<QueueStatusCardProps> = ({
  onRefresh,
  onLeaveQueue,
}) => {
  const [queueInfo, setQueueInfo] = useState<QueueInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inQueue, setInQueue] = useState(false);

  const fetchQueueStatus = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDriverStatus();
      
      if (response.success && response.data) {
        const { queueEntry } = response.data;
        
        if (queueEntry) {
          setInQueue(true);
          setQueueInfo({
            position: queueEntry.position || 0,
            status: queueEntry.status || 'waiting',
            waitingTimeMinutes: Math.round((new Date().getTime() - new Date(queueEntry.joinedAt).getTime()) / (1000 * 60)),
            estimatedDepartureTime: queueEntry.estimatedDepartureTime || '',
            formattedDepartureTime: queueEntry.formattedDepartureTime || 'Calculating...',
            minutesUntilDeparture: queueEntry.minutesUntilDeparture || 0,
            station: queueEntry.station?.name || 'Unknown Station',
            destination: queueEntry.destination?.description || 'Unknown Destination',
            schedule: queueEntry.schedule ? `${queueEntry.schedule.startTime} - ${queueEntry.schedule.endTime}` : 'No Schedule',
            scheduleStatus: queueEntry.scheduleStatus || 'active',
          });
        } else {
          setInQueue(false);
          setQueueInfo(null);
        }
      } else {
        setInQueue(false);
        setQueueInfo(null);
      }
    } catch (error) {
      console.error('Failed to fetch queue status:', error);
      setInQueue(false);
      setQueueInfo(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchQueueStatus();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchQueueStatus(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    fetchQueueStatus(true);
    onRefresh?.();
  };

  const handleLeaveQueue = () => {
    Alert.alert(
      'Leave Queue',
      'Are you sure you want to leave the queue? You will lose your current position.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => {
            onLeaveQueue?.();
            fetchQueueStatus();
          },
        },
      ]
    );
  };

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'waiting': return '#ffc107';
      case 'assigned': return '#28a745';
      case 'called': return '#007bff';
      default: return '#6c757d';
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007bff" />
          <Text style={styles.loadingText}>Checking queue status...</Text>
        </View>
      </View>
    );
  }

  if (!inQueue || !queueInfo) {
    return null; // Don't show card if not in queue
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>🚗 Queue Status</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(queueInfo.status) }]}>
            <Text style={styles.statusText}>{queueInfo.status}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleRefresh} disabled={refreshing}>
          <Text style={styles.refreshButton}>
            {refreshing ? '⏳' : '🔄'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Position Info */}
      <View style={styles.positionSection}>
        <View style={styles.positionLeft}>
          <Text style={styles.positionIcon}>
            {getPositionIcon(queueInfo.position)}
          </Text>
          <View>
            <Text style={styles.positionNumber}>#{queueInfo.position}</Text>
            <Text style={styles.positionLabel}>in queue</Text>
          </View>
        </View>
        <View style={styles.positionRight}>
          <Text style={styles.timeValue}>{queueInfo.formattedDepartureTime}</Text>
          <Text style={styles.timeLabel}>Estimated departure</Text>
        </View>
      </View>

      {/* Route Info */}
      <View style={styles.routeSection}>
        <Text style={styles.routeText}>
          📍 {queueInfo.station} → {queueInfo.destination}
        </Text>
        <Text style={styles.scheduleText}>
          🕐 {queueInfo.schedule}
        </Text>
      </View>

      {/* Wait Time */}
      <View style={styles.waitTimeSection}>
        <View style={styles.waitTimeItem}>
          <Text style={styles.waitTimeValue}>{queueInfo.waitingTimeMinutes}m</Text>
          <Text style={styles.waitTimeLabel}>Waiting time</Text>
        </View>
        <View style={styles.waitTimeItem}>
          <Text style={styles.waitTimeValue}>{queueInfo.minutesUntilDeparture}m</Text>
          <Text style={styles.waitTimeLabel}>Until departure</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.actionButtonText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.leaveButton]}
          onPress={handleLeaveQueue}
        >
          <Text style={[styles.actionButtonText, styles.leaveButtonText]}>
            Leave Queue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    textTransform: 'capitalize',
  },
  refreshButton: {
    fontSize: 20,
    padding: 4,
  },
  positionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  positionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  positionIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  positionNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
  },
  positionLabel: {
    fontSize: 12,
    color: '#666',
  },
  positionRight: {
    alignItems: 'flex-end',
  },
  timeValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  routeSection: {
    marginBottom: 16,
  },
  routeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 12,
    color: '#666',
  },
  waitTimeSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
    paddingVertical: 12,
    marginBottom: 16,
  },
  waitTimeItem: {
    alignItems: 'center',
  },
  waitTimeValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
  },
  waitTimeLabel: {
    fontSize: 12,
    color: '#0056b3',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: '#dc3545',
  },
  leaveButtonText: {
    color: 'white',
  },
});