import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import clsx from "clsx";

export default function FileUpload({ onFile, accept = ".csv", file, label = "Drop a CSV file here" }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFile(files[0]),
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx("upload-zone", isDragActive && "active")}
        id="file-upload-zone"
      >
        <input {...getInputProps()} />
        <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <UploadCloud size={22} className="text-brand-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-slate-300">{label}</p>
          <p className="text-xs text-slate-500 mt-0.5">Click to browse or drag and drop</p>
        </div>
        <span className="text-xs text-slate-600 bg-surface-muted px-3 py-1 rounded-full border border-surface-border">
          CSV, max 50 MB
        </span>
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-surface-muted border border-surface-border animate-fade-in">
          <FileText size={16} className="text-brand-400 shrink-0" />
          <span className="text-sm text-slate-300 flex-1 truncate">{file.name}</span>
          <span className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="text-slate-500 hover:text-red-400 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
