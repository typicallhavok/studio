"use client";
import { useState, useEffect } from 'react';
import EvidenceCard from '@/components/dashboard/EvidenceCard';
import type { EvidenceItem } from '@/types/evidence';
import { FileText, BookOpen, VideoIcon, HardDrive, LayoutDashboard, Loader2, AlertTriangle, Upload, Files, FolderOpen, Users, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import { UploadSection } from "@/components/dashboard/UploadSection";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useSession } from 'next-auth/react';

// File type icon mapping 
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return FileText;
  if (mimeType.startsWith('video/')) return VideoIcon;
  if (mimeType.startsWith('application/pdf')) return BookOpen;
  return HardDrive;
};

interface CaseData {
  caseID: string;
  name: string;
  fileCount?: number;
}

interface DashboardStats {
  totalFiles: number;
  totalCases: number;
  totalUsers: number;
  recentUploads: number;
  filesByCaseData: Array<{ name: string; value: number; caseId: string }>;
  fileTypeData: Array<{ name: string; value: number }>;
  uploadsOverTime: Array<{ date: string; uploads: number }>;
}

const COLORS = ['#d4a373', '#faedcd', '#e6b8a2', '#881b05', '#ffc0b4', '#3b2f2f', '#f5f0e1'];

export default function DashboardSection() {
  const [caseFiles, setCaseFiles] = useState<EvidenceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalCases: 0,
    totalUsers: 0,
    recentUploads: 0,
    filesByCaseData: [],
    fileTypeData: [],
    uploadsOverTime: []
  });

  const { data: session } = useSession();
  const user = session?.user;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch files
        const filesResponse = await fetch('/api/files', {
          credentials: 'include',
        });

        if (!filesResponse.ok) {
          throw new Error(`Failed to fetch case files: ${filesResponse.statusText}`);
        }

        const filesData = await filesResponse.json();

        // Fetch cases
        const casesResponse = await fetch('/api/cases', {
          credentials: 'include',
        });

        let casesData = [];
        if (casesResponse.ok) {
          casesData = await casesResponse.json();
        }

        // Transform files data
        const formattedFiles: EvidenceItem[] = filesData.map((file: any) => {
          // Use createdAt as the primary timestamp since that's what your data has
          let lastUpdate = new Date().toLocaleString('en-GB'); // fallback
          
          if (file.createdAt) {
            // Use createdAt field which is already a proper ISO date
            const date = new Date(file.createdAt);
            lastUpdate = date.toLocaleString('en-GB'); // DD/MM/YYYY, HH:MM:SS format
          } else if (file.timestamp) {
            const date = new Date(file.timestamp);
            lastUpdate = date.toLocaleString('en-GB');
          }

          return {
            id: file._id,
            name: file.name,
            type: file.fileType || file.mimeType || 'Digital File',
            location: file.location || 'IPFS Network',
            user: file.user,
            lastUpdate, // This will now use createdAt
            icon: getFileIcon(file.fileType || file.mimeType || ''),
            cid: file.cid || file.ipfsHash,
            size: file.size,
            description: file.description || '',
            password: file.password || true,
            caseId: file.caseID
          };
        });

        setCaseFiles(formattedFiles);

        // Calculate statistics
        const stats = calculateDashboardStats(formattedFiles, casesData);
        setDashboardStats(stats);
        setError(null);
        
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateDashboardStats = (files: EvidenceItem[], cases: CaseData[]): DashboardStats => {
    // Helper function to parse DD/MM/YYYY format
    const parseDate = (dateString: string): Date | null => {
      try {
        // Handle DD/MM/YYYY, HH:MM:SS format
        if (dateString.includes('/') && dateString.includes(',')) {
          // Split date and time parts
          const [datePart, timePart] = dateString.split(', ');
          const [day, month, year] = datePart.split('/').map(Number);
          const [hours, minutes, seconds] = timePart.split(':').map(Number);
          
          // Create date with correct month (month is 0-indexed in JS)
          const date = new Date(year, month - 1, day, hours, minutes, seconds);
          
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
        
        // Fallback to standard parsing
        const standardDate = new Date(dateString);
        if (!isNaN(standardDate.getTime())) {
          return standardDate;
        }
        
        return null;
      } catch (error) {
        console.warn('Error parsing date:', dateString, error);
        return null;
      }
    };

    // Files by case
    const filesByCase = files.reduce((acc, file) => {
      const caseId = (file as any).caseId || 'Unknown';
      acc[caseId] = (acc[caseId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const filesByCaseData = Object.entries(filesByCase).map(([caseId, count]) => {
      const caseName = cases.find(c => c.caseID === caseId)?.name || `Case ${caseId}`;
      return {
        name: caseName.length > 15 ? caseName.substring(0, 15) + '...' : caseName,
        value: count,
        caseId
      };
    }).slice(0, 8);

    // Files by type
    const filesByType = files.reduce((acc, file) => {
      const type = file.type === 'Digital File' ? 'Other' : file.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const fileTypeData = Object.entries(filesByType).map(([type, count]) => ({
      name: type,
      value: count
    }));

    // Recent uploads (last 7 days) - Fixed date parsing
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);
    
    const recentUploads = files.filter(file => {
      const fileDate = parseDate(file.lastUpdate);
      if (!fileDate) {
        console.warn('Could not parse date for file:', file.name, file.lastUpdate);
        return false;
      }
      
      const isRecent = fileDate >= sevenDaysAgo;
      console.log('File date check:', {
        fileName: file.name,
        originalDate: file.lastUpdate,
        parsedDate: fileDate.toISOString(),
        sevenDaysAgo: sevenDaysAgo.toISOString(),
        isRecent
      });
      
      return isRecent;
    }).length;

    // Uploads over time (last 7 days)
    const uploadsOverTime = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const uploadsCount = files.filter(file => {
        const fileDate = parseDate(file.lastUpdate);
        if (!fileDate) return false;
        
        const isInDay = fileDate >= dayStart && fileDate <= dayEnd;
        if (isInDay) {
          console.log('Upload found for day:', dateStr, {
            fileName: file.name,
            fileDate: fileDate.toISOString(),
            dayStart: dayStart.toISOString(),
            dayEnd: dayEnd.toISOString()
          });
        }
        
        return isInDay;
      }).length;
      
      uploadsOverTime.push({
        date: dateStr,
        uploads: uploadsCount
      });
    }

    // Unique users count
    const uniqueUsers = new Set(files.map(file => file.user).filter(Boolean)).size;

    // Enhanced debug logging
    console.log('Dashboard Stats Debug:', {
      totalFiles: files.length,
      recentUploads,
      uploadsOverTime,
      sevenDaysAgo: sevenDaysAgo.toISOString(),
      currentDate: new Date().toISOString(),
      sampleFileDates: files.slice(0, 3).map(f => ({
        name: f.name,
        originalDate: f.lastUpdate,
        parsedDate: parseDate(f.lastUpdate)?.toISOString()
      }))
    });

    return {
      totalFiles: files.length,
      totalCases: cases.length,
      totalUsers: uniqueUsers,
      recentUploads,
      filesByCaseData,
      fileTypeData,
      uploadsOverTime
    };
  };

  // Function to refresh the case files after successful upload
  const handleUploadSuccess = () => {
    setIsUploadDialogOpen(false);
    // Refetch all data to update stats
    const fetchUpdatedData = async () => {
      try {
        const [filesResponse, casesResponse] = await Promise.all([
          fetch('/api/files', { credentials: 'include' }),
          fetch('/api/cases', { credentials: 'include' })
        ]);
        
        if (filesResponse.ok) {
          const filesData = await filesResponse.json();
          const formattedFiles: EvidenceItem[] = filesData.map((file: any) => ({
            id: file._id,
            name: file.name,
            type: file.fileType || file.mimeType || 'Digital File',
            location: file.location || 'IPFS Network',
            user: file.user,
            lastUpdate: file.timestamp ? new Date(file.timestamp).toLocaleString() : new Date().toLocaleString(),
            icon: getFileIcon(file.fileType || file.mimeType || ''),
            cid: file.cid || file.ipfsHash,
            size: file.size,
            description: file.description || '',
            password: file.password || true,
            caseId: file.caseID
          }));
          
          setCaseFiles(formattedFiles);
          
          const casesData = casesResponse.ok ? await casesResponse.json() : [];
          const stats = calculateDashboardStats(formattedFiles, casesData);
          setDashboardStats(stats);
        }
      } catch (err) {
        console.error('Error refetching dashboard data:', err);
      }
    };
    fetchUpdatedData();
  };

  // Update the CustomTooltip component to handle different chart types
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      
      // Handle pie chart data (has payload.name and payload.value)
      if (data.payload && data.payload.name && data.payload.value !== undefined) {
        return (
          <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
            <p className="text-card-foreground font-medium">
              {`${data.payload.name}: ${data.payload.value} files`}
            </p>
          </div>
        );
      }
      
      // Handle bar chart data (has label and value)
      if (label && data.value !== undefined) {
        return (
          <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
            <p className="text-card-foreground font-medium">
              {`${label}: ${data.value} uploads`}
            </p>
          </div>
        );
      }
      
      // Fallback
      return (
        <div className="bg-card p-3 border border-border rounded-lg shadow-lg">
          <p className="text-card-foreground font-medium">
            {`Value: ${data.value || 'N/A'}`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <section id="dashboard" className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-headline font-semibold text-card-foreground">Welcome {user?.name},</h2>
        </div>
        <div className="flex items-center gap-4">
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2 hover:bg-foreground transition-colors">
                <Upload className="h-4 w-4" />
                Upload Evidence
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Upload New Evidence</DialogTitle>
              </DialogHeader>
              <UploadSection onUploadSuccess={handleUploadSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading dashboard...</p>
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
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Files</CardTitle>
                <Files className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dashboardStats.totalFiles}</div>
                <p className="text-xs text-muted-foreground">Evidence items tracked</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
                <FolderOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dashboardStats.totalCases}</div>
                <p className="text-xs text-muted-foreground">Cases with evidence</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dashboardStats.totalUsers}</div>
                <p className="text-xs text-muted-foreground">Contributors</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Uploads</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{dashboardStats.recentUploads}</div>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Files by Case Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Files by Case
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  {dashboardStats.filesByCaseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dashboardStats.filesByCaseData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {dashboardStats.filesByCaseData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Upload Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upload Activity (7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dashboardStats.uploadsOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="uploads" fill="#d4a373" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* File Type Distribution */}
          {/* {dashboardStats.fileTypeData.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>File Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {dashboardStats.fileTypeData.map((type, index) => (
                    <div key={type.name} className="text-center">
                      <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" 
                           style={{ backgroundColor: COLORS[index % COLORS.length] + '20' }}>
                        <span className="text-lg font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                          {type.value}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-card-foreground">{type.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )} */}

          {/* Recent Evidence Files */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold mb-4 text-card-foreground">Recent Evidence Files</h3>
            <div className="flex flex-wrap gap-6">
              {caseFiles.slice(0, 3).map(item => (
                <div key={item.id} className="w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] flex-shrink-0">
                  <EvidenceCard item={item} />
                </div>
              ))}
            </div>

            {caseFiles.length === 0 && (
              <div className="bg-background p-8 rounded-lg text-center mt-6">
                <p className="text-muted-foreground mb-2">No evidence files found.</p>
              </div>
            )}

            {caseFiles.length > 6 && (
              <div className="text-center mt-6">
                <Button variant="outline" asChild>
                  <a href="/dashboard">View All Files ({caseFiles.length})</a>
                </Button>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
