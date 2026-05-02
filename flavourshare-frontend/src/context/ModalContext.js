import React, { createContext, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', type: 'info' });
  const [confirm, setConfirm] = useState({ visible: false, title: '', message: '', onConfirm: null });

  const showAlert = (title, message, type = 'info') => {
    setAlert({ visible: true, title, message, type });
  };

  const showConfirm = (title, message, onConfirm) => {
    setConfirm({ visible: true, title, message, onConfirm });
  };

  const closeAlert = () => setAlert({ ...alert, visible: false });
  const closeConfirm = () => setConfirm({ ...confirm, visible: false });

  const handleConfirm = () => {
    if (confirm.onConfirm) {
      confirm.onConfirm();
    }
    closeConfirm();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm }}>
      {children}
      
      {/* Alert Modal */}
      <Modal transparent visible={alert.visible} animationType="fade" onRequestClose={closeAlert}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.iconContainer}>
              {alert.type === 'success' && <Ionicons name="checkmark-circle" size={48} color="#2ecc71" />}
              {alert.type === 'error' && <Ionicons name="close-circle" size={48} color="#e74c3c" />}
              {alert.type === 'info' && <Ionicons name="information-circle" size={48} color="#3498db" />}
            </View>
            <Text style={styles.title}>{alert.title}</Text>
            <Text style={styles.message}>{alert.message}</Text>
            <TouchableOpacity style={styles.button} onPress={closeAlert}>
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirm Modal */}
      <Modal transparent visible={confirm.visible} animationType="fade" onRequestClose={closeConfirm}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.iconContainer}>
              <Ionicons name="help-circle" size={48} color="#f39c12" />
            </View>
            <Text style={styles.title}>{confirm.title}</Text>
            <Text style={styles.message}>{confirm.message}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={closeConfirm}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button} onPress={handleConfirm}>
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ModalContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#e67e22',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  cancelButton: {
    backgroundColor: '#ecf0f1',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
