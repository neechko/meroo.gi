import React, { createContext, useContext, useRef, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { SAGE, FONTS } from '../theme/sage';

interface DialogOptions {
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface FeedbackContextValue {
  showToast: (message: string, type?: 'error' | 'success' | 'info') => void;
  showDialog: (opts: DialogOptions) => void;
}

const FeedbackContext = createContext<FeedbackContextValue>({
  showToast: () => {},
  showDialog: () => {},
});

export function useSageFeedback() {
  return useContext(FeedbackContext);
}

export function SageFeedbackProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<{ text: string; type: 'error' | 'success' | 'info' } | null>(null);
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const toastY = useRef(new Animated.Value(-90)).current;
  const timerRef = useRef<any>(null);

  function showToast(text: string, type: 'error' | 'success' | 'info' = 'info') {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ text, type });
    Animated.spring(toastY, { toValue: 48, useNativeDriver: true, speed: 22, bounciness: 6 }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(toastY, { toValue: -90, duration: 220, useNativeDriver: true }).start(() => setToast(null));
    }, 3400);
  }

  function showDialog(opts: DialogOptions) {
    setDialog(opts);
  }

  const isErr = toast?.type === 'error';

  return (
    <FeedbackContext.Provider value={{ showToast, showDialog }}>
      {children}

      {/* Floating Sage Toast Banner */}
      {toast && (
        <Animated.View
          style={[
            styles.toastWrap,
            { transform: [{ translateY: toastY }] },
            isErr ? styles.toastErr : styles.toastOk,
          ]}
        >
          <FontAwesome5
            name={isErr ? 'exclamation-circle' : 'check-circle'}
            size={16}
            color={isErr ? SAGE.danger : SAGE.primaryDark}
          />
          <Text style={[styles.toastText, { color: isErr ? SAGE.danger : SAGE.textPrimary }]}>{toast.text}</Text>
        </Animated.View>
      )}

      {/* Custom Sage Modal Dialog */}
      <Modal visible={!!dialog} transparent animationType="fade" onRequestClose={() => setDialog(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialogCard}>
            <View style={[styles.iconBadge, dialog?.type === 'error' && styles.iconBadgeErr]}>
              <FontAwesome5
                name={dialog?.type === 'error' ? 'exclamation-circle' : 'leaf'}
                size={20}
                color={dialog?.type === 'error' ? SAGE.danger : SAGE.primaryDark}
              />
            </View>
            <Text style={styles.dialogTitle}>{dialog?.title}</Text>
            <Text style={styles.dialogMsg}>{dialog?.message}</Text>
            <View style={styles.dialogActions}>
              {dialog?.cancelText && (
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setDialog(null)}>
                  <Text style={styles.cancelText}>{dialog.cancelText}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.confirmBtn, dialog?.type === 'error' && styles.confirmBtnErr]}
                onPress={() => {
                  const cb = dialog?.onConfirm;
                  setDialog(null);
                  if (cb) cb();
                }}
              >
                <Text style={styles.confirmText}>{dialog?.confirmText || 'Mengerti'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </FeedbackContext.Provider>
  );
}

const styles = StyleSheet.create({
  toastWrap: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    borderRadius: 18,
    paddingVertical: 13,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    elevation: 8,
  },
  toastOk: { backgroundColor: SAGE.surfaceCard, borderColor: SAGE.border },
  toastErr: { backgroundColor: SAGE.dangerSoft, borderColor: '#F2C6C3' },
  toastText: { fontFamily: FONTS.bodySemi, fontSize: 13, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(26,46,41,0.48)', justifyContent: 'center', padding: 24 },
  dialogCard: {
    backgroundColor: SAGE.surfaceCard,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 18,
    backgroundColor: SAGE.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeErr: { backgroundColor: SAGE.dangerSoft },
  dialogTitle: { fontFamily: FONTS.displayBold, fontSize: 18, color: SAGE.textPrimary, textAlign: 'center' },
  dialogMsg: { fontFamily: FONTS.body, fontSize: 13, color: SAGE.textSecondary, textAlign: 'center', lineHeight: 19 },
  dialogActions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
  cancelBtn: { flex: 1, backgroundColor: SAGE.surfaceSoft, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: SAGE.textSecondary },
  confirmBtn: { flex: 1, backgroundColor: SAGE.primary, borderRadius: 14, paddingVertical: 12, alignItems: 'center' },
  confirmBtnErr: { backgroundColor: SAGE.danger },
  confirmText: { fontFamily: FONTS.bodyBold, fontSize: 13, color: '#FFF' },
});
