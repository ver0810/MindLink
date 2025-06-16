# 测试API脚本

$baseUrl = "http://localhost:3000/api/auth"

Write-Host "🔍 开始API调试测试..." -ForegroundColor Green
Write-Host ""

# 测试1: 健康检查
Write-Host "📊 测试1: 服务器健康检查..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method Get
    Write-Host "✅ 服务器正常运行" -ForegroundColor Green
    Write-Host "响应: $($healthResponse | ConvertTo-Json)"
} catch {
    Write-Host "❌ 服务器健康检查失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 测试2: 注册用户（确保用户存在）
Write-Host "📊 测试2: 注册测试用户..." -ForegroundColor Blue
$registerData = @{
    username = "testuser"
    email = "test@example.com"
    password = "test123"
}

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/register" -Method Post -Body ($registerData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ 用户注册成功或用户已存在" -ForegroundColor Green
} catch {
    $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
    if ($errorDetails.message -like "*已被使用*") {
        Write-Host "ℹ️ 用户已存在，继续测试登录" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 注册失败: $($errorDetails.message)" -ForegroundColor Red
        Write-Host "详细错误: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 测试3: 登录测试
Write-Host "📊 测试3: 登录测试..." -ForegroundColor Blue
$loginData = @{
    username = "testuser"
    password = "test123"
}

Write-Host "发送的登录数据: $($loginData | ConvertTo-Json)" -ForegroundColor Cyan

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/login" -Method Post -Body ($loginData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "✅ 登录成功!" -ForegroundColor Green
    Write-Host "响应: $($loginResponse | ConvertTo-Json -Depth 3)"
} catch {
    Write-Host "❌ 登录失败" -ForegroundColor Red
    Write-Host "HTTP状态码: $($_.Exception.Response.StatusCode.value__)" -ForegroundColor Red
    Write-Host "状态描述: $($_.Exception.Response.StatusDescription)" -ForegroundColor Red
    
    try {
        $errorDetails = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "错误消息: $($errorDetails.message)" -ForegroundColor Red
        Write-Host "完整错误: $($errorDetails | ConvertTo-Json)" -ForegroundColor Red
    } catch {
        Write-Host "无法解析错误详情: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🔚 API测试完成" -ForegroundColor Green 