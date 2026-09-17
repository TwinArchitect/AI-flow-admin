import { useNavigate } from 'react-router-dom';
import { KbEngineSettings } from './components/KbEngineSettings';

export function KbEngineSettingsPage() {
  const navigate = useNavigate();
  return <KbEngineSettings onBack={() => navigate('/agents/knowledge')} />;
}
