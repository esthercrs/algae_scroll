import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

const STORAGE_KEY = "algae-scroll-device-id";

function createId() {
  return "device-" + Math.random().toString(36).slice(2, 10);
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        if (mounted) setDeviceId(stored);
        return;
      }
      const generated = createId();
      await AsyncStorage.setItem(STORAGE_KEY, generated);
      if (mounted) setDeviceId(generated);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return deviceId;
}
