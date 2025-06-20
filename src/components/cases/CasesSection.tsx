"use client";
import { useState, useEffect } from 'react';
import { Briefcase, Folder, Search, Plus, Loader2, AlertTriangle, MoreHorizontal, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from 'next/link';

type Case = {
  caseID: string;
  name: string;
  user: string;
  createdAt: string;
};

export default function CasesSection() {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCase, setNewCase] = useState({ caseID: '', name: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    fetchCases();
  }, []);
  console.log("CasesSection rendered", cases);
  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cases', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cases: ${response.statusText}`);
      }

      const data = await response.json();
      setCases(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching cases:', err);
      setError('Failed to load cases. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCases = cases.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCase.name.trim()) {
      setSubmitError("Case name is required");
      return;
    }
    
    if (!newCase.caseID.trim()) {
      setSubmitError("Case ID is required");
      return;
    }
    
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      const response = await fetch('/api/indexcase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          caseID: newCase.caseID,
          name: newCase.name 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create case');
      }
      
      // Refresh case list after successful creation
      await fetchCases();
      
      // Reset form and close modal
      setNewCase({ caseID: '', name: '' });
      setIsModalOpen(false);
      
    } catch (err: any) {
      console.error('Error creating case:', err);
      setSubmitError(err.message || 'Failed to create case. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cases" className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-primary" />
          <h2 className="text-3xl font-headline font-semibold">My Cases</h2>
        </div>
        <Button variant="default" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Case
        </Button>
      </div>

      <div className="relative w-full md:w-96 mb-6">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search cases..."
          className="pl-9"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="h-10 w-10 animate-spin mb-4" />
          <p>Loading cases...</p>
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
          {filteredCases.length === 0 ? (
            <div className="bg-muted p-8 rounded-lg text-center mt-6">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-2">No cases found.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create your first case
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {filteredCases.map((caseItem) => (
                <Link href={`/cases/${caseItem.caseID}`} key={caseItem.caseID} className="group">
                  <div className="flex flex-col items-center p-4 rounded-lg hover:bg-accent/50 transition-all cursor-pointer">
                    <div className="relative mb-2 group-hover:scale-105 transition-transform">
                      <Folder className="h-16 w-16 text-primary" />
                      <div className="absolute top-0 right-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Open</DropdownMenuItem>
                            <DropdownMenuItem>Rename</DropdownMenuItem>
                            <DropdownMenuItem>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                    <span className="text-sm text-center font-medium truncate w-full group-hover:text-primary transition-colors">
                      {caseItem.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      {formatDate(caseItem.createdAt)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Case Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
            <DialogDescription>
              Enter details for your new case.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateCase}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="case-id" className="text-left">
                  Case ID
                </Label>
                <Input
                  id="case-id"
                  placeholder="Enter case ID"
                  value={newCase.caseID}
                  onChange={(e) => setNewCase({ ...newCase, caseID: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="case-name" className="text-left">
                  Case Name
                </Label>
                <Input
                  id="case-name"
                  placeholder="Enter case name"
                  value={newCase.name}
                  onChange={(e) => setNewCase({ ...newCase, name: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
              
              {submitError && (
                <div className="text-sm text-destructive">{submitError}</div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Case'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}