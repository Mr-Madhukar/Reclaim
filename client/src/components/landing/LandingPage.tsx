import React from 'react';
import { HeroSection } from './HeroSection';
import { WorkflowPipeline } from './WorkflowPipeline';
import { LaneShowcase } from './LaneShowcase';
import { LiveProofMetrics } from './LiveProofMetrics';
import { ArchitectureCard } from './ArchitectureCard';
import { MainTab } from '../layout/Navbar';

interface LandingPageProps {
  onSelectTab: (tab: MainTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectTab }) => {
  return (
    <div className="w-full flex flex-col space-y-4 animate-fade-in">
      <HeroSection onLaunchDashboard={onSelectTab} />
      <WorkflowPipeline />
      <LaneShowcase />
      <LiveProofMetrics onLaunchDashboard={onSelectTab} />
      <ArchitectureCard />
    </div>
  );
};
