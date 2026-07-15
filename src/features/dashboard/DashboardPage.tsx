import { DashboardHero } from './components/DashboardHero';
import { DashboardOverview } from './components/DashboardOverview';
import { DashboardCapability } from './components/DashboardCapability';
import { DashboardArchitecture } from './components/DashboardArchitecture';
import { DashboardAdvantage } from './components/DashboardAdvantage';
import { DashboardCTA } from './components/DashboardCTA';

export function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="px-4 sm:px-6 py-5 mx-auto space-y-16 pb-16 font-sans">
        <DashboardHero />
        <DashboardOverview />
        <DashboardCapability />
        <DashboardArchitecture />
        <DashboardAdvantage />
        <DashboardCTA />
      </div>
    </div>
  );
}
