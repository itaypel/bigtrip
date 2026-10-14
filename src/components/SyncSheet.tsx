import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import type { Session } from '@supabase/supabase-js';

import { rtl, rtlRoot, rtlText } from '../lib/rtl';
import { sendLoginCode, signOut, verifyLoginCode, type SyncStatus } from '../lib/usePackingState';
import { STATUS_LABEL } from './SyncButton';

type Props = {
  visible: boolean;
  onClose: () => void;
  session: Session | null;
  status: SyncStatus;
  onSyncNow: () => void;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Centered text keeps LTR input (email, digits) looking right inside an RTL layout
// without fighting the platform over what "left" means.
const inputClass =
  'min-h-[52px] rounded-xl border border-edge bg-night px-4 text-center text-[17px] text-white';

function PrimaryButton({
  label,
  onPress,
  disabled,
  busy,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  busy?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || busy, busy }}
      className={`mt-4 min-h-[52px] items-center justify-center rounded-xl ${
        disabled ? 'bg-slate-700' : 'bg-neon active:opacity-80'
      }`}
    >
      {busy ? (
        <ActivityIndicator color="#05070d" />
      ) : (
        <Text className={`text-[17px] font-bold ${disabled ? 'text-slate-400' : 'text-void'}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function SyncSheet({ visible, onClose, session, status, onSyncNow }: Props) {
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setCode('');
  }, [visible]);

  const trimmedEmail = email.trim().toLowerCase();

  const requestCode = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await sendLoginCode(trimmedEmail);
    setBusy(false);
    if (err) {
      setError(
        /rate|limit|seconds/i.test(err.message)
          ? 'נשלחו יותר מדי קודים. נסה שוב בעוד כמה דקות.'
          : `לא הצלחנו לשלוח קוד: ${err.message}`,
      );
      return;
    }
    setStep('code');
  };

  const confirmCode = async () => {
    setBusy(true);
    setError(null);
    const { error: err } = await verifyLoginCode(trimmedEmail, code.trim());
    setBusy(false);
    if (err) {
      setError('הקוד שגוי או שפג תוקפו. בדוק את הקוד או שלח קוד חדש.');
      return;
    }
    setStep('email');
    setCode('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={rtlRoot}
        className="flex-1 bg-void"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 48,
            width: '100%',
            maxWidth: 520,
            alignSelf: 'center',
          }}
        >
          <View className="mb-6 flex-row items-center justify-between">
            <Text style={rtlText} className="flex-1 text-2xl font-black text-white">
              {rtl('סנכרון בין מכשירים')}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="סגירה"
              hitSlop={10}
              className="h-11 w-11 items-center justify-center rounded-full bg-panel active:bg-slate-800"
            >
              <Ionicons name="close" size={22} color="#94a3b8" />
            </Pressable>
          </View>

          {session ? (
            <View>
              <View className="rounded-2xl border border-edge bg-panel p-4">
                <Text style={rtlText} className="text-sm text-slate-400">
                  {rtl('מחובר בתור')}
                </Text>
                <Text className="mt-1 text-center text-[17px] font-bold text-white">
                  {session.user.email}
                </Text>
                <Text style={rtlText} className="mt-3 text-[15px] text-cyber">
                  {rtl(STATUS_LABEL[status])}
                </Text>
              </View>
              <Text style={rtlText} className="mt-4 text-[15px] leading-6 text-slate-300">
                {rtl(
                  'כל סימון נשמר קודם בטלפון ואז עולה לענן. בלי אינטרנט הכל ממשיך לעבוד, והשינויים יעלו כשתחזור לרשת.',
                )}
              </Text>
              <PrimaryButton label="סנכרון עכשיו" onPress={onSyncNow} busy={status === 'syncing'} />
              <Pressable
                onPress={() => signOut()}
                accessibilityRole="button"
                className="mt-3 min-h-[52px] items-center justify-center rounded-xl border border-edge active:bg-slate-800"
              >
                <Text className="text-[17px] font-bold text-slate-300">התנתקות</Text>
              </Pressable>
              <Text style={rtlText} className="mt-3 text-sm text-slate-400">
                {rtl('אחרי התנתקות הרשימה נשארת בטלפון, אבל לא מסתנכרנת יותר.')}
              </Text>
            </View>
          ) : step === 'email' ? (
            <View>
              <Text style={rtlText} className="text-[15px] leading-6 text-slate-300">
                {rtl(
                  'התחבר עם אימייל כדי לראות את אותה רשימה בטלפון ובדפדפן. נשלח לך קוד חד-פעמי, בלי סיסמה.',
                )}
              </Text>
              <Text style={rtlText} className="mb-2 mt-5 text-sm font-bold text-slate-300">
                {rtl('אימייל')}
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="name@example.com"
                placeholderTextColor="#64748b"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="send"
                onSubmitEditing={() => EMAIL_RE.test(trimmedEmail) && requestCode()}
                accessibilityLabel="אימייל"
                className={inputClass}
              />
              <PrimaryButton
                label="שליחת קוד"
                onPress={requestCode}
                disabled={!EMAIL_RE.test(trimmedEmail)}
                busy={busy}
              />
            </View>
          ) : (
            <View>
              <Text style={rtlText} className="text-[15px] leading-6 text-slate-300">
                {rtl('שלחנו קוד אל')}
              </Text>
              <Text className="mt-1 text-center text-[17px] font-bold text-white">
                {trimmedEmail}
              </Text>
              <Text style={rtlText} className="mb-2 mt-5 text-sm font-bold text-slate-300">
                {rtl('קוד מהמייל')}
              </Text>
              <TextInput
                value={code}
                onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
                placeholder="123456"
                placeholderTextColor="#64748b"
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={() => code.length >= 6 && confirmCode()}
                accessibilityLabel="קוד מהמייל"
                className={`${inputClass} text-2xl tracking-[6px]`}
              />
              <PrimaryButton
                label="אימות והתחברות"
                onPress={confirmCode}
                disabled={code.length < 6}
                busy={busy}
              />
              <View className="mt-4 flex-row justify-between">
                <Pressable onPress={() => setStep('email')} hitSlop={8} accessibilityRole="button">
                  <Text className="text-[15px] text-cyber">שינוי אימייל</Text>
                </Pressable>
                <Pressable
                  onPress={requestCode}
                  hitSlop={8}
                  accessibilityRole="button"
                  disabled={busy}
                >
                  <Text className="text-[15px] text-cyber">שליחת קוד חדש</Text>
                </Pressable>
              </View>
            </View>
          )}

          {error && (
            <Text style={rtlText} className="mt-4 text-[15px] font-bold text-amber-400">
              {rtl(error)}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}
