import React, { useState } from 'react';
import { View, StyleSheet, Button, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';

export default function FaceBlurDemo() {
  const [permission, requestPermission] = useCameraPermissions();
  const [faces, setFaces] = useState([]);
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const handleFacesDetected = ({ faces }) => {
    setFaces(faces);
    const hasFace = faces.length > 0;
    setIsFaceDetected(hasFace);
  };

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Button title="Grant Camera Permission" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="front"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
      />
      
      {/* Blurred background overlay */}
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Face cutout areas */}
      {faces.map((face, index) => {
        const { bounds } = face;
        const { origin, size } = bounds;
        
        // Convert normalized coordinates to screen coordinates
        const screenWidth = 400; // You'd get this from Dimensions
        const screenHeight = 600;
        
        const x = origin.x * screenWidth;
        const y = origin.y * screenHeight;
        const width = size.width * screenWidth;
        const height = size.height * screenHeight;
        
        // Expand the face area slightly (like the HTML example's scale: 1.2)
        const scale = 1.2;
        const expandedWidth = width * scale;
        const expandedHeight = height * scale;
        const expandedX = x - (expandedWidth - width) / 2;
        const expandedY = y - (expandedHeight - height) / 2;

        return (
          <View
            key={index}
            style={[
              styles.faceCutout,
              {
                left: expandedX,
                top: expandedY,
                width: expandedWidth,
                height: expandedHeight,
              },
            ]}
          />
        );
      })}
      
      {/* Status indicator */}
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusDot,
          { backgroundColor: isFaceDetected ? '#4CAF50' : '#FF5722' }
        ]} />
        <View style={styles.statusText}>
          {isFaceDetected ? 'Face detected' : 'No face detected'}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  faceCutout: {
    position: 'absolute',
    backgroundColor: 'transparent',
    // This creates a "cutout" effect by being transparent
    // The camera feed will show through here while the blur overlay covers everything else
  },
  statusContainer: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});
