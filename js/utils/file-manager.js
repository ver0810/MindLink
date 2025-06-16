// FounderMind 文件管理器
// 支持的文件类型
const SUPPORTED_FILE_TYPES = {
    documents: ['.pdf', '.doc', '.docx', '.txt', '.md'],
    images: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    spreadsheets: ['.xls', '.xlsx', '.csv'],
    presentations: ['.ppt', '.pptx']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES_PER_MESSAGE = 5;

const FileManager = {
    // 上传文件到服务器
    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('timestamp', Date.now());
        
        try {
            // 显示上传进度
            const progressId = this.showUploadProgress(file.name);
            
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${ApiManager.getApiKey()}`
                }
            });
            
            this.hideUploadProgress(progressId);
            
            if (!response.ok) {
                throw new Error(`上传失败: ${response.statusText}`);
            }
            
            const result = await response.json();
            return {
                id: result.fileId,
                name: file.name,
                size: file.size,
                type: file.type,
                url: result.url,
                uploadTime: Date.now()
            };
            
        } catch (error) {
            console.error('文件上传失败:', error);
            UIComponents.showNotification(`文件 "${file.name}" 上传失败`, 'error');
            throw error;
        }
    },
    
    // 批量上传文件
    async uploadFiles(files) {
        const uploadPromises = Array.from(files).map(file => this.uploadFile(file));
        
        try {
            const results = await Promise.allSettled(uploadPromises);
            const successful = results
                .filter(result => result.status === 'fulfilled')
                .map(result => result.value);
            
            const failed = results
                .filter(result => result.status === 'rejected')
                .length;
            
            if (failed > 0) {
                UIComponents.showNotification(`${failed} 个文件上传失败`, 'warning');
            }
            
            return successful;
            
        } catch (error) {
            console.error('批量上传失败:', error);
            UIComponents.showNotification('文件上传失败', 'error');
            return [];
        }
    },
    
    // 处理文件内容 - 提取文本用于AI分析
    async processFileContent(file) {
        try {
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            
            if (SUPPORTED_FILE_TYPES.documents.includes(fileExtension)) {
                return await this.extractTextFromDocument(file);
            } else if (SUPPORTED_FILE_TYPES.images.includes(fileExtension)) {
                return await this.analyzeImage(file);
            } else if (SUPPORTED_FILE_TYPES.spreadsheets.includes(fileExtension)) {
                return await this.extractDataFromSpreadsheet(file);
            }
            
            return null;
            
        } catch (error) {
            console.error('文件处理失败:', error);
            return null;
        }
    },
    
    // 从文档中提取文本
    async extractTextFromDocument(file) {
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (fileExtension === '.txt' || fileExtension === '.md') {
            return await this.readTextFile(file);
        }
        
        // 对于PDF、Word等复杂格式，需要后端处理
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/extract-text', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${ApiManager.getApiKey()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('文本提取失败');
            }
            
            const result = await response.json();
            return result.text;
            
        } catch (error) {
            console.error('文档处理失败:', error);
            return `[无法处理文档内容: ${file.name}]`;
        }
    },
    
    // 读取纯文本文件
    async readTextFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file, 'UTF-8');
        });
    },
    
    // 分析图片内容
    async analyzeImage(file) {
        try {
            // 使用Vision API分析图片
            const base64 = await this.fileToBase64(file);
            
            const response = await fetch('/api/analyze-image', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ApiManager.getApiKey()}`
                },
                body: JSON.stringify({
                    image: base64,
                    filename: file.name
                })
            });
            
            if (!response.ok) {
                throw new Error('图像分析失败');
            }
            
            const result = await response.json();
            return result.description;
            
        } catch (error) {
            console.error('图像分析失败:', error);
            return `[图片文件: ${file.name}]`;
        }
    },
    
    // 从电子表格提取数据
    async extractDataFromSpreadsheet(file) {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('/api/extract-spreadsheet', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${ApiManager.getApiKey()}`
                }
            });
            
            if (!response.ok) {
                throw new Error('电子表格处理失败');
            }
            
            const result = await response.json();
            return result.data;
            
        } catch (error) {
            console.error('电子表格处理失败:', error);
            return `[电子表格文件: ${file.name}]`;
        }
    },
    
    // 文件转Base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    // 显示上传进度
    showUploadProgress(fileName) {
        const progressId = `upload-${Date.now()}`;
        const progressElement = document.createElement('div');
        progressElement.id = progressId;
        progressElement.className = 'fixed bottom-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-3 max-w-sm z-50';
        progressElement.innerHTML = `
            <div class="flex items-center space-x-2">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-sky-400"></div>
                <span class="text-sm text-slate-200">上传 ${fileName}</span>
            </div>
        `;
        
        document.body.appendChild(progressElement);
        return progressId;
    },
    
    // 隐藏上传进度
    hideUploadProgress(progressId) {
        const element = document.getElementById(progressId);
        if (element) {
            element.remove();
        }
    },
    
    // 为AI准备文件内容
    async prepareFilesForAI(files) {
        const processedFiles = [];
        
        for (const file of files) {
            try {
                const content = await this.processFileContent(file);
                processedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: content || `[文件: ${file.name}]`
                });
            } catch (error) {
                console.error(`处理文件 ${file.name} 失败:`, error);
                processedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: `[无法处理的文件: ${file.name}]`
                });
            }
        }
        
        return processedFiles;
    },
    
    // 构建包含文件内容的消息
    buildMessageWithFiles(userText, processedFiles) {
        if (processedFiles.length === 0) {
            return userText;
        }
        
        let message = '';
        
        // 添加文件内容
        if (processedFiles.length > 0) {
            message += '**附件内容:**\n\n';
            processedFiles.forEach((file, index) => {
                message += `**文件 ${index + 1}: ${file.name}**\n`;
                if (file.content && file.content.length > 0) {
                    // 限制单个文件内容长度
                    const maxLength = 2000;
                    const content = file.content.length > maxLength 
                        ? file.content.substring(0, maxLength) + '...[内容截断]'
                        : file.content;
                    message += `${content}\n\n`;
                } else {
                    message += `[文件类型: ${file.type}]\n\n`;
                }
            });
        }
        
        // 添加用户文本
        if (userText && userText.trim()) {
            message += `**用户问题:**\n${userText}`;
        }
        
        return message;
    },
    
    // 验证文件
    validateFile(file) {
        const errors = [];
        
        // 检查文件大小
        if (file.size > MAX_FILE_SIZE) {
            errors.push('文件大小超过10MB限制');
        }
        
        // 检查文件类型
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        const allSupportedTypes = Object.values(SUPPORTED_FILE_TYPES).flat();
        
        if (!allSupportedTypes.includes(fileExtension)) {
            errors.push('不支持的文件格式');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },
    
    // 获取文件类型描述
    getFileTypeDescription(fileName) {
        const extension = '.' + fileName.split('.').pop().toLowerCase();
        
        if (SUPPORTED_FILE_TYPES.documents.includes(extension)) {
            return '文档';
        } else if (SUPPORTED_FILE_TYPES.images.includes(extension)) {
            return '图片';
        } else if (SUPPORTED_FILE_TYPES.spreadsheets.includes(extension)) {
            return '电子表格';
        } else if (SUPPORTED_FILE_TYPES.presentations.includes(extension)) {
            return '演示文稿';
        }
        
        return '文件';
    }
}; 