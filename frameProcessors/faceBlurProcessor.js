import { VisionCameraProxy, Frame } from 'react-native-vision-camera';

const plugin = VisionCameraProxy.initFrameProcessorPlugin('faceBlurProcessor');

export function faceBlurProcessor(frame) {
  'worklet';
  
  if (plugin == null) {
    throw new Error('Failed to load faceBlurProcessor plugin!');
  }
  
  return plugin.call(frame, {
    // Configuration options
    blurRadius: 12,
    faceScale: 1.2,
    minFaceSize: 0.1,
    maxFaceSize: 0.8,
  });
}
