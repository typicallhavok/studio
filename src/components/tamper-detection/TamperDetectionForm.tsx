'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { detectTampering, type DetectTamperingOutput } from '@/ai/flows/detect-tampering';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle2, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  chainOfCustodyLogs: z.string().min(10, 'Chain of custody logs must not be empty and should be detailed.'),
  evidenceData: z.string().min(10, 'Evidence data must not be empty and should be detailed.'),
});

type TamperDetectionFormValues = z.infer<typeof formSchema>;

export default function TamperDetectionForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DetectTamperingOutput | null>(null);
  const { toast } = useToast();

  const form = useForm<TamperDetectionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      chainOfCustodyLogs: '',
      evidenceData: '',
    },
  });

  const onSubmit: SubmitHandler<TamperDetectionFormValues> = async (data) => {
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await detectTampering(data);
      setAnalysisResult(result);
      toast({
        title: "Analysis Complete",
        description: "Tamper detection analysis has finished.",
      });
    } catch (error) {
      console.error('Tamper detection error:', error);
      setAnalysisResult(null);
      toast({
        title: "Analysis Failed",
        description: "An error occurred during tamper detection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="chainOfCustodyLogs"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Chain of Custody Logs</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste JSON, CSV, or plain text logs here..."
                    className="min-h-[150px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="evidenceData"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base">Evidence Data</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Paste evidence details, descriptions, timestamps, MD5 hashes, etc..."
                    className="min-h-[150px] resize-y"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Analyze for Tampering
              </>
            )}
          </Button>
        </form>
      </Form>

      {analysisResult && (
        <Card className="mt-6 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              {analysisResult.isTampered ? (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              ) : (
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              )}
              <CardTitle className="text-xl">Analysis Result</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className={`text-lg font-semibold ${analysisResult.isTampered ? 'text-destructive' : 'text-green-600'}`}>
              Potential Tampering Detected: {analysisResult.isTampered ? 'Yes' : 'No'}
            </p>
            <div>
              <h4 className="font-medium">Explanation:</h4>
              <p className="text-muted-foreground text-sm">{analysisResult.explanation}</p>
            </div>
            <div>
              <h4 className="font-medium">Confidence Score:</h4>
              <p className="text-muted-foreground text-sm">{(analysisResult.confidenceScore * 100).toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
