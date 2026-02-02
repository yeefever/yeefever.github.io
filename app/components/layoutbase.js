import Sidebar from './header';

export default function LayoutBase({ children }) {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <Sidebar />
      <main className="flex-grow min-w-0">{children}</main>
    </div>
  );
}
