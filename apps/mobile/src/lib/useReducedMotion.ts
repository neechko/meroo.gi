import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    AccessibilityInfo.isReduceMotionEnabled().then(value => {
      if (mounted) setReduced(value);
    }).catch(() => {});
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
}
