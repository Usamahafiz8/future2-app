import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

const WebFaceBlurHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Face Background Blur</title>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js"></script>
  <style>
    html,body { height:100%; margin:0; background:#111; color:#eee; font-family: Arial, sans-serif; }
    .wrap { position:relative; width: 100%; height: 100%; margin: 0; }
    video, canvas { display:block; width: 100%; height: 100%; border-radius: 6px; }
    #overlay { position:absolute; top:0; left:0; pointer-events:none; }
    #status { position:absolute; top:10px; right:10px; background:rgba(0,0,0,0.5); padding:8px 12px; border-radius:20px; color:white; font-size:12px; }
  </style>
</head>
<body>
  <div class="wrap">
    <video id="video" autoplay muted playsinline></video>
    <canvas id="overlay"></canvas>
  </div>
  <div id="status">Loading model…</div>

  <script>
    const videoElement = document.getElementById('video');
    const canvasElement = document.getElementById('overlay');
    const ctx = canvasElement.getContext('2d');
    const statusEl = document.getElementById('status');

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
        await faceMesh.send({image: videoElement});
      },
      width: 640,
      height: 480
    });
    camera.start();

    function onResults(results) {
      if (!videoElement.videoWidth) return;
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
      } else {
        statusEl.textContent = "No face detected";
      }

      ctx.restore();
    }
  </script>
</body>
</html>
`;

export default function WebFaceBlurCamera({ style, onFaceDetected, onFaceLost, ...props }) {
  const [isFaceDetected, setIsFaceDetected] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // For web, we'll create a simple camera interface
      // Since we can't use WebView easily, we'll show a placeholder
      // In a real implementation, you'd use getUserMedia API directly
      
      // Simulate face detection for demo purposes
      const interval = setInterval(() => {
        const detected = Math.random() > 0.5; // Random detection for demo
        setIsFaceDetected(detected);
        if (detected) {
          onFaceDetected?.();
        } else {
          onFaceLost?.();
        }
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [onFaceDetected, onFaceLost]);

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
    <View style={[styles.container, style]}>
      <View style={styles.webCameraPlaceholder}>
        <Text style={styles.placeholderText}>
          📷 Web Camera with Face Blur
        </Text>
        <Text style={styles.placeholderSubtext}>
          {isFaceDetected ? '✅ Face Detected' : '❌ No Face Detected'}
        </Text>
        <Text style={styles.placeholderNote}>
          Note: For full web implementation, use MediaPipe directly with getUserMedia API
        </Text>
      </View>
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
  webCameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 12,
  },
  placeholderText: {
    fontSize: 24,
    color: 'white',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderSubtext: {
    fontSize: 18,
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 20,
  },
  placeholderNote: {
    fontSize: 12,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
