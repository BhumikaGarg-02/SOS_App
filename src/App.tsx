import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/appStore';
import { PhoneFrame } from './components/PhoneFrame';
import { DemoControlBar } from './components/DemoControlBar';
import { Welcome } from './screens/onboarding/Welcome';
import { AgeGate } from './screens/onboarding/AgeGate';
import { Guardians } from './screens/onboarding/Guardians';
import { SetPins } from './screens/onboarding/SetPins';
import { ChooseCover } from './screens/onboarding/ChooseCover';
import { GroceryCalc } from './screens/covers/GroceryCalc';
import { CgpaCalc } from './screens/covers/CgpaCalc';
import { WellnessTracker } from './screens/covers/WellnessTracker';
import { VaultShell } from './screens/vault/VaultShell';
import { FakeVault } from './screens/fakevault/FakeVault';
import { CasePacket } from './screens/vault/CasePacket';
import { IncomingCall } from './screens/call/IncomingCall';
import { ActiveCall } from './screens/call/ActiveCall';
import { initPanicListeners } from './lib/panic';
import { initDeadmanWatcher } from './lib/deadman';
import { ensureAudioUnlocked } from './lib/ringtone';

export const App: React.FC = () => {
  const screen = useAppStore((s) => s.screen);
  const cover = useAppStore((s) => s.cover);
  const setupComplete = useAppStore((s) => s.setupComplete);

  // Onboarding sub-steps: 0: Welcome, 1: AgeGate, 2: Guardians, 3: SetPins, 4: ChooseCover
  const [onboardingStep, setOnboardingStep] = useState(0);

  useEffect(() => {
    initPanicListeners();
    initDeadmanWatcher();

    const handleFirstInteraction = () => {
      ensureAudioUnlocked();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
    window.addEventListener('pointerdown', handleFirstInteraction, { passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Render active cover component based on cover selection
  const renderCover = () => {
    switch (cover) {
      case 'cgpa':
        return <CgpaCalc />;
      case 'wellness':
        return <WellnessTracker />;
      case 'grocery':
      default:
        return <GroceryCalc />;
    }
  };

  // Screen router driven by store.screen
  const renderScreen = () => {
    // If setup is not complete, always force onboarding
    if (!setupComplete || screen === 'onboarding') {
      switch (onboardingStep) {
        case 0:
          return <Welcome onNext={() => setOnboardingStep(1)} />;
        case 1:
          return (
            <AgeGate
              onNext={() => setOnboardingStep(2)}
              onBack={() => setOnboardingStep(0)}
            />
          );
        case 2:
          return (
            <Guardians
              onNext={() => setOnboardingStep(3)}
              onBack={() => setOnboardingStep(1)}
            />
          );
        case 3:
          return (
            <SetPins
              onNext={() => setOnboardingStep(4)}
              onBack={() => setOnboardingStep(2)}
            />
          );
        case 4:
        default:
          return <ChooseCover onBack={() => setOnboardingStep(3)} />;
      }
    }

    switch (screen) {
      case 'vault':
        return <VaultShell />;
      case 'fakeVault':
        return <FakeVault />;
      case 'casePacket':
        return <CasePacket />;
      case 'incomingCall':
        return <IncomingCall />;
      case 'activeCall':
        return <ActiveCall />;
      case 'cover':
      default:
        return renderCover();
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#E9ECEF] flex flex-col lg:flex-row items-center justify-center p-0 sm:p-4 gap-6 overflow-x-hidden">
      {/* Phone Frame */}
      <PhoneFrame>{renderScreen()}</PhoneFrame>

      {/* Demo Control Bar (Desktop Only, collapsible panel to the right of frame) */}
      <DemoControlBar />
    </div>
  );
};

export default App;
