'use client'

import { useState } from 'react'
import Papa from 'papaparse'
import { ingestCsvBatch } from './actions'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export default function IngestPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  }

  const parseFile = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Show first 5 rows as preview
        setPreview(results.data.slice(0, 5));
        setStatus(null);
      },
      error: (error) => {
        setStatus({ type: 'error', msg: 'Failed to parse CSV: ' + error.message });
      }
    });
  }

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data.map((row: any) => ({
          // SIMPLE MAPPING: Adjust these keys to match your specific CSV headers!
          // DistroKid/Tunecore usually use "Title", "Track Title", "ISRC"
          title: row['Title'] || row['Track Title'] || row['Song Name'] || '',
          isrc: row['ISRC'] || row['isrc'] || '',
          artist: row['Artist'] || row['Artist Name'] || ''
        }));

        const result = await ingestCsvBatch(rows);
        
        setLoading(false);
        if (result.success) {
          setStatus({ type: 'success', msg: `Successfully processed ${result.count} songs (${result.errors} errors).` });
          setFile(null);
          setPreview([]);
        } else {
          setStatus({ type: 'error', msg: 'Server error during import.' });
        }
      }
    });
  }

  return (
    <div className="container mx-auto p-6 max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Import Catalog</h1>
        <p className="text-gray-500">Upload a CSV from DistroKid, TuneCore, or Spotify to auto-populate your dashboard.</p>
      </div>

      {/* UPLOAD ZONE */}
      <Card className={`border-2 border-dashed ${file ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          {file ? (
            <>
              <FileText className="h-12 w-12 text-green-600 mb-4" />
              <p className="font-medium text-lg">{file.name}</p>
              <Button variant="ghost" size="sm" onClick={() => { setFile(null); setPreview([]); }} className="mt-2 text-gray-500">
                Remove
              </Button>
            </>
          ) : (
            <>
              <Upload className="h-12 w-12 text-gray-400 mb-4" />
              <p className="font-medium text-lg">Drag & Drop or Click to Upload</p>
              <p className="text-sm text-gray-500 mt-1">Accepts .CSV files</p>
              <input 
                type="file" 
                accept=".csv, .tsv"
                onChange={handleFileChange} 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </>
          )}
        </CardContent>
      </Card>

      {/* STATUS MESSAGES */}
      {status && (
        <div className={`p-4 rounded-md flex items-center gap-3 ${status.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {status.type === 'success' ? <CheckCircle className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
          {status.msg}
        </div>
      )}

      {/* PREVIEW TABLE */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview Data</CardTitle>
            <CardDescription>We found these columns. Please ensure "Title" and "ISRC" exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {Object.keys(preview[0]).map((head) => (
                      <th key={head} className="p-3 text-left font-medium text-gray-500">{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b last:border-0">
                      {Object.values(row).map((cell: any, j) => (
                        <td key={j} className="p-3">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button onClick={handleImport} disabled={loading} size="lg" className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Importing...' : 'Run Import'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}