import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { BlurView } from 'expo-blur';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function FaceBlurCamera({ 
  onFaceDetected, 
  onFaceLost, 
  style,
  ...props 
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [faces, setFaces] = useState([]);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const cameraRef = useRef(null);

  const handleFacesDetected = ({ faces }) => {
    setFaces(faces);
    const hasFace = faces.length > 0;
    
    if (hasFace !== isFaceDetected) {
      setIsFaceDetected(hasFace);
      if (hasFace) {
        onFaceDetected?.(faces[0]);
      } else {
        onFaceLost?.();
      }
    }
  };

  const renderFaceOverlay = () => {
    if (faces.length === 0) return null;

    return faces.map((face, index) => {
      const { bounds } = face;
      const { origin, size } = bounds;
      
      // Convert normalized coordinates to screen coordinates
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
            styles.faceOverlay,
            {
              left: expandedX,
              top: expandedY,
              width: expandedWidth,
              height: expandedHeight,
            },
          ]}
        />
      );
    });
  };

  return (
    <View style={[styles.container, style]}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="front"
        ratio="16:9"
        onFacesDetected={handleFacesDetected}
        faceDetectorSettings={{
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
          minDetectionInterval: 100,
          tracking: true,
        }}
        {...props}
      />
      
      {/* Blur overlay for background */}
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Face cutout areas */}
      {renderFaceOverlay()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  faceOverlay: {
    position: 'absolute',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 100,
  },
});
