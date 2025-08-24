import { BaseService } from '../base/BaseService';
import { IService } from '../interfaces/IService';
import { ServiceError, ServiceErrorType, ValidationError } from '../types/ServiceError';
import { FileServiceConfig } from '../types/ServiceConfig';
import { SERVICE_EVENTS } from '../types/ServiceConstants';
import { EventEmitter } from 'eventemitter3';
import { createReadStream, promises as fs } from 'fs';
import { join, extname, dirname } from 'path';
import { createHash } from 'crypto';
// import { pipeline } from 'stream/promises';

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  path: string;
  url?: string;
  size: number;
  mimeType: string;
  extension: string;
  hash: string;
  uploadedBy?: string;
  uploadedAt: Date;
  lastModified: Date;
  isPublic: boolean;
  metadata?: Record<string, unknown>;
  tags?: string[];
  category?: string;
  description?: string;
}

/**
 * 文件上传选项
 */
export interface FileUploadOptions {
  category?: string;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
  metadata?: Record<string, unknown>;
  overwrite?: boolean;
  generateThumbnail?: boolean;
  maxSize?: number;
  allowedTypes?: string[];
}

/**
 * 文件查询参数
 */
export interface FileQueryParams {
  category?: string;
  mimeType?: string;
  extension?: string;
  uploadedBy?: string;
  isPublic?: boolean;
  tags?: string[];
  minSize?: number;
  maxSize?: number;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  search?: string;
  sortBy?: 'name' | 'size' | 'uploadedAt' | 'lastModified';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * 文件下载选项
 */
export interface FileDownloadOptions {
  inline?: boolean;
  filename?: string;
  range?: { start: number; end?: number };
  transform?: (stream: NodeJS.ReadableStream) => NodeJS.ReadableStream;
  metadata?: {
    userId?: string;
    [key: string]: unknown;
  };
}

/**
 * 文件处理选项
 */
export interface FileProcessOptions {
  resize?: { width?: number; height?: number; quality?: number };
  crop?: { x: number; y: number; width: number; height: number };
  format?: string;
  watermark?: { text?: string; image?: string; position?: string };
  compress?: { quality?: number; format?: string };
}

/**
 * 文件存储配置
 */
export interface FileStorageConfig {
  type: 'local' | 's3' | 'azure' | 'gcs';
  basePath: string;
  maxFileSize: number;
  allowedTypes: string[];
  generateThumbnails: boolean;
  thumbnailSizes: { width: number; height: number }[];
  enableCompression: boolean;
  compressionQuality: number;
  enableVersioning: boolean;
  retentionDays?: number;
  cdnUrl?: string;
  s3Config?: {
    bucket: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  azureConfig?: {
    connectionString: string;
    containerName: string;
  };
  gcsConfig?: {
    projectId: string;
    keyFilename: string;
    bucketName: string;
  };
}

/**
 * 文件统计信息
 */
export interface FileStats {
  totalFiles: number;
  totalSize: number;
  filesByType: Record<string, number>;
  filesByCategory: Record<string, number>;
  uploadsByDay: Record<string, number>;
  averageFileSize: number;
  largestFile: FileInfo | null;
  mostRecentUpload: FileInfo | null;
  storageUsage: {
    used: number;
    available: number;
    percentage: number;
  };
}

/**
 * 文件事件接口
 */
export interface FileEvents {
  'file:uploaded': (file: FileInfo) => void;
  'file:downloaded': (fileId: string, userId?: string) => void;
  'file:deleted': (fileId: string, userId?: string) => void;
  'file:updated': (file: FileInfo) => void;
  'file:processed': (fileId: string, result: unknown) => void;
  'file:thumbnail:generated': (fileId: string, thumbnailPath: string) => void;
  'file:virus:detected': (fileId: string, virusName: string) => void;
  'file:quota:exceeded': (userId: string, currentUsage: number, limit: number) => void;
  'file:cleanup': (deletedCount: number, freedSpace: number) => void;
  'file:error': (error: ServiceError) => void;
}

/**
 * 文件服务类
 */
export class FileService extends BaseService implements IService {
  private eventEmitter: EventEmitter<FileEvents>;
  private files: Map<string, FileInfo>;
  private storage: FileServiceConfig['storage'];
  private stats: FileStats;

  constructor(config: FileServiceConfig) {
    super(config, 'FileService', '1.0.0');
    
    this.eventEmitter = new EventEmitter();
    this.files = new Map();
    
    // 存储配置
    this.storage = config.storage;
    
    // 初始化统计信息
    this.stats = {
      totalFiles: 0,
      totalSize: 0,
      filesByType: {},
      filesByCategory: {},
      uploadsByDay: {},
      averageFileSize: 0,
      largestFile: null,
      mostRecentUpload: null,
      storageUsage: {
        used: 0,
        available: 0,
        percentage: 0
      }
    };
  }

  /**
   * 初始化服务
   */
  protected override async onInitialize(): Promise<void> {
    // 确保上传目录存在
    await this.ensureDirectoryExists(this.storage.localPath || './uploads');
    
    // 加载现有文件信息
    await this.loadFileIndex();
    
    // 启动清理任务
    this.startCleanupTasks();
    
    // 更新统计信息
    await this.updateStats();
  }

  /**
   * 销毁服务
   */
  protected override async onDestroy(): Promise<void> {
    this.eventEmitter.removeAllListeners();
    this.files.clear();
  }

  /**
   * 健康检查
   */
  protected override async onHealthCheck(): Promise<Record<string, unknown>> {
    try {
      // 检查存储目录是否可访问
      await fs.access(this.storage.localPath || './uploads');
      
      // 检查存储空间
      const stats = await fs.stat(this.storage.localPath || './uploads');
      const isHealthy = stats.isDirectory();
      return { success: isHealthy, status: isHealthy ? 'healthy' : 'unhealthy', filesCount: this.files.size, storagePath: this.storage.localPath || './uploads' };
    } catch (error) {
      return { success: false, status: 'unhealthy', error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    fileBuffer: Buffer,
    originalName: string,
    options: FileUploadOptions = {}
  ): Promise<FileInfo> {
    try {
      // 验证文件
      this.validateFile(fileBuffer, originalName, options);
      
      // 生成文件信息
      const fileId = this.generateFileId();
      const extension = extname(originalName).toLowerCase();
      const mimeType = this.getMimeType(extension);
      const hash = this.calculateHash(fileBuffer);
      
      // 检查是否已存在相同文件
      const existingFile = this.findFileByHash(hash);
      if (existingFile && !options.overwrite) {
        return existingFile;
      }
      
      // 生成文件路径
      const category = options.category || 'general';
      const fileName = `${fileId}${extension}`;
      const relativePath = join(category, fileName);
      const fullPath = join(this.storage.localPath || './uploads', relativePath);
      
      // 确保目录存在
      await this.ensureDirectoryExists(dirname(fullPath));
      
      // 保存文件
      await fs.writeFile(fullPath, fileBuffer);
      
      // 创建文件信息
      const fileInfo: FileInfo = {
        id: fileId,
        name: fileName,
        originalName,
        path: relativePath,
        url: this.generateFileUrl(relativePath),
        size: fileBuffer.length,
        mimeType,
        extension,
        hash,
        uploadedBy: options.metadata?.uploadedBy as string | undefined,
        uploadedAt: new Date(),
        lastModified: new Date(),
        isPublic: options.isPublic || false,
        metadata: options.metadata,
        tags: options.tags,
        category,
        description: options.description
      };
      
      // 存储文件信息
      this.files.set(fileId, fileInfo);
      
      // 生成缩略图（如果需要）
      if (options.generateThumbnail && this.isImageFile(mimeType)) {
        await this.generateThumbnails(fileInfo);
      }
      
      // 保存文件索引
      await this.saveFileIndex();
      
      // 发射事件
      this.eventEmitter.emit('file:uploaded', fileInfo);
      this.emit(SERVICE_EVENTS.FILE_UPLOADED, fileInfo);
      
      // 更新统计
      await this.updateStats();
      
      return fileInfo;
    } catch (error: unknown) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '文件上传失败', code: 'FILE_UPLOAD_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'uploadFile', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 下载文件
   */
  async downloadFile(
    fileId: string,
    options: FileDownloadOptions = {}
  ): Promise<{ stream: NodeJS.ReadableStream; fileInfo: FileInfo }> {
    try {
      const fileInfo = this.files.get(fileId);
      if (!fileInfo) {
        throw new ValidationError('文件不存在', [{ field: 'filePath', message: '文件不存在', code: 'FILE_NOT_FOUND' }]);
      }
      
      const fullPath = join(this.storage.localPath || './uploads', fileInfo.path);
      
      // 检查文件是否存在
      try {
        await fs.access(fullPath);
      } catch {
        throw new ValidationError('文件不存在于存储中', [{ field: 'filePath', message: '文件不存在于存储中', code: 'FILE_NOT_FOUND_IN_STORAGE' }], 'FileService');
      }
      
      // 创建读取流
      let stream: NodeJS.ReadableStream;
      
      if (options.range) {
        // 范围下载
        const { start, end } = options.range;
        stream = createReadStream(fullPath, { start, end });
      } else {
        // 完整下载
        stream = createReadStream(fullPath);
      }
      
      // 应用转换（如果有）
      if (options.transform) {
        stream = options.transform(stream);
      }
      
      // 发射事件
      this.eventEmitter.emit('file:downloaded', fileId, options.metadata?.userId);
      this.emit(SERVICE_EVENTS.FILE_DOWNLOADED, { fileId, userId: options.metadata?.userId });
      
      return { stream, fileInfo };
    } catch (error: unknown) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '文件下载失败', code: 'FILE_DOWNLOAD_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'downloadFile', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取文件信息
   */
  async getFileInfo(fileId: string): Promise<FileInfo | null> {
    return this.files.get(fileId) || null;
  }

  /**
   * 查询文件
   */
  async queryFiles(params: FileQueryParams = {}): Promise<FileInfo[]> {
    try {
      let files = Array.from(this.files.values());
      
      // 应用过滤条件
      if (params.category) {
        files = files.filter(f => f.category === params.category);
      }
      
      if (params.mimeType) {
        files = files.filter(f => f.mimeType === params.mimeType);
      }
      
      if (params.extension) {
        files = files.filter(f => f.extension === params.extension);
      }
      
      if (params.uploadedBy) {
        files = files.filter(f => f.uploadedBy === params.uploadedBy);
      }
      
      if (params.isPublic !== undefined) {
        files = files.filter(f => f.isPublic === params.isPublic);
      }
      
      if (params.tags && params.tags.length > 0) {
        files = files.filter(f => 
          f.tags && params.tags!.some(tag => f.tags!.includes(tag))
        );
      }
      
      if (params.minSize !== undefined) {
        files = files.filter(f => f.size >= params.minSize!);
      }
      
      if (params.maxSize !== undefined) {
        files = files.filter(f => f.size <= params.maxSize!);
      }
      
      if (params.uploadedAfter) {
        files = files.filter(f => f.uploadedAt >= params.uploadedAfter!);
      }
      
      if (params.uploadedBefore) {
        files = files.filter(f => f.uploadedAt <= params.uploadedBefore!);
      }
      
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        files = files.filter(f => 
          f.name.toLowerCase().includes(searchTerm) ||
          f.originalName.toLowerCase().includes(searchTerm) ||
          (f.description && f.description.toLowerCase().includes(searchTerm))
        );
      }
      
      // 排序
      if (params.sortBy) {
        files.sort((a, b) => {
          let aValue: string | number, bValue: string | number;
          
          switch (params.sortBy) {
            case 'name':
              aValue = a.name;
              bValue = b.name;
              break;
            case 'size':
              aValue = a.size;
              bValue = b.size;
              break;
            case 'uploadedAt':
              aValue = a.uploadedAt.getTime();
              bValue = b.uploadedAt.getTime();
              break;
            case 'lastModified':
              aValue = a.lastModified.getTime();
              bValue = b.lastModified.getTime();
              break;
            default:
              return 0;
          }
          
          if (params.sortOrder === 'desc') {
            return bValue > aValue ? 1 : bValue < aValue ? -1 : 0;
          } else {
            return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
          }
        });
      }
      
      // 分页
      const offset = params.offset || 0;
      const limit = params.limit || 50;
      
      return files.slice(offset, offset + limit);
    } catch (error: unknown) {
      const serviceError = new ServiceError({ message: '文件查询失败', code: 'FILE_QUERY_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'queryFiles', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 更新文件信息
   */
  async updateFileInfo(fileId: string, updates: Partial<FileInfo>): Promise<FileInfo> {
    try {
      const fileInfo = this.files.get(fileId);
      if (!fileInfo) {
        throw new ValidationError('文件不存在', [{ field: 'fileId', message: '文件不存在', code: 'FILE_NOT_FOUND' }], 'FileService');
      }
      
      // 更新允许的字段
      const allowedFields = ['tags', 'category', 'description', 'isPublic', 'metadata'];
      const updatedInfo = { ...fileInfo };
      
      for (const [key, value] of Object.entries(updates)) {
        if (allowedFields.includes(key)) {
          (updatedInfo as Record<string, unknown>)[key] = value;
        }
      }
      
      updatedInfo.lastModified = new Date();
      
      // 保存更新
      this.files.set(fileId, updatedInfo);
      await this.saveFileIndex();
      
      // 发射事件
      this.eventEmitter.emit('file:updated', updatedInfo);
      this.emit(SERVICE_EVENTS.FILE_UPDATED, updatedInfo);
      
      return updatedInfo;
    } catch (error: unknown) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '文件信息更新失败', code: 'FILE_UPDATE_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'updateFileInfo', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 删除文件
   */
  async deleteFile(fileId: string, userId?: string): Promise<void> {
    try {
      const fileInfo = this.files.get(fileId);
      if (!fileInfo) {
        throw new ValidationError('文件不存在', [{ field: 'fileId', message: '文件不存在', code: 'FILE_NOT_FOUND' }], 'FileService');
      }
      
      const fullPath = join(this.storage.localPath || './uploads', fileInfo.path);
      
      // 删除物理文件
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        // 文件可能已经不存在，继续删除记录
      }
      
      // 删除缩略图
      await this.deleteThumbnails(fileInfo);
      
      // 删除记录
      this.files.delete(fileId);
      await this.saveFileIndex();
      
      // 发射事件
      this.eventEmitter.emit('file:deleted', fileId, userId);
      this.emit(SERVICE_EVENTS.FILE_DELETED, { fileId, userId });
      
      // 更新统计
      await this.updateStats();
    } catch (error: unknown) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '文件删除失败', code: 'FILE_DELETE_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'deleteFile', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 批量删除文件
   */
  async deleteFiles(fileIds: string[], userId?: string): Promise<{ deleted: string[]; failed: string[] }> {
    const deleted: string[] = [];
    const failed: string[] = [];
    
    for (const fileId of fileIds) {
      try {
        await this.deleteFile(fileId, userId);
        deleted.push(fileId);
      } catch (error: unknown) {
        failed.push(fileId);
      }
    }
    
    return { deleted, failed };
  }

  /**
   * 处理文件（调整大小、裁剪等）
   */
  async processFile(fileId: string, options: FileProcessOptions): Promise<FileInfo> {
    try {
      const fileInfo = this.files.get(fileId);
      if (!fileInfo) {
        throw new ValidationError('文件不存在', [{ field: 'fileId', message: '文件不存在', code: 'FILE_NOT_FOUND' }], 'FileService');
      }
      
      if (!this.isImageFile(fileInfo.mimeType)) {
        throw new ValidationError('只能处理图片文件', [{ field: 'mimeType', message: '只能处理图片文件', code: 'INVALID_FILE_TYPE_FOR_PROCESSING' }], 'FileService');
      }
      
      // 这里应该实现图片处理逻辑
      // 简化实现：返回原文件信息
      
      // 发射事件
      this.eventEmitter.emit('file:processed', fileId, options);
      this.emit(SERVICE_EVENTS.FILE_PROCESSED, { fileId, options });
      
      return fileInfo;
    } catch (error: unknown) {
      const serviceError = error instanceof ServiceError ? error :
        new ServiceError({ message: '文件处理失败', code: 'FILE_PROCESS_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'processFile', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 获取文件统计信息
   */
  async getStats(): Promise<FileStats> {
    await this.updateStats();
    return { ...this.stats };
  }

  /**
   * 清理过期文件
   */
  async cleanup(): Promise<{ deletedCount: number; freedSpace: number }> {
    try {
      let deletedCount = 0;
      let freedSpace = 0;
      
      const retentionDays = 365; // 默认保留365天
    if (retentionDays) {
      const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
        
        for (const [fileId, fileInfo] of this.files.entries()) {
          if (fileInfo.uploadedAt < cutoffDate) {
            try {
              await this.deleteFile(fileId);
              deletedCount++;
              freedSpace += fileInfo.size;
            } catch (error: unknown) {
              // 忽略删除失败的文件
            }
          }
        }
      }
      
      // 发射事件
      this.eventEmitter.emit('file:cleanup', deletedCount, freedSpace);
      this.emit(SERVICE_EVENTS.FILE_CLEANUP, { deletedCount, freedSpace });
      
      return { deletedCount, freedSpace };
    } catch (error: unknown) {
      const serviceError = new ServiceError({ message: '文件清理失败', code: 'FILE_CLEANUP_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'cleanup', innerError: this.handleUnknownError(error) });
      this.eventEmitter.emit('file:error', serviceError);
      throw serviceError;
    }
  }

  /**
   * 监听文件事件
   */
  override on<T extends string | symbol>(event: T, fn: (...args: unknown[]) => void, context?: unknown): this {
    return super.on(event, fn, context);
  }

  /**
   * 监听文件事件（类型安全版本）
   */
  onFileEvent<K extends keyof FileEvents>(event: K, listener: FileEvents[K]): void {
    this.eventEmitter.on(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 移除文件事件监听
   */
  override off<T extends string | symbol>(event: T, fn?: ((...args: unknown[]) => void) | undefined, context?: unknown, once?: boolean | undefined): this {
    return super.off(event, fn, context, once);
  }

  /**
   * 移除文件事件监听（类型安全版本）
   */
  offFileEvent<K extends keyof FileEvents>(event: K, listener: FileEvents[K]): void {
    this.eventEmitter.off(event, listener as (...args: unknown[]) => void);
  }

  /**
   * 验证文件
   */
  private validateFile(fileBuffer: Buffer, originalName: string, options: FileUploadOptions): void {
    // 检查文件大小
    const maxSize = options.maxSize || (this.config as FileServiceConfig).upload.maxFileSize;
    if (fileBuffer.length > maxSize) {
      throw new ValidationError(`文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`, [{ field: 'fileSize', message: `文件大小超过限制 (${Math.round(maxSize / 1024 / 1024)}MB)`, code: 'FILE_SIZE_EXCEEDED' }], 'FileService');
    }
    
    // 检查文件类型
    const extension = extname(originalName).toLowerCase();
    const mimeType = this.getMimeType(extension);
    
    const allowedTypes = options.allowedTypes || (this.config as FileServiceConfig).upload.allowedTypes;
    if (!allowedTypes.includes(mimeType)) {
      throw new ValidationError('不支持的文件类型', [{ field: 'mimeType', message: '不支持的文件类型', code: 'UNSUPPORTED_FILE_TYPE' }], 'FileService');
    }
    
    // 检查文件名
    if (!originalName || originalName.length > 255) {
      throw new ValidationError('文件名无效', [{ field: 'fileName', message: '文件名无效', code: 'INVALID_FILE_NAME' }], 'FileService');
    }
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.pdf': 'application/pdf',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  /**
   * 计算文件哈希
   */
  private calculateHash(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * 根据哈希查找文件
   */
  private findFileByHash(hash: string): FileInfo | undefined {
    return Array.from(this.files.values()).find(f => f.hash === hash);
  }

  /**
   * 生成文件ID
   */
  private generateFileId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * 生成文件URL
   */
  private generateFileUrl(relativePath: string): string {
    // CDN URL 暂时不支持，直接返回本地路径
    // if (this.storage.cdnUrl) {
    //   return `${this.storage.cdnUrl}/${relativePath}`;
    // }
    return `/files/${relativePath}`;
  }

  /**
   * 判断是否为图片文件
   */
  private isImageFile(mimeType: string): boolean {
    return mimeType.startsWith('image/');
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      // 目录可能已存在
    }
  }

  /**
   * 处理未知错误
   */
  private handleUnknownError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    if (typeof error === 'string') {
      return new Error(error);
    }
    return new Error('Unknown error occurred');
  }

  /**
   * 生成缩略图
   */
  private async generateThumbnails(fileInfo: FileInfo): Promise<void> {
    try {
      // 这里应该实现缩略图生成逻辑
      // 简化实现：只发射事件
      const thumbnailSizes = [{ width: 150, height: 150 }, { width: 300, height: 300 }];
    for (const size of thumbnailSizes) {
        const thumbnailPath = `thumbnails/${fileInfo.id}_${size.width}x${size.height}${fileInfo.extension}`;
        this.eventEmitter.emit('file:thumbnail:generated', fileInfo.id, thumbnailPath);
      }
    } catch (error: unknown) {
      // 缩略图生成失败不影响主流程
    }
  }

  /**
   * 删除缩略图
   */
  private async deleteThumbnails(fileInfo: FileInfo): Promise<void> {
    try {
      const thumbnailSizes = [{ width: 150, height: 150 }, { width: 300, height: 300 }];
    for (const size of thumbnailSizes) {
      const thumbnailPath = join(
        this.storage.localPath || './uploads',
          'thumbnails',
          `${fileInfo.id}_${size.width}x${size.height}${fileInfo.extension}`
        );
        
        try {
          await fs.unlink(thumbnailPath);
        } catch (error: unknown) {
          // 缩略图可能不存在
        }
      }
    } catch (error: unknown) {
      // 删除缩略图失败不影响主流程
    }
  }

  /**
   * 加载文件索引
   */
  private async loadFileIndex(): Promise<void> {
    try {
      const indexPath = join(this.storage.localPath || './uploads', 'index.json');
      
      try {
        const indexData = await fs.readFile(indexPath, 'utf8');
        const files = JSON.parse(indexData);
        
        for (const fileData of files) {
          // 转换日期字符串为Date对象
          fileData.uploadedAt = new Date(fileData.uploadedAt);
          fileData.lastModified = new Date(fileData.lastModified);
          
          this.files.set(fileData.id, fileData);
        }
      } catch (error: unknown) {
        // 索引文件不存在或损坏，从文件系统重建
        await this.rebuildFileIndex();
      }
    } catch (error: unknown) {
      // 加载失败，继续使用空索引
    }
  }

  /**
   * 保存文件索引
   */
  private async saveFileIndex(): Promise<void> {
    try {
      const indexPath = join(this.storage.localPath || './uploads', 'index.json');
      const files = Array.from(this.files.values());
      
      await fs.writeFile(indexPath, JSON.stringify(files, null, 2));
    } catch (error: unknown) {
      // 保存失败不影响主流程
    }
  }

  /**
   * 重建文件索引
   */
  private async rebuildFileIndex(): Promise<void> {
    try {
      // 这里应该实现从文件系统重建索引的逻辑
      // 简化实现：清空索引
      this.files.clear();
    } catch (error: unknown) {
      // 重建失败
    }
  }

  /**
   * 启动清理任务
   */
  private startCleanupTasks(): void {
    // 每天清理一次过期文件
    setInterval(() => {
      this.cleanup().catch((error: unknown) => {
        const serviceError = new ServiceError({ message: '清理任务失败', code: 'CLEANUP_TASK_ERROR', type: ServiceErrorType.STORAGE, serviceName: 'FileService', operation: 'cleanupTask', innerError: error instanceof Error ? error : undefined });
        this.eventEmitter.emit('file:error', serviceError);
      });
    }, 24 * 60 * 60 * 1000);
  }

  /**
   * 更新统计信息
   */
  private async updateStats(): Promise<void> {
    const files = Array.from(this.files.values());
    
    this.stats.totalFiles = files.length;
    this.stats.totalSize = files.reduce((sum, f) => sum + f.size, 0);
    this.stats.averageFileSize = this.stats.totalFiles > 0 ? this.stats.totalSize / this.stats.totalFiles : 0;
    
    // 按类型统计
    this.stats.filesByType = {};
    for (const file of files) {
      this.stats.filesByType[file.mimeType] = (this.stats.filesByType[file.mimeType] || 0) + 1;
    }
    
    // 按分类统计
    this.stats.filesByCategory = {};
    for (const file of files) {
      const category = file.category || 'general';
      this.stats.filesByCategory[category] = (this.stats.filesByCategory[category] || 0) + 1;
    }
    
    // 按日期统计
    this.stats.uploadsByDay = {};
    for (const file of files) {
      const day = file.uploadedAt.toISOString().split('T')[0];
      this.stats.uploadsByDay[day] = (this.stats.uploadsByDay[day] || 0) + 1;
    }
    
    // 最大文件
    this.stats.largestFile = files.reduce((largest, file) => 
      !largest || file.size > largest.size ? file : largest, null as FileInfo | null
    );
    
    // 最新上传
    this.stats.mostRecentUpload = files.reduce((latest, file) => 
      !latest || file.uploadedAt > latest.uploadedAt ? file : latest, null as FileInfo | null
    );
    
    // 存储使用情况（简化实现）
    this.stats.storageUsage = {
      used: this.stats.totalSize,
      available: 1024 * 1024 * 1024 * 1024, // 1TB
      percentage: (this.stats.totalSize / (1024 * 1024 * 1024 * 1024)) * 100
    };
  }
}

// 全局文件服务实例
let fileServiceInstance: FileService | null = null;

/**
 * 创建文件服务实例
 */
export function createFileService(config: FileServiceConfig): FileService {
  return new FileService(config);
}

/**
 * 获取文件服务实例
 */
export function getFileService(): FileService | null {
  return fileServiceInstance;
}

/**
 * 初始化文件服务
 */
export async function initFileService(config: FileServiceConfig): Promise<FileService> {
  if (fileServiceInstance) {
    await fileServiceInstance.destroy();
  }
  
  fileServiceInstance = new FileService(config);
  await fileServiceInstance.initialize();
  
  return fileServiceInstance;
}

/**
 * 销毁文件服务
 */
export async function destroyFileService(): Promise<void> {
  if (fileServiceInstance) {
    await fileServiceInstance.destroy();
    fileServiceInstance = null;
  }
}



// 导出默认实例
export default FileService;