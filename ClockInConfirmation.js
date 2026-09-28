import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, SafeAreaView } from 'react-native';

const ClockInConfirmation = ({ route, navigation }) => {
  const [note, setNote] = useState('');
  const [clockInTime, setClockInTime] = useState(null);
  const { handleClockIn } = route.params;

  useEffect(() => {
    const currentTime = new Date();
    setClockInTime(currentTime);
  }, []);

  const confirmClockIn = () => {
    handleClockIn(note);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
        <Text style={styles.appName}>Sidhu Hauling Ltd.</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>Confirm Clock In</Text>
        {clockInTime && (
          <Text style={styles.timeText}>
            Clock In Time: {clockInTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        )}
        <TextInput
          placeholder="Add a note (optional)"
          value={note}
          onChangeText={setNote}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={confirmClockIn}>
          <Text style={styles.buttonText}>Confirm Clock In</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  logo: {
    width: 30,
    height: 30,
    marginRight: 10,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0288D1',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 18,
    marginBottom: 20,
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default ClockInConfirmation;
