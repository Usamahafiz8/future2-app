 import React, { useRef, useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as FaceDetector from 'expo-face-detector';
import { BlurView } from 'expo-blur';
import { Canvas, Image as CanvasImage, useImage } from '@shopify/react-native-skia';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AdvancedFaceBlurCamera({ 
  onFaceDetected, 
  onFaceLost, 
  style,
  ...props 
}) {
  const [permission, requestPermission] = useCameraPermissions();
  const [faces, setFaces] = useState([]);
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const cameraRef = useRef(null);

  const handleFacesDetected = useCallback(({ faces }) => {
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
  }, [isFaceDetected, onFaceDetected, onFaceLost]);

  const captureFrame = useCallback(async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: true,
        });
        setCapturedImage(photo.uri);
      } catch (error) {
        console.error('Error capturing frame:', error);
      }
    }
  }, []);

  // Capture a frame periodically for processing
  useEffect(() => {
    const interval = setInterval(captureFrame, 100); // Capture every 100ms
    return () => clearInterval(interval);
  }, [captureFrame]);

  const renderFaceCutouts = () => {
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
    });
  };

  return (
    <View style={[styles.container, style]}>
      {/* Camera View */}
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
      
      {/* Blurred background overlay */}
      <BlurView
        intensity={80}
        tint="light"
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Face cutout areas - these will show the sharp camera feed */}
      {renderFaceCutouts()}
      
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
    top: 20,
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
