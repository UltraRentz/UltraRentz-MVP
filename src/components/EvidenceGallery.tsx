import React, { useRef } from "react";

interface EvidenceGalleryProps {
  evidence: Array<{
    id: string;
    file_url: string;
    file_type: string;
    file_name: string;
    uploaded_by: string;
    created_at: string;
  }>;
  onUpload?: (file: File) => void;
  uploading?: boolean;
}

const EvidenceGallery: React.FC<EvidenceGalleryProps> = ({ evidence, onUpload, uploading }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && onUpload) {
      onUpload(e.target.files[0]);
    }
  };

  return (
    <div>
      {onUpload && (
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload Evidence"}
          </button>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {evidence.map((ev) => (
          <div key={ev.id} className="border rounded p-2 bg-gray-50 dark:bg-gray-800">
            {ev.file_type.startsWith("image/") ? (
              <img src={ev.file_url} alt={ev.file_name} className="w-full h-32 object-cover rounded" />
            ) : ev.file_type.startsWith("video/") ? (
              <video src={ev.file_url} controls className="w-full h-32 rounded" />
            ) : (
              <a href={ev.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline block truncate">
                {ev.file_name}
              </a>
            )}
            <div className="text-xs mt-1 text-gray-500">{new Date(ev.created_at).toLocaleString()}</div>
          </div>
        ))}
      </div>
      {evidence.length === 0 && <div className="text-gray-500 text-center py-8">No evidence uploaded yet.</div>}
    </div>
  );
};

export default EvidenceGallery;
