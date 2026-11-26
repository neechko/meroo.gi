import React, { createContext, useContext, useRef } from 'react';

type BlurTargetRef = React.RefObject<any> | undefined;

const BlurTargetContext = createContext<BlurTargetRef>(undefined);

export function BlurTargetProvider({ children }: { children: React.ReactNode }) {
  const targetRef = useRef<any>(null);
  return (
    <BlurTargetContext.Provider value={targetRef}>
      {children}
    </BlurTargetContext.Provider>
  );
}

export function useBlurTarget(): BlurTargetRef {
  return useContext(BlurTargetContext);
}