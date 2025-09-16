import React, { useEffect, useState, useCallback } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Button,
  Card,
  Text,
  TextInput,
  SegmentedButtons,
  RadioButton,
  ActivityIndicator,
} from 'react-native-paper';
import { adminLogin, entriesList, reviewSet } from './api';

export default function AdminScreen() {
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setBusy(true);
      const j = await entriesList(token, status);
      setRows(Array.isArray(j?.data) ? j.data : []);
      setNote('');
    } catch (e) {
      setNote('Unable to load entries.');
    } finally {
      setBusy(false);
    }
  }, [token, status]);

  const login = async () => {
    try {
      setBusy(true);
      const j = await adminLogin(email.trim(), pass);
      if (j?.ok && j.token) {
        setToken(j.token);
        setNote('');
      } else {
        setNote(j?.error || 'Login failed');
      }
    } catch (e) {
      setNote('Login failed');
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, [load]);

  const moderate = async (newStatus) => {
    if (!selectedId) {
      setNote('Select an entry first.');
      return;
    }
    if (newStatus === 'rejected' && !reason.trim()) {
      setNote('Please provide a reason for rejection.');
      return;
    }
    try {
      setBusy(true);
      const j = await reviewSet(token, selectedId, newStatus, reason.trim());
      if (j?.ok) {
        setReason('');
        setSelectedId(null);
        await load();
        setNote(newStatus === 'accepted' ? 'Accepted.' : 'Rejected.');
      } else {
        setNote(j?.error || 'Action failed');
      }
    } catch (e) {
      setNote('Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (!token) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0b3d2e', padding: 16, justifyContent: 'center' }}>
        <Card style={{ backgroundColor: '#123a2d', padding: 16 }}>
          <Text variant="titleLarge" style={{ color: '#e8fff1', marginBottom: 12 }}>
            Admin Login
          </Text>
          <TextInput
            label="Username"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            mode="outlined"
          />
          <TextInput
            label="Password"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            mode="outlined"
            style={{ marginTop: 8 }}
          />
          <Button
            style={{ marginTop: 12 }}
            mode="contained"
            onPress={login}
            disabled={busy || !email.trim() || !pass}
          >
            {busy ? 'Working…' : 'Login'}
          </Button>
          {!!note && (
            <Text style={{ color: '#e8fff1', marginTop: 8 }} selectable>
              {note}
            </Text>
          )}
        </Card>
      </View>
    );
  }

  const ControlsRow = ({ children }) => (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
      }}
    >
      {React.Children.map(children, (child, idx) => (
        <View style={{ marginRight: idx < React.Children.count(children) - 1 ? 12 : 0 }}>
          {child}
        </View>
      ))}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#0b3d2e', padding: 8 }}>
      <Card style={{ backgroundColor: '#123a2d', padding: 12 }}>
        <SegmentedButtons
          value={status}
          onValueChange={setStatus}
          buttons={[
            { value: '', label: 'All' },
            { value: 'pending', label: 'Pending' },
            { value: 'accepted', label: 'Accepted' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />

        <View style={{ height: 520, marginTop: 12 }}>
          {busy && (
            <View style={{ height: 520, alignItems: 'center', justifyContent: 'center' }}>
              <ActivityIndicator animating />
              <Text style={{ color: '#bde8cf', marginTop: 8 }}>Loading…</Text>
            </View>
          )}

          {!busy && rows.length === 0 && (
            <View style={{ height: 520, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ color: '#bde8cf' }}>No entries found.</Text>
            </View>
          )}

          {!busy && rows.length > 0 && (
            <ScrollView>
              {rows.map((r) => {
                const checked = selectedId === r.id;
                return (
                  <Card
                    key={String(r.id)}
                    style={{
                      backgroundColor: checked ? '#19664f' : '#134434',
                      marginVertical: 6,
                    }}
                    onPress={() => setSelectedId(r.id)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
                      <RadioButton
                        value={String(r.id)}
                        status={checked ? 'checked' : 'unchecked'}
                        onPress={() => setSelectedId(r.id)}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#e8fff1' }}>
                          {(r.full_name || '').trim()} — {(r.email || '').trim()}
                        </Text>
                        <Text style={{ color: '#bde8cf' }}>
                          Public: {r.is_public ? 'Yes' : 'No'} | {(r.status || '').trim()} |{' '}
                          {r.scheduled_at || '—'}
                        </Text>
                      </View>
                    </View>
                  </Card>
                );
              })}
            </ScrollView>
          )}
        </View>

        <TextInput
          label="Reason (for reject)"
          value={reason}
          onChangeText={setReason}
          mode="outlined"
          style={{ marginTop: 6 }}
        />

        <ControlsRow>
          <Button
            mode="contained"
            onPress={() => moderate('accepted')}
            disabled={busy || !selectedId}
          >
            Accept
          </Button>
          <Button
            mode="outlined"
            onPress={() => moderate('rejected')}
            disabled={busy || !selectedId}
          >
            Reject
          </Button>
          <Button mode="text" onPress={load} disabled={busy}>
            Refresh
          </Button>
        </ControlsRow>

        {!!note && (
          <Text style={{ color: '#e8fff1', marginTop: 8 }} selectable>
            {note}
          </Text>
        )}
      </Card>
    </View>
  );
}
