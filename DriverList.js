import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
  SafeAreaView,
  Image,
  Modal,
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { firestore, auth } from './firebase';
import { signOut } from 'firebase/auth';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as XLSX from 'xlsx';

const DriverList = ({ navigation }) => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const querySnapshot = await getDocs(collection(firestore, 'users'));
        const driversList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().fullName || 'No Name',
          email: doc.data().email || 'No Email',
        }));
        setDrivers(driversList);
      } catch (error) {
        console.error('Error fetching drivers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDrivers();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace('Login');
    } catch (error) {
      console.error('Error during logout:', error);
      Alert.alert('Error', 'Failed to log out.');
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      const reportData = [];
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();

      for (const driver of drivers) {
        const dailyData = Array(daysInMonth).fill({ hours: 0, fuel: 0 });

        const clockinsQuery = query(
          collection(firestore, 'clockins'),
          where('userId', '==', driver.id),
          where('timestamp', '>=', new Date(selectedYear, selectedMonth, 1)),
          where('timestamp', '<', new Date(selectedYear, selectedMonth + 1, 1)),
          orderBy('timestamp')
        );

        const clockinsSnapshot = await getDocs(clockinsQuery);

        let totalHours = 0;
        let totalFuel = 0;
        let lastClockIn = null;

        clockinsSnapshot.forEach((doc) => {
          const data = doc.data();
          const timestamp = data.timestamp.toDate();
          const day = timestamp.getDate() - 1;

          if (data.type === 'clockin') {
            if (lastClockIn) {
              console.warn(`Unpaired clockin for ${driver.name} on day ${day + 1}`);
            }
            lastClockIn = timestamp;
          } else if (data.type === 'clockout') {
            if (lastClockIn) {
              if (timestamp < lastClockIn) {
                console.warn(`Clockout before clockin for ${driver.name} on day ${day + 1}`);
              } else {
                const hours = (timestamp - lastClockIn) / (1000 * 60 * 60); // Convert milliseconds to hours
                totalHours += hours;
                dailyData[day].hours += hours;
                lastClockIn = null; // Reset clockin after successful clockout
              }
            } else {
              console.warn(`Clockout without clockin for ${driver.name} on day ${day + 1}`);
            }
          }

          if (data.fuel) {
            const fuel = parseFloat(data.fuel);
            totalFuel += fuel;
            dailyData[day].fuel += fuel;
          }
        });

        const driverRow = { Name: driver.name };

        dailyData.forEach((data, index) => {
          driverRow[`Day ${index + 1} Hours`] = data.hours.toFixed(2);
          driverRow[`Day ${index + 1} Fuel (L)`] = data.fuel.toFixed(2);
        });

        driverRow['Total Hours'] = totalHours.toFixed(2);
        driverRow['Total Fuel (L)'] = totalFuel.toFixed(2);

        reportData.push(driverRow);
      }

      console.log(reportData);

      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Report');
      const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

      const fileUri = FileSystem.documentDirectory + `SidhuHauling_Report_${monthNames[selectedMonth]}_${selectedYear}.xlsx`;
      await FileSystem.writeAsStringAsync(fileUri, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      Alert.alert(
        'Success',
        `Report saved to ${fileUri}`,
        [
          {
            text: 'Save/Share',
            onPress: async () => {
              if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
              } else {
                Alert.alert('Sharing not available on this device');
              }
            },
          },
          { text: 'OK', onPress: () => console.log('OK Pressed') },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error generating report:', error);
      Alert.alert('Error', 'Failed to generate report.');
    } finally {
      setLoading(false);
      setModalVisible(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.appName}>Sidhu Hauling Ltd.</Text>
        <Image source={require('./assets/icon.png')} style={styles.logo} />
      </View>
      <FlatList
        data={drivers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() =>
              navigation.navigate('DriverCalendar', {
                driverId: item.id,
                driverName: item.name,
                driverEmail: item.email,
              })
            }
          >
            <MaterialIcons name="person" size={24} color="#333" style={styles.icon} />
            <Text style={styles.text}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={styles.generateButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.buttonText}>Generate Monthly Report</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.mapButton}
        onPress={() => navigation.navigate('MapViewComponent')}
      >
        <Text style={styles.buttonText}>View Driver Locations</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month</Text>
            <Picker
              selectedValue={selectedMonth}
              onValueChange={(itemValue) => setSelectedMonth(itemValue)}
              style={styles.picker}
            >
              {monthNames.map((month, index) => (
                <Picker.Item key={index} label={month} value={index} />
              ))}
            </Picker>
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity style={styles.modalButton} onPress={generateReport}>
                <Text style={styles.buttonText}>Generate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  logoutButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 7,
    marginHorizontal: 10,
    elevation: 3,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    margin: 20,
    alignItems: 'center',
  },
  mapButton: {
    backgroundColor: '#28A745',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  picker: {
    width: '100%',
    height: 150,
    marginBottom: 20,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    width: '48%',
    alignItems: 'center',
    marginTop: 10,
  },
});

export default DriverList;
