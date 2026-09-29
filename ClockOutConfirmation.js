import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from './firebase';
import { doc, deleteDoc } from 'firebase/firestore'; 
import uuid from 'react-native-uuid';

const ClockOutConfirmation = ({ route, navigation }) => {
  const [note, setNote] = useState('');
  const { handleClockOut, clockInTime } = route.params;
  const [clockOutTime, setClockOutTime] = useState(null);
  const [shiftDuration, setShiftDuration] = useState(null);

  const [entries, setEntries] = useState([]);
  const [fuelUsage, setFuelUsage] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [ticketNumber, setTicketNumber] = useState('');
  const [hours, setHours] = useState('');
  const [image, setImage] = useState(null);

  useEffect(() => {
    const currentTime = new Date();
    setClockOutTime(currentTime);
    const diff = currentTime - new Date(clockInTime);
    setShiftDuration((diff / (1000 * 60 * 60)).toFixed(2)); 
  }, [clockInTime]);

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission to access gallery is required!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const resizedImage = await resizeImage(result.assets[0].uri);
      setImage(resizedImage.uri);
      console.log('Image selected and resized:', resizedImage.uri);
    }
  };

  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission to access camera is required!');
      return;
    }

    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      const resizedImage = await resizeImage(result.assets[0].uri);
      setImage(resizedImage.uri);
      console.log('Photo taken and resized:', resizedImage.uri);
    }
  };

  const resizeImage = async (uri) => {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult;
  };

  const uploadImage = async (uri) => {
    if (!uri) return null;
    const imageRef = ref(storage, `images/${uuid.v4()}.jpg`);

    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Unable to read selected image (${response.status}).`);
      }

      const blob = await response.blob();
      await uploadBytes(imageRef, blob, { contentType: 'image/jpeg' });
      return await getDownloadURL(imageRef);
    } catch (error) {
      console.error('Image upload failed:', error);
      throw new Error(error?.message || 'Image upload failed. Please try again.');
    }
  };

  const confirmClockOut = async () => {
    console.log('Confirming clock out...');
    try {
      const updatedEntries = await Promise.all(
        entries.map(async (entry) => {
          console.log('Processing entry:', entry);
          return {
            ...entry,
            image: entry.image ? await uploadImage(entry.image) : null,
          };
        })
      );

      console.log('Clock out confirmed with entries:', updatedEntries);
      await handleClockOut(note, fuelUsage, updatedEntries);
      resetState(); 
      navigation.goBack();
    } catch (error) {
      console.error('Error during clock out:', error);
      Alert.alert('Clock-out failed', error?.message || 'Unable to save the clock-out.');
    }
  };

  const resetState = () => {
    setEntries([]);
    setFuelUsage('');
    setCompanyName('');
    setTicketNumber('');
    setHours('');
    setImage(null);
    setNote('');
    setClockOutTime(null);
    setShiftDuration(null);
  };

  const deleteLocationFromFirestore = async (userId) => {
    try {
      const locationDocRef = await doc(firestore, 'liveLocations', userId);
      await deleteDoc(locationDocRef);
      console.log('Location deleted successfully from Firestore');
    } catch (error) {
      console.error('Error deleting location from Firestore:', error);
    }
  };

  const addEntry = async () => {
    if (companyName && ticketNumber && hours) {
      setEntries([...entries, { companyName, ticketNumber, hours, image }]);
      setCompanyName('');
      setTicketNumber('');
      setHours('');
      setImage(null); 
    } else {
      Alert.alert('Please fill in all fields');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={require('./assets/icon.png')} style={styles.logo} />
          <Text style={styles.appName}>Sidhu Hauling Ltd.</Text>
        </View>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.topContent}>
            <Text style={styles.title}>Confirm Clock Out</Text>
            {clockInTime && (
              <View style={styles.summaryContainer}>
                <Text style={styles.summaryText}>
                  Clock In Time: {new Date(clockInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.summaryText}>
                  Clock Out Time: {clockOutTime && clockOutTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
                <Text style={styles.summaryText}>Shift Duration: {shiftDuration} hours</Text>
              </View>
            )}
          </View>

          <View style={styles.inputSection}>
            <TextInput
              placeholder="Fuel Usage (Liters)"
              value={fuelUsage}
              onChangeText={setFuelUsage}
              style={styles.input}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />

            <Text style={styles.sectionTitle}>Ticket Entries</Text>

            <TextInput
              placeholder="Company Name"
              value={companyName}
              onChangeText={setCompanyName}
              style={styles.input}
              placeholderTextColor="#aaa"
            />
            <TextInput
              placeholder="Ticket Number"
              value={ticketNumber}
              onChangeText={setTicketNumber}
              style={styles.input}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Hours"
              value={hours}
              onChangeText={setHours}
              style={styles.input}
              placeholderTextColor="#aaa"
              keyboardType="numeric"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.imageButton} onPress={pickImage}>
                <Text style={styles.buttonText}>Pick Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.imageButton} onPress={takePhoto}>
                <Text style={styles.buttonText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
            {image && <Image source={{ uri: image }} style={styles.thumbnail} />}
            <TouchableOpacity style={styles.addButton} onPress={addEntry}>
              <Text style={styles.buttonText}>Add Entry</Text>
            </TouchableOpacity>
            <View style={styles.entriesContainer}>
              {entries.map((entry, index) => (
                <View key={index} style={styles.entry}>
                  <Text style={styles.entryText}>Company: {entry.companyName}</Text>
                  <Text style={styles.entryText}>Ticket #: {entry.ticketNumber}</Text>
                  <Text style={styles.entryText}>Hours: {entry.hours}</Text>
                  {entry.image && <Image source={{ uri: entry.image }} style={styles.thumbnail} />}
                </View>
              ))}
            </View>
          </View>

          <View style={styles.bottomContent}>
            <TextInput
              placeholder="Add a note (optional)"
              value={note}
              onChangeText={setNote}
              style={styles.input}
              placeholderTextColor="#aaa"
              multiline
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.confirmButton]} onPress={confirmClockOut}>
                <Text style={styles.buttonText}>Clock Out</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => navigation.goBack()}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    alignItems: 'center',
    padding: 20,
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
  topContent: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContainer: {
    alignItems: 'center',
    marginBottom: -30,
  },
  summaryText: {
    fontSize: 18,
    marginBottom: 5,
    textAlign: 'center',
  },
  inputSection: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 10,
    color: '#333',
    alignSelf: 'flex-start',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
  },
  imageButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: '#0288D1',
    alignItems: 'center',
    marginHorizontal: 5,
  },
  thumbnail: {
    width: 100,
    height: 100,
    resizeMode: 'cover',
    marginVertical: 10,
    borderRadius: 5,
  },
  addButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    backgroundColor: '#0288D1',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  entriesContainer: {
    width: '100%',
    marginTop: 20,
  },
  entry: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  entryText: {
    fontSize: 16,
    marginBottom: 5,
  },
  bottomContent: {
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 30,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '45%',
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#F44336',
  },
});

export default ClockOutConfirmation;
