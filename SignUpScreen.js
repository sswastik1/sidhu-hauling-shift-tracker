import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet, TouchableOpacity, ImageBackground, Alert } from 'react-native';
import { auth, firestore } from './firebase'; // Adjust this import to match the export
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Make sure this is correctly imported

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = () => {
    if (companyCode !== 'sidhuhauling') {
      Alert.alert('Invalid Company Code', 'The company code you entered is incorrect.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'The passwords do not match.');
      return;
    }

    setLoading(true);
    createUserWithEmailAndPassword(auth, email, password)
      .then(userCredential => {
        // Update the user's profile
        updateProfile(userCredential.user, { displayName: fullName })
          .then(() => {
            // Create a document in Firestore in the 'users' collection
            const userRef = doc(firestore, 'users', userCredential.user.uid);
            setDoc(userRef, {
              fullName: fullName,
              email: email,
            }).then(() => {
              navigation.navigate('Home');
            }).catch((error) => {
              console.error('Failed to create user document:', error);
              Alert.alert('Error', 'Failed to create user document in Firestore.');
            });
          })
          .catch(error => {
            console.error('Profile update error:', error);
            Alert.alert('Profile Update Error', 'Failed to update user profile.');
          });
      })
      .catch(error => {
        console.error('Sign up error:', error);
        handleAuthError(error);
      })
      .finally(() => setLoading(false));
  };

  const handleAuthError = (error) => {
    let errorMessage = 'An error occurred during sign up. Please try again.';

    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'The email address is already in use by another account.';
        break;
      case 'auth/invalid-email':
        errorMessage = 'The email address is not valid.';
        break;
      case 'auth/operation-not-allowed':
        errorMessage = 'Operation not allowed. Please contact support.';
        break;
      case 'auth/weak-password':
        errorMessage = 'The password is too weak. Please enter a stronger password.';
        break;
      case 'auth/network-request-failed':
        errorMessage = 'Network error. Please check your connection and try again.';
        break;
      default:
        errorMessage = error.message;
        break;
    }

    Alert.alert('Sign Up Error', errorMessage);
  };

  return (
    <ImageBackground source={{ uri: 'https://source.unsplash.com/random' }} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.title}>Sign Up</Text>
        <TextInput
          placeholder="Full Name"
          value={fullName}
          onChangeText={setFullName}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Company Code"
          value={companyCode}
          onChangeText={setCompanyCode}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>Sign Up</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.loginButton} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginButtonText}>Login</Text>
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
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
    backgroundColor: '#0288D1',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loginButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#0288D1',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default SignUpScreen;
