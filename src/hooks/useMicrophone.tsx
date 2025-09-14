import { useState, useEffect, useCallback } from 'react';
import { useNotificationHelpers } from '@/contexts/NotificationContext';

type MicrophonePermission = 'unknown' | 'granted' | 'denied' | 'prompt';

export function useMicrophone() {
  const [permission, setPermission] = useState<MicrophonePermission>('unknown');
  const [isRequesting, setIsRequesting] = useState(false);
  const { showSuccess, showError } = useNotificationHelpers();

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const checkPermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const permission = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        setPermission(permission.state);
        
        permission.onchange = () => {
          setPermission(permission.state);
        };
      } else {
        // Fallback for browsers that don't support permissions API
        setPermission('unknown');
      }
    } catch (error) {
      console.log('Permission check failed:', error);
      setPermission('unknown');
    }
  }, []);

  const requestPermission = useCallback(async () => {
    setIsRequesting(true);
    try {
      // Enhanced audio constraints for better mobile compatibility
      const audioConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Mobile-specific constraints
          sampleRate: 44100,
          channelCount: 1,
          latency: 0.01
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
      
      // Permission granted, stop the stream immediately
      stream.getTracks().forEach(track => track.stop());
      setPermission('granted');
      
      showSuccess("Microphone Access Granted", "You can now use voice input features.");
      
      return true;
    } catch (error: any) {
      console.error('Microphone permission error:', error);
      setPermission('denied');
      
      if (error.name === 'NotAllowedError') {
        showError("Microphone Access Denied", isMobile 
          ? "Please tap 'Allow' when prompted, or enable microphone access in your browser settings."
          : "Please allow microphone access in your browser settings to use voice input.");
      } else if (error.name === 'NotFoundError') {
        showError("No Microphone Found", "No microphone device was found on your device.");
      } else if (error.name === 'NotSupportedError') {
        showError("Microphone Not Supported", "Your browser or device doesn't support microphone access.");
      } else if (error.name === 'NotReadableError') {
        showError("Microphone In Use", "Microphone is being used by another application. Please close other apps and try again.");
      } else {
        showError("Microphone Error", "Failed to access microphone. Please check your device settings.");
      }
      
      return false;
    } finally {
      setIsRequesting(false);
    }
  }, [showSuccess, showError]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  return {
    permission,
    isRequesting,
    requestPermission,
    checkPermission,
    hasPermission: permission === 'granted',
    isDenied: permission === 'denied',
    needsPermission: permission === 'unknown' || permission === 'prompt',
    isMobile
  };
}
