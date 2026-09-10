import { useDropzone } from "react-dropzone";
import { UploadCloud, FileText, X } from "lucide-react";
import clsx from "clsx";

export default function FileUpload({ onFile, accept = ".csv", file, label = "Drop a transaction CSV here" }) {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (files) => files[0] && onFile(files[0]),
    accept: { "text/csv": [".csv"], "application/vnd.ms-excel": [".csv"] },
    multiple: false,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          "upload-zone group",
          isDragActive && "active border-[#d99a53] bg-[#d99a53]/10"
        )}
        id="file-upload-zone"
      >
        <input {...getInputProps()} />
        <div className="w-11 h-11 rounded-full bg-[#1c1b18] border border-white/[0.08] group-hover:border-[#d99a53]/50 flex items-center justify-center transition-colors">
          <UploadCloud size={20} className="text-[#d99a53] group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold text-[#f5efe6]">{label}</p>
          <p className="text-[11px] text-[#9e9488] mt-0.5">Click to browse or drag and drop</p>
        </div>
        <span className="text-[10px] font-mono text-[#c49b5c] bg-[#1a1917] px-2.5 py-0.5 rounded-full border border-white/[0.06]">
          CSV format · max 50 MB
        </span>
      </div>

      {file && (
        <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-[#181715] border border-white/[0.08] animate-fade-in">
          <FileText size={15} className="text-[#d99a53] shrink-0" />
          <span className="text-xs text-[#f5efe6] flex-1 truncate font-mono">{file.name}</span>
          <span className="text-[10px] font-mono text-[#9e9488]">{(file.size / 1024).toFixed(1)} KB</span>
          <button
            onClick={(e) => { e.stopPropagation(); onFile(null); }}
            className="text-[#6e665d] hover:text-rose-400 transition-colors p-1"
            title="Remove file"
          >
            <X size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
