import { useState, useEffect } from 'react';

// 按键检测 Hook
export function useKeyPress(targetKey: string | string[]) {
  const [keyPressed, setKeyPressed] = useState(false);

  useEffect(() => {
    const downHandler = (event: KeyboardEvent) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
      if (keys.includes(event.key)) {
        setKeyPressed(true);
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      const keys = Array.isArray(targetKey) ? targetKey : [targetKey];
      if (keys.includes(event.key)) {
        setKeyPressed(false);
      }
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [targetKey]);

  return keyPressed;
}

// 按键组合检测 Hook
export function useKeyCombo(keys: string[], callback: () => void) {
  useEffect(() => {
    const pressedKeys = new Set<string>();

    const downHandler = (event: KeyboardEvent) => {
      pressedKeys.add(event.key);
      
      // 检查是否所有按键都被按下
      const allPressed = keys.every(key => pressedKeys.has(key));
      if (allPressed) {
        event.preventDefault();
        callback();
      }
    };

    const upHandler = (event: KeyboardEvent) => {
      pressedKeys.delete(event.key);
    };

    window.addEventListener('keydown', downHandler);
    window.addEventListener('keyup', upHandler);

    return () => {
      window.removeEventListener('keydown', downHandler);
      window.removeEventListener('keyup', upHandler);
    };
  }, [keys, callback]);
}