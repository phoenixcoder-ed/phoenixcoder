import React, { useRef, useState, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Progress } from '../ui/Progress';
import { Upload, X, File, Image, FileText, Music, Video, Archive } from 'lucide-react';

// 文件类型枚举
export enum FileType {
  IMAGE = 'image',
  DOCUMENT = 'document',
  AUDIO = 'audio',
  VIDEO = 'video',
  ARCHIVE = 'archive',
  ANY = 'any'
}

// 上传状态枚举
export enum UploadStatus {
  IDLE = 'idle',
  UPLOADING = 'uploading',
  SUCCESS = 'success',
  ERROR = 'error'
}

// 文件信息接口
export interface FileInfo {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  url?: string;
  status: UploadStatus;
  progress: number;
  error?: string;
}

// 文件上传属性接口
export interface FileUploadProps {
  className?: string;
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // 字节
  maxFiles?: number;
  fileType?: FileType;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  dragAndDrop?: boolean;
  value?: FileInfo[];
  onChange?: (files: FileInfo[]) => void;
  onUpload?: (file: File) => Promise<string>; // 返回文件URL
  onRemove?: (fileId: string) => void;
  placeholder?: string;
  uploadText?: string;
  browseText?: string;
  removeText?: string;
  errorMessages?: {
    maxSize?: string;
    maxFiles?: string;
    fileType?: string;
    uploadError?: string;
  };
}

// 文件类型配置
const fileTypeConfig = {
  [FileType.IMAGE]: {
    accept: 'image/*',
    icon: Image,
    extensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
  },
  [FileType.DOCUMENT]: {
    accept: '.pdf,.doc,.docx,.txt,.rtf',
    icon: FileText,
    extensions: ['.pdf', '.doc', '.docx', '.txt', '.rtf']
  },
  [FileType.AUDIO]: {
    accept: 'audio/*',
    icon: Music,
    extensions: ['.mp3', '.wav', '.ogg', '.m4a']
  },
  [FileType.VIDEO]: {
    accept: 'video/*',
    icon: Video,
    extensions: ['.mp4', '.avi', '.mov', '.wmv', '.flv']
  },
  [FileType.ARCHIVE]: {
    accept: '.zip,.rar,.7z,.tar,.gz',
    icon: Archive,
    extensions: ['.zip', '.rar', '.7z', '.tar', '.gz']
  },
  [FileType.ANY]: {
    accept: '*/*',
    icon: File,
    extensions: []
  }
};

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 获取文件图标
const getFileIcon = (file: File): React.ComponentType<any> => {
  const type = file.type;
  if (type.startsWith('image/')) return Image;
  if (type.startsWith('audio/')) return Music;
  if (type.startsWith('video/')) return Video;
  if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileText;
  if (type.includes('zip') || type.includes('archive')) return Archive;
  return File;
};

// 文件项组件
const FileItem: React.FC<{
  file: FileInfo;
  showPreview: boolean;
  showProgress: boolean;
  onRemove: (id: string) => void;
  removeText: string;
}> = ({ file, showPreview, showProgress, onRemove, removeText }) => {
  const FileIcon = getFileIcon(file.file);
  
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg bg-background">
      {/* 文件图标或预览 */}
      <div className="flex-shrink-0">
        {showPreview && file.file.type.startsWith('image/') && file.url ? (
          <img
            src={file.url}
            alt={file.name}
            className="w-12 h-12 object-cover rounded"
          />
        ) : (
          <div className="w-12 h-12 flex items-center justify-center bg-muted rounded">
            <FileIcon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
      </div>
      
      {/* 文件信息 */}
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{file.name}</div>
        <div className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </div>
        
        {/* 上传进度 */}
        {showProgress && file.status === UploadStatus.UPLOADING && (
          <div className="mt-2">
            <Progress value={file.progress} className="h-1" />
            <div className="text-xs text-muted-foreground mt-1">
              {file.progress}%
            </div>
          </div>
        )}
        
        {/* 错误信息 */}
        {file.status === UploadStatus.ERROR && file.error && (
          <div className="text-xs text-red-600 mt-1">{file.error}</div>
        )}
      </div>
      
      {/* 移除按钮 */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(file.id)}
        className="flex-shrink-0"
        title={removeText}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
};

// 文件上传组件
export const FileUpload: React.FC<FileUploadProps> = ({
  className,
  accept,
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 5,
  fileType = FileType.ANY,
  disabled = false,
  showPreview = true,
  showProgress = true,
  dragAndDrop = true,
  value = [],
  onChange,
  onUpload,
  onRemove,
  placeholder = '点击上传文件或拖拽文件到此处',
  uploadText = '上传文件',
  browseText = '浏览文件',
  removeText = '移除文件',
  errorMessages = {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<FileInfo[]>(value);
  
  // 获取接受的文件类型
  const getAcceptTypes = () => {
    if (accept) return accept;
    return fileTypeConfig[fileType].accept;
  };
  
  // 验证文件
  const validateFile = (file: File): string | null => {
    // 检查文件大小
    if (file.size > maxSize) {
      return errorMessages.maxSize || `文件大小不能超过 ${formatFileSize(maxSize)}`;
    }
    
    // 检查文件类型
    if (fileType !== FileType.ANY) {
      const config = fileTypeConfig[fileType];
      const isValidType = config.extensions.length === 0 || 
        config.extensions.some(ext => file.name.toLowerCase().endsWith(ext));
      
      if (!isValidType) {
        return errorMessages.fileType || `不支持的文件类型，请选择 ${config.extensions.join(', ')} 格式的文件`;
      }
    }
    
    return null;
  };
  
  // 处理文件选择
  const handleFiles = useCallback(async (selectedFiles: FileList) => {
    const newFiles: FileInfo[] = [];
    
    // 检查文件数量限制
    if (files.length + selectedFiles.length > maxFiles) {
      alert(errorMessages.maxFiles || `最多只能上传 ${maxFiles} 个文件`);
      return;
    }
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const error = validateFile(file);
      
      const fileInfo: FileInfo = {
        id: `${Date.now()}-${i}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: error ? UploadStatus.ERROR : UploadStatus.IDLE,
        progress: 0,
        error: error || undefined
      };
      
      newFiles.push(fileInfo);
    }
    
    const updatedFiles = [...files, ...newFiles];
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
    
    // 自动上传文件
    if (onUpload) {
      for (const fileInfo of newFiles) {
        if (fileInfo.status === UploadStatus.IDLE) {
          await uploadFile(fileInfo);
        }
      }
    }
  }, [files, maxFiles, maxSize, fileType, onChange, onUpload]);
  
  // 上传文件
  const uploadFile = async (fileInfo: FileInfo) => {
    if (!onUpload) return;
    
    // 更新状态为上传中
    const updatedFiles = files.map(f => 
      f.id === fileInfo.id 
        ? { ...f, status: UploadStatus.UPLOADING, progress: 0 }
        : f
    );
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
    
    try {
      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => 
          f.id === fileInfo.id && f.progress < 90
            ? { ...f, progress: f.progress + 10 }
            : f
        ));
      }, 200);
      
      const url = await onUpload(fileInfo.file);
      
      clearInterval(progressInterval);
      
      // 更新状态为成功
      const finalFiles = files.map(f => 
        f.id === fileInfo.id 
          ? { ...f, status: UploadStatus.SUCCESS, progress: 100, url }
          : f
      );
      setFiles(finalFiles);
      onChange?.(finalFiles);
    } catch (error) {
      // 更新状态为失败
      const errorFiles = files.map(f => 
        f.id === fileInfo.id 
          ? { 
              ...f, 
              status: UploadStatus.ERROR, 
              progress: 0, 
              error: errorMessages.uploadError || '上传失败，请重试' 
            }
          : f
      );
      setFiles(errorFiles);
      onChange?.(errorFiles);
    }
  };
  
  // 移除文件
  const handleRemove = (fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    setFiles(updatedFiles);
    onChange?.(updatedFiles);
    onRemove?.(fileId);
  };
  
  // 处理文件输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles);
    }
    // 清空输入值以允许重复选择同一文件
    e.target.value = '';
  };
  
  // 处理拖拽事件
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragOver(true);
    }
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled || !dragAndDrop) return;
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles);
    }
  };
  
  // 打开文件选择器
  const openFileSelector = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };
  
  return (
    <div className={cn('space-y-4', className)}>
      {/* 上传区域 */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          {
            'border-primary bg-primary/5': isDragOver,
            'border-muted-foreground/25 hover:border-muted-foreground/50': !isDragOver && !disabled,
            'border-muted-foreground/10 opacity-50 cursor-not-allowed': disabled
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileSelector}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={getAcceptTypes()}
          multiple={multiple}
          onChange={handleInputChange}
          disabled={disabled}
          className="hidden"
        />
        
        <Upload className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
        
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">{placeholder}</p>
          
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={disabled}
              onClick={(e) => {
                e.stopPropagation();
                openFileSelector();
              }}
            >
              {browseText}
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground">
            支持 {fileTypeConfig[fileType].extensions.join(', ') || '所有格式'}，
            单个文件最大 {formatFileSize(maxSize)}，
            最多 {maxFiles} 个文件
          </p>
        </div>
      </div>
      
      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              showPreview={showPreview}
              showProgress={showProgress}
              onRemove={handleRemove}
              removeText={removeText}
            />
          ))}
        </div>
      )}
    </div>
  );
};