import React from 'react';
import { LogOut, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Upload, 
  Shield, 
  Search, 
  FileCheck, 
  Settings,
  Clock
} from 'lucide-react';

const Sidebar:React.FC = () => {

    const sidebarNavItems = [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Chain of Custody", href: "/chain", icon: Clock },
        { title: "Cases", href: "/cases", icon: Search },
        { title: "Logs", href: "/logs", icon: FileCheck },
        { title: "Settings", href: "/settings", icon: Settings },
    ];

    const pathname = usePathname();

    const isActive = (path: string) => pathname.includes(path);
  
    return (
        <>
            <aside className="hidden md:flex md:w-64 flex-col border-r border-border p-4 space-y-4 bg-card">
                <nav className="flex-grow">
                    <ul className="space-y-2">
                        {sidebarNavItems.map((item) => (
                            <li key={item.title}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                          ${isActive(item.href)
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'}`}
                                >
                                    <item.icon className={`h-4 w-4 ${isActive(item.href) ? 'text-primary' : ''}`} />
                                    {item.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="mt-auto border-t border-border pt-4">
                    <Link href="/dashboard/profile" className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted hover:text-foreground">
                        <UserCircle className="h-5 w-5" />
                        Profile
                    </Link>
                    <Button variant="outline" className="w-full mt-2" onClick={() => signOut({ callbackUrl: '/login' })}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                    </Button>
                </div>
            </aside>
        </>
    )
}

export default Sidebar;