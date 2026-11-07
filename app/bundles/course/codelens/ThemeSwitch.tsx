import { Moon, Sun } from 'lucide-react';
import './theme-switch.css';

export default function ThemeSwitch({ theme, onChange }: { theme: 'light' | 'dark'; onChange: (theme: 'light' | 'dark') => void }) {
  return <button type="button" className="theme-switch-control" role="switch" aria-checked={theme==='dark'} aria-label="Dark mode" onClick={()=>onChange(theme==='dark'?'light':'dark')}>
    <Sun size={15} aria-hidden="true"/><span className="theme-switch-track"><span/></span><Moon size={15} aria-hidden="true"/>
  </button>;
}
