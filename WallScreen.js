import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Image, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { wallListMixed } from './api';

const ROTATE_MS = 5000;
const MAX = 24;

export default function WallScreen({ route }) {
  const [feed, setFeed] = useState([]);
  const [visible, setVisible] = useState([]);
  const timer = useRef(null);

  useEffect(() => {
    (async () => {
      const j = await wallListMixed(MAX * 3);
      if (j?.ok) {
        const list = (j.data || []).map(x => ({
          id: String(x.id),
          name: x.full_name,
          msg: x.message,
          photo: x.photo_path ? absolutize(x.photo_path) : null
        }));
        setFeed(list);
        setVisible(list.slice(0, Math.min(MAX, list.length)));
      }
    })();
  }, []);

  useEffect(() => {
    if (!feed.length) return;
    timer.current = setInterval(() => {
      setVisible(prev => {
        if (!feed.length || !prev.length) return prev;
        const idx = Math.floor(Math.random() * prev.length);
        const next = feed[(Math.floor(Math.random() * feed.length))];
        const clone = [...prev];
        if (next && !clone.find(x => x.id === next.id)) clone[idx] = next;
        return clone;
      });
    }, ROTATE_MS);
    return () => clearInterval(timer.current);
  }, [feed]);

  const numCols = 2; // phone/tablet adaptive
  return (
    <View style={{ flex:1, backgroundColor:'#0b3d2e', padding:8 }}>
      <FlatList
        data={visible}
        keyExtractor={(item)=>item.id}
        numColumns={numCols}
        renderItem={({item}) => (
          <Card style={{ flex:1, margin:6, backgroundColor:'#2d7a5d' }}>
            <View style={{ flexDirection:'row', padding:12, alignItems:'flex-start' }}>
              {item.photo ? (
                <Image source={{ uri: absolutize(item.photo) }} style={{ width:42, height:42, borderRadius:21, marginRight:10 }} />
              ) : null}
              <View style={{ flex:1 }}>
                <Text style={{ color:'#bde8cf', fontWeight:'700' }}>{item.name || ''}</Text>
                <Text style={{ color:'#e8fff1', marginTop:4 }}>{item.msg || ''}</Text>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

function absolutize(path) {
  // Your web did: base = API_BASE.replace(/\/api\.php.*$/, '/'); then path append. :contentReference[oaicite:15]{index=15}
  const base = 'https://pilingspecialist.com/api/'.replace(/\/$/, '');
  const p = String(path || '').replace(/^\/+/, '');
  return `${base}/${p}`;
}
