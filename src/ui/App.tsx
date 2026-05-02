import { useShallow } from 'zustand/react/shallow';
import { useUploadStore, selectUploadSummary } from '../core/state/useUploadStore';
import { useUploadPolling } from '../core/hooks/useUploadPolling';
import { FileList } from './components/FileList';
import { UploadDropzone } from './components/UploadDropzone';
import { SummaryCards } from './components/SummaryCards';
import { UploadBackground } from './components/UploadBackground';
import { useUploadController } from '../core/hooks/useUploadController';
import '../App.css';

export default function App() {
  const files = useUploadStore((state) => state.files);
  const summary = useUploadStore(useShallow(selectUploadSummary));
  
  const { onFilesSelected, retryFileUpload, retryAllFailedUploads, cancelFile } = useUploadController();

  useUploadPolling();

  return (
    <div className="app-wrapper">
      <UploadBackground />
      <div className="app-container">
        <h1 className="app-title">Upload Portal</h1>
        <UploadDropzone onFilesSelected={onFilesSelected} />
        <div className="app-filelist-section">
          <FileList
            files={files}
            onCancelFile={cancelFile}
            onRetryFile={retryFileUpload}
            onRetryAll={retryAllFailedUploads}
          />
        </div>
        <br></br>
        <div className="app-summary-section"><SummaryCards summary={summary} /></div>
      </div>
    </div>
  );
}
