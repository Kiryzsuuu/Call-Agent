"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, FileText, Check } from "lucide-react";

interface PdfFile {
  id: string;
  name: string;
  path: string;
  size: number;
}

export function PdfUploader({ onPdfSelected }: { onPdfSelected?: () => void } = {}) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [pdfs, setPdfs] = useState<PdfFile[]>([]);
  const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
  const [isSelectDialogOpen, setIsSelectDialogOpen] = useState(false);
  const [isSelectLoading, setIsSelectLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadStatus("");
    }
  };

  const fetchPdfs = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8002';
      const response = await fetch(`${backendUrl}/list-pdfs`);
      const data = await response.json();
      setPdfs(data.pdfs || []);
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    }
  };

  const selectPdf = async (pdfId: string) => {
    setIsSelectLoading(true);
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8002';
      const response = await fetch(`${backendUrl}/select-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pdf_id: pdfId }),
      });
      if (response.ok) {
        setSelectedPdf(pdfId);
        setIsSelectDialogOpen(false);
        if (onPdfSelected) onPdfSelected(); // Tambah: trigger refresh menu aktif
      }
    } catch (error) {
      console.error("Error selecting PDF:", error);
    }
    setIsSelectLoading(false);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8002';
        const res = await fetch(`${backendUrl}/upload-pdf-ocr`, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setUploadStatus("✅ Upload & OCR berhasil!");
          setSelectedFile(null);
          fetchPdfs(); // Refresh list
        } else {
          setUploadStatus(`❌ Upload atau OCR gagal: ${data.error || "Unknown error"}`);
        }
      } catch (err) {
        setUploadStatus("❌ Terjadi error saat upload.");
      }
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  useEffect(() => {
    if (isSelectDialogOpen) {
      fetchPdfs();
    }
  }, [isSelectDialogOpen]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Dialog open={isSelectDialogOpen} onOpenChange={setIsSelectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              Pilih PDF
              {selectedPdf && <Badge variant="secondary" className="ml-2">1</Badge>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pilih PDF Sumber</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {pdfs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Belum ada PDF yang diupload
                </p>
              ) : (
                pdfs.map((pdf) => (
                  <div
                    key={pdf.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedPdf === pdf.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => selectPdf(pdf.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdf.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(pdf.size)}
                        </p>
                      </div>
                      {selectedPdf === pdf.id && (
                        <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {isSelectLoading && (
              <p className="text-sm text-muted-foreground text-center">
                Memproses PDF...
              </p>
            )}
          </DialogContent>
        </Dialog>
        
        <Input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          className="cursor-pointer text-sm"
        />
        
        {selectedFile && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground truncate">
              File: {selectedFile.name}
            </div>
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              size="sm"
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </div>
        )}
        
        {uploadStatus && (
          <p className="text-sm">{uploadStatus}</p>
        )}
      </div>
    </div>
  );
}
