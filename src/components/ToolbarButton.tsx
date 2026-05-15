interface ToolbarButtonProps {
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  label: string;
}

export default function ToolbarButton({ onClick, active, children, label }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`p-1.5 rounded transition-colors ${
        active ? 'bg-surface-soft text-ink' : 'text-muted hover:text-ink hover:bg-surface-soft'
      }`}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}
