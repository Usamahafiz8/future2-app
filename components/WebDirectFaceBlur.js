import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

export default function WebDirectFaceBlur({ 
  style, 
  onFaceDetected, 
  onFaceLost,
  onCapture,
  ...props 
}) {
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const initializeCamera = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }

        // Load MediaPipe scripts
        await loadMediaPipeScripts();
        
        setIsLoading(false);
      } catch (err) {
        console.error('Camera initialization error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };

    initializeCamera();

    return () => {
      // Cleanup
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    };
  }, []);

  const loadMediaPipeScripts = async () => {
    return new Promise((resolve, reject) => {
      const scripts = [
        'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js',
        'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'
      ];

      let loadedCount = 0;
      const totalScripts = scripts.length;

      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          loadedCount++;
          if (loadedCount === totalScripts) {
            initializeFaceMesh();
            resolve();
          }
        };
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.head.appendChild(script);
      });
    });
  };

  const initializeFaceMesh = () => {
    if (typeof window.FaceMesh === 'undefined') {
      console.error('FaceMesh not loaded');
      return;
    }

    const faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });

    faceMesh.onResults((results) => {
      processResults(results);
    });

    // Start processing frames
    const processFrame = async () => {
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        await faceMesh.send({ image: videoRef.current });
      }
      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  const processResults = (results) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Blur full background
    ctx.filter = "blur(12px) brightness(0.8)";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // reset filter for sharp drawing
    ctx.filter = "none";

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Compute face center
      let cx = 0, cy = 0;
      for (const [i] of window.FACEMESH_FACE_OVAL) {
        cx += landmarks[i].x * canvas.width;
        cy += landmarks[i].y * canvas.height;
      }
      cx /= window.FACEMESH_FACE_OVAL.length;
      cy /= window.FACEMESH_FACE_OVAL.length;

      const scale = 1.2; // make face area 20% wider

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < window.FACEMESH_FACE_OVAL.length; i++) {
        const [startIdx] = window.FACEMESH_FACE_OVAL[i];
        const pt = landmarks[startIdx];
        let x = pt.x * canvas.width;
        let y = pt.y * canvas.height;

        // Expand point outward from center
        x = cx + (x - cx) * scale;
        y = cy + (y - cy) * scale;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();

      // Clip and draw sharp face
      ctx.clip();
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.restore();

      // Notify face detected
      if (!isFaceDetected) {
        setIsFaceDetected(true);
        onFaceDetected?.();
      }
    } else {
      // Notify no face
      if (isFaceDetected) {
        setIsFaceDetected(false);
        onFaceLost?.();
      }
    }

    ctx.restore();
  };

  // Expose capture method
  const capturePhoto = () => {
    if (canvasRef.current) {
      const dataURL = canvasRef.current.toDataURL('image/jpeg', 0.9);
      onCapture?.(dataURL);
      return dataURL;
    }
    return null;
  };

  // Expose capture method to parent component
  useEffect(() => {
    if (Platform.OS === 'web') {
      window.captureBlurredPhoto = capturePhoto;
    }
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={[styles.container, style]}>
        <View style={styles.notSupported}>
          <Text style={styles.notSupportedText}>
            Web face blur only works on web platform
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, style]} ref={containerRef}>
      <video
        ref={videoRef}
        style={styles.video}
        autoPlay
        muted
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />
      
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Loading camera...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorOverlay}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      )}
      
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusDot,
          { backgroundColor: isFaceDetected ? '#4CAF50' : '#FF5722' }
        ]} />
        <Text style={styles.statusText}>
          {isFaceDetected ? 'Face detected' : 'No face detected'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  video: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  statusContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
  notSupported: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  notSupportedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
