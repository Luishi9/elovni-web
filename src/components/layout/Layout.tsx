import { SidebarProvider, SidebarInset, SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';

function MainContent() {
  const { open, setOpen, isMobile } = useSidebar();
  return (
    <>
      {!isMobile && open && (
        <div
          className="fixed inset-0 z-[5] bg-black/20 cursor-pointer"
          onClick={() => setOpen(false)}
        />
      )}
      <SidebarInset>
        <header className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <SidebarTrigger />
          <Header />
        </header>
        <div className="flex-1 p-4 md:p-6 overflow-hidden relative z-0 flex flex-col">
          <Outlet />
        </div>
      </SidebarInset>
    </>
  );
}

//export default function Layout = () => (
export default function Layout() {
  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <MainContent />
    </SidebarProvider>
  )
}