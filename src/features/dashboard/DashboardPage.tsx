import { DashboardAdvantage } from './components/DashboardAdvantage';
import { DashboardArchitecture } from './components/DashboardArchitecture';
import { DashboardCapability } from './components/DashboardCapability';
import { DashboardCTA } from './components/DashboardCTA';
import { DashboardHero } from './components/DashboardHero';
import { DashboardOverview } from './components/DashboardOverview';

export function DashboardPage() {
  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-[1440px] space-y-16 px-6 py-6 lg:px-8 lg:py-8">
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
