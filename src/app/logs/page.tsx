'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertTriangle, Search, Calendar, Filter, SlidersHorizontal, FileText, Eye, Edit, Download, Clock, User } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LogEntry {
  id: string;  // Only used for React keys, not displayed
  fileName: string;
  caseId: string;
  actionType: string;
  timestamp: string;
  user: string;
  details?: string;
  userRole?: string;
  ipAddress?: string;
}

// Reuse the protected layout from dashboard
function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isLoading = status === 'loading';
  const isAuthenticated = status === 'authenticated';

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login?callbackUrl=/logs');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
        <Loader2 className="h-12 w-12 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-950">
      <Navbar />
      <div className="container mx-auto px-4">
        <div className="flex flex-1 mt-4 rounded-lg overflow-hidden">
          <div className="hidden md:block">
            <Sidebar />
          </div>
          <main className="flex-1 bg-card rounded-lg shadow-xl p-6 overflow-auto ml-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function getActionIcon(action: string) {
  switch (action) {
    case 'view':
      return <Eye className="h-4 w-4 text-blue-500" />;
    case 'modify':
      return <Edit className="h-4 w-4 text-amber-500" />;
    case 'download':
      return <Download className="h-4 w-4 text-green-500" />;
    default:
      return <Eye className="h-4 w-4 text-gray-500" />;
  }
}

function getActionBadge(action: string) {
  switch (action) {
    case 'access':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Access</Badge>;
    case 'modified':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Modify</Badge>;
    case 'download':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Download</Badge>;
    case 'created':
      return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">Created</Badge>;
    default:
      return <Badge variant="outline">View</Badge>;
  }
}

function LogsContent() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await fetch('/api/logs');

        if (!response.ok) {
          throw new Error(`Failed to fetch logs: ${response.statusText}`);
        }
        const data = await response.json();
        console.log('Fetched logs:', data);

        // Transform API data to match LogEntry interface
        const formattedLogs: LogEntry[] = data.map((log: any) => ({
          id: log._id || '', // We'll keep this for React keys but won't display it
          actionType: log.action || 'access',
          fileName: log.file?.name || 'Unknown file',
          caseId: log.caseId || 'Unknown case',
          timestamp: new Date(log.timestamp).toLocaleString(),
          user: log.user?.username || 'Unknown user',
          details: log.details || ''
        }));

        setLogs(formattedLogs);
        setFilteredLogs(formattedLogs);
      } catch (err: any) {
        console.error('Error fetching logs:', err);
        setError(err.message || 'Failed to load logs');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLogs();
  }, []);

  // Apply filters when any filter changes
  useEffect(() => {
    let filtered = logs;

    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.fileName.toLowerCase().includes(term) ||
        log.caseId.toLowerCase().includes(term) ||
        log.user.toLowerCase().includes(term) ||
        (log.details && log.details.toLowerCase().includes(term))
      );
    }

    // Apply action type filter
    if (actionFilter !== 'all') {
      filtered = filtered.filter(log => log.actionType === actionFilter);
    }

    // Apply time filter
    const now = new Date();
    if (timeFilter === 'today') {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      filtered = filtered.filter(log => new Date(log.timestamp) >= today);
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      filtered = filtered.filter(log => new Date(log.timestamp) >= weekAgo);
    } else if (timeFilter === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      filtered = filtered.filter(log => new Date(log.timestamp) >= monthAgo);
    }

    setFilteredLogs(filtered);
  }, [searchTerm, actionFilter, timeFilter, logs]);

  return (
    <section id="logs" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Access Logs</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by file, case, or user..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Action" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="view">View</SelectItem>
              <SelectItem value="modify">Modify</SelectItem>
              <SelectItem value="download">Download</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[130px]">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue placeholder="Time" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading logs...</p>
        </div>
      )}

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isLoading && !error && (
        <>
          <div className="rounded-md border mb-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Action</TableHead>
                  <TableHead className="w-[200px]">File</TableHead>
                  <TableHead className="w-[100px]">Case ID</TableHead>
                  <TableHead className="w-[130px]">User</TableHead>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {getActionBadge(log.actionType)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{log.fileName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{log.caseId}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span>{log.user}</span>
                        </div>
                        {log.userRole && (
                          <span className="text-xs text-muted-foreground">{log.userRole}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>{log.timestamp}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{log.details || '-'}</span>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      No logs found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="text-sm text-muted-foreground">
            Showing {filteredLogs.length} of {logs.length} log entries
          </div>
        </>
      )}
    </section>
  );
}

export default function LogsPage() {
  return (
    <ProtectedLayout>
      <LogsContent />
    </ProtectedLayout>
  );
}