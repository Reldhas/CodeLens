import { Play } from 'lucide-react';
import type { Feature } from '../../features';
import { listAttempts, percent } from '../../practice-log.js';
import DryRunScreen from './DryRun';
const feature: Feature = {
  id: 'dry-run', role: 'student', kind: 'practice', order: 1, label: 'Dry Run', Screen: DryRunScreen,
  card: { icon: Play, lens: 'Correctness', skill: 'Trace the code by hand and predict what it prints.', minutes: '3–5 min',
    score: () => percent(listAttempts('dry-run').filter((a: any) => a.status === 'submitted').map((a: any) => a.score)) },
};
export default feature;
