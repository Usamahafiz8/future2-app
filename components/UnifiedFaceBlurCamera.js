import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';
import { WebView } from 'react-native-webview';

const FaceBlurHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Face Background Blur</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- MediaPipe FaceMesh -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>

  <style>
    html, body { 
      height: 100%; 
      margin: 0; 
      padding: 0;
      background: #111; 
      color: #eee; 
      font-family: Arial, sans-serif; 
      overflow: hidden;
    }
    .wrap { 
      position: relative; 
      width: 100%; 
      height: 100%; 
      margin: 0; 
    }
    video, canvas { 
      display: block; 
      width: 100%; 
      height: 100%; 
      border-radius: 6px; 
      object-fit: cover;
    }
    #overlay { 
      position: absolute; 
      top: 0; 
      left: 0; 
      pointer-events: none; 
    }
    #status { 
      position: absolute; 
      top: 10px; 
      right: 10px; 
      background: rgba(0,0,0,0.7); 
      padding: 8px 12px; 
      border-radius: 20px; 
      color: white; 
      font-size: 12px; 
      z-index: 1000;
    }
    .loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 16px;
      z-index: 1000;
    }
  </style>
</head>
<body>
  <div class="wrap">
    <video id="video" autoplay muted playsinline></video>
    <canvas id="overlay"></canvas>
    <div id="status">Loading model…</div>
    <div class="loading" id="loading">Initializing camera...</div>
  </div>

  <script>
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('overlay');
    const ctx = canvasElement.getContext('2d');
    const statusEl = document.getElementById('status');
    const loadingEl = document.getElementById('loading');

    let isModelLoaded = false;
    let isCameraStarted = false;

    // MediaPipe FaceMesh setup
    const faceMesh = new FaceMesh({
      locateFile: (file) => \`https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/\${file}\`
    });
    
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6
    });
    
    faceMesh.onResults(onResults);

    // Start camera
    const camera = new Camera(videoElement, {
      onFrame: async () => {
        if (isModelLoaded && isCameraStarted) {
          await faceMesh.send({image: videoElement});
        }
      },
      width: 640,
      height: 480
    });

    // Initialize everything
    async function initialize() {
      try {
        loadingEl.textContent = 'Loading face detection model...';
        await camera.start();
        isCameraStarted = true;
        loadingEl.textContent = 'Model loaded, starting camera...';
        
        // Wait a bit for camera to be ready
        setTimeout(() => {
          isModelLoaded = true;
          loadingEl.style.display = 'none';
          statusEl.textContent = 'Camera ready - detecting faces...';
        }, 2000);
        
      } catch (error) {
        console.error('Error initializing camera:', error);
        statusEl.textContent = 'Error: ' + error.message;
        loadingEl.textContent = 'Camera access denied or not available';
      }
    }

    function onResults(results) {
      if (!videoElement.videoWidth || !isModelLoaded) return;
      
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      ctx.save();
      ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // 1. Blur full background
      ctx.filter = "blur(12px) brightness(0.8)";
      ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      // reset filter for sharp drawing
      ctx.filter = "none";

      if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
        const landmarks = results.multiFaceLandmarks[0];

        // Compute face center
        let cx = 0, cy = 0;
        for (const [i] of FACEMESH_FACE_OVAL) {
          cx += landmarks[i].x * canvasElement.width;
          cy += landmarks[i].y * canvasElement.height;
        }
        cx /= FACEMESH_FACE_OVAL.length;
        cy /= FACEMESH_FACE_OVAL.length;

        const scale = 1.2; // make face area 20% wider

        ctx.save();
        ctx.beginPath();
        for (let i = 0; i < FACEMESH_FACE_OVAL.length; i++) {
          const [startIdx] = FACEMESH_FACE_OVAL[i];
          const pt = landmarks[startIdx];
          let x = pt.x * canvasElement.width;
          let y = pt.y * canvasElement.height;

          // Expand point outward from center
          x = cx + (x - cx) * scale;
          y = cy + (y - cy) * scale;

          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();

        // Clip and draw sharp face
        ctx.clip();
        ctx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        ctx.restore();

        statusEl.textContent = "Face detected, background blurred";
        
        // Notify React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'faceDetected',
            hasFace: true
          }));
        }
      } else {
        statusEl.textContent = "No face detected";
        
        // Notify React Native
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'faceDetected',
            hasFace: false
          }));
        }
      }

      ctx.restore();
    }

    // Start initialization
    initialize();
  </script>
</body>
</html>
`;

export default function UnifiedFaceBlurCamera({ 
  style, 
  onFaceDetected, 
  onFaceLost, 
  ...props 
}) {
  const [isFaceDetected, setIsFaceDetected] = useState(false);
  const webViewRef = useRef(null);

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'faceDetected') {
        const hasFace = data.hasFace;
        if (hasFace !== isFaceDetected) {
          setIsFaceDetected(hasFace);
          if (hasFace) {
            onFaceDetected?.();
          } else {
            onFaceLost?.();
          }
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView
        ref={webViewRef}
        source={{ html: FaceBlurHTML }}
        style={styles.webview}
        onMessage={handleMessage}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        mixedContentMode="compatibility"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});
