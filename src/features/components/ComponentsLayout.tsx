import { Outlet } from 'react-router-dom';

export function ComponentsLayout() {
  return (
    <main className="h-full overflow-y-auto bg-background p-6">
      <Outlet />
    </main>
  );
}
