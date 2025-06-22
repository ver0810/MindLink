# 🧪 AI导师对话系统 - 完整API测试套件
# PowerShell API测试脚本

param(
    [string]$BaseUrl = "http://localhost:3000",
    [string]$TestModule = "all",
    [switch]$Verbose
)

# 全局变量
$Global:TestResults = @()
$Global:AuthToken = ""
$Global:TestUserId = ""

# 颜色输出函数
function Write-TestResult($Message, $Status = "INFO") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    switch ($Status) {
        "PASS" { Write-Host "[$timestamp] ✅ $Message" -ForegroundColor Green }
        "FAIL" { Write-Host "[$timestamp] ❌ $Message" -ForegroundColor Red }
        "WARN" { Write-Host "[$timestamp] ⚠️  $Message" -ForegroundColor Yellow }
        "INFO" { Write-Host "[$timestamp] 🔍 $Message" -ForegroundColor Cyan }
        "TITLE" { Write-Host "`n$Message" -ForegroundColor Magenta -BackgroundColor Black }
    }
}

# 添加测试结果
function Add-TestResult($TestName, $Status, $Details = "", $ResponseTime = 0) {
    $Global:TestResults += [PSCustomObject]@{
        TestName = $TestName
        Status = $Status
        Details = $Details
        ResponseTime = $ResponseTime
        Timestamp = Get-Date
    }
}

# HTTP请求函数
function Invoke-ApiRequest($Method, $Uri, $Body = $null, $Headers = @{}) {
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        
        $requestParams = @{
            Method = $Method
            Uri = $Uri
            TimeoutSec = 30
            Headers = $Headers
        }
        
        if ($Body) {
            $requestParams.Body = ($Body | ConvertTo-Json -Depth 10)
            $requestParams.ContentType = "application/json"
        }
        
        $response = Invoke-RestMethod @requestParams
        $stopwatch.Stop()
        
        return @{
            Success = $true
            Data = $response
            StatusCode = 200
            ResponseTime = $stopwatch.ElapsedMilliseconds
        }
    }
    catch {
        $stopwatch.Stop()
        return @{
            Success = $false
            Error = $_.Exception.Message
            StatusCode = $_.Exception.Response.StatusCode.value__
            ResponseTime = $stopwatch.ElapsedMilliseconds
        }
    }
}

# 系统健康检查
function Test-SystemHealth {
    Write-TestResult "系统健康检查测试" "TITLE"
    
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/health"
    
    if ($result.Success) {
        Write-TestResult "系统健康检查通过 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "系统健康检查" "PASS" "服务器运行正常" $result.ResponseTime
        
        if ($Verbose) {
            Write-Host "响应数据: $($result.Data | ConvertTo-Json -Depth 2)" -ForegroundColor Gray
        }
    } else {
        Write-TestResult "系统健康检查失败: $($result.Error)" "FAIL"
        Add-TestResult "系统健康检查" "FAIL" $result.Error $result.ResponseTime
    }
}

# 认证API测试
function Test-AuthenticationAPI {
    Write-TestResult "认证API测试" "TITLE"
    
    # 1. 测试用户注册
    Write-TestResult "测试用户注册..." "INFO"
    $testUser = @{
        username = "testuser_$(Get-Random)"
        email = "test$(Get-Random)@example.com"
        password = "TestPassword123!"
    }
    
    $result = Invoke-ApiRequest -Method "POST" -Uri "$BaseUrl/api/auth/register" -Body $testUser
    
    if ($result.Success) {
        Write-TestResult "用户注册成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "用户注册" "PASS" "用户创建成功" $result.ResponseTime
        $Global:AuthToken = $result.Data.data.token
    } else {
        Write-TestResult "用户注册失败: $($result.Error)" "FAIL"
        Add-TestResult "用户注册" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 2. 测试用户登录
    Write-TestResult "测试用户登录..." "INFO"
    $loginData = @{
        username = $testUser.username
        password = $testUser.password
    }
    
    $result = Invoke-ApiRequest -Method "POST" -Uri "$BaseUrl/api/auth/login" -Body $loginData
    
    if ($result.Success) {
        Write-TestResult "用户登录成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "用户登录" "PASS" "登录验证通过" $result.ResponseTime
        $Global:AuthToken = $result.Data.data.token
        $Global:TestUserId = $result.Data.data.user.id
    } else {
        Write-TestResult "用户登录失败: $($result.Error)" "FAIL"
        Add-TestResult "用户登录" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 3. 测试Token验证
    if ($Global:AuthToken) {
        Write-TestResult "测试Token验证..." "INFO"
        $headers = @{ "Authorization" = "Bearer $Global:AuthToken" }
        
        $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/auth/verify" -Headers $headers
        
        if ($result.Success) {
            Write-TestResult "Token验证成功 (${result.ResponseTime}ms)" "PASS"
            Add-TestResult "Token验证" "PASS" "Token有效性验证通过" $result.ResponseTime
        } else {
            Write-TestResult "Token验证失败: $($result.Error)" "FAIL"
            Add-TestResult "Token验证" "FAIL" $result.Error $result.ResponseTime
        }
        
        # 4. 测试获取用户信息
        Write-TestResult "测试获取用户信息..." "INFO"
        $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/auth/profile" -Headers $headers
        
        if ($result.Success) {
            Write-TestResult "获取用户信息成功 (${result.ResponseTime}ms)" "PASS"
            Add-TestResult "获取用户信息" "PASS" "用户信息获取正常" $result.ResponseTime
        } else {
            Write-TestResult "获取用户信息失败: $($result.Error)" "FAIL"
            Add-TestResult "获取用户信息" "FAIL" $result.Error $result.ResponseTime
        }
    }
}

# 对话API测试
function Test-ConversationAPI {
    Write-TestResult "对话管理API测试" "TITLE"
    
    if (-not $Global:AuthToken) {
        Write-TestResult "跳过对话API测试：需要认证Token" "WARN"
        return
    }
    
    $headers = @{ "Authorization" = "Bearer $Global:AuthToken" }
    
    # 1. 获取导师列表
    Write-TestResult "测试获取导师列表..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations/mentors" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取导师列表成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取导师列表" "PASS" "导师数据加载正常" $result.ResponseTime
        $mentors = $result.Data.data.mentors
    } else {
        Write-TestResult "获取导师列表失败: $($result.Error)" "FAIL"
        Add-TestResult "获取导师列表" "FAIL" $result.Error $result.ResponseTime
        return
    }
    
    # 2. 创建对话
    Write-TestResult "测试创建对话..." "INFO"
    $conversationData = @{
        title = "API测试对话 - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
        mentorId = $mentors[0].id
        mentorName = $mentors[0].name
        mode = "single"
        description = "自动化API测试创建的对话"
        tags = @("测试", "API")
    }
    
    $result = Invoke-ApiRequest -Method "POST" -Uri "$BaseUrl/api/conversations" -Body $conversationData -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "创建对话成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "创建对话" "PASS" "对话创建正常" $result.ResponseTime
        $conversationId = $result.Data.data.conversation.id
    } else {
        Write-TestResult "创建对话失败: $($result.Error)" "FAIL"
        Add-TestResult "创建对话" "FAIL" $result.Error $result.ResponseTime
        return
    }
    
    # 3. 保存消息
    Write-TestResult "测试保存消息..." "INFO"
    $messageData = @{
        role = "user"
        content = "这是一条API测试消息，请回复确认。"
        mentorId = $mentors[0].id
        mentorName = $mentors[0].name
    }
    
    $result = Invoke-ApiRequest -Method "POST" -Uri "$BaseUrl/api/conversations/$conversationId/messages" -Body $messageData -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "保存消息成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "保存消息" "PASS" "消息保存正常" $result.ResponseTime
    } else {
        Write-TestResult "保存消息失败: $($result.Error)" "FAIL"
        Add-TestResult "保存消息" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 4. 获取对话消息
    Write-TestResult "测试获取对话消息..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations/$conversationId/messages" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取对话消息成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取对话消息" "PASS" "消息获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取对话消息失败: $($result.Error)" "FAIL"
        Add-TestResult "获取对话消息" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 5. 获取对话列表
    Write-TestResult "测试获取对话列表..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations?page=1&limit=10" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取对话列表成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取对话列表" "PASS" "对话列表获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取对话列表失败: $($result.Error)" "FAIL"
        Add-TestResult "获取对话列表" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 6. 获取统计信息
    Write-TestResult "测试获取统计信息..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations/stats/overview" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取统计信息成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取统计信息" "PASS" "统计数据获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取统计信息失败: $($result.Error)" "FAIL"
        Add-TestResult "获取统计信息" "FAIL" $result.Error $result.ResponseTime
    }
}

# 对话历史API测试
function Test-ConversationHistoryAPI {
    Write-TestResult "对话历史API测试" "TITLE"
    
    if (-not $Global:AuthToken) {
        Write-TestResult "跳过对话历史API测试：需要认证Token" "WARN"
        return
    }
    
    $headers = @{ "Authorization" = "Bearer $Global:AuthToken" }
    
    # 1. 获取对话历史
    Write-TestResult "测试获取对话历史..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations/history?page=1&limit=5" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取对话历史成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取对话历史" "PASS" "历史记录获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取对话历史失败: $($result.Error)" "FAIL"
        Add-TestResult "获取对话历史" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 2. 获取最近对话
    Write-TestResult "测试获取最近对话..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/conversations/recent?limit=3" -Headers $headers
    
    if ($result.Success) {
        Write-TestResult "获取最近对话成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "获取最近对话" "PASS" "最近对话获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取最近对话失败: $($result.Error)" "FAIL"
        Add-TestResult "获取最近对话" "FAIL" $result.Error $result.ResponseTime
    }
}

# 数据库API测试
function Test-DatabaseAPI {
    Write-TestResult "数据库管理API测试" "TITLE"
    
    # 1. 获取数据库统计
    Write-TestResult "测试获取数据库统计..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/database/stats"
    
    if ($result.Success) {
        Write-TestResult "获取数据库统计成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "数据库统计" "PASS" "统计信息获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取数据库统计失败: $($result.Error)" "FAIL"
        Add-TestResult "数据库统计" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 2. 获取数据库表信息
    Write-TestResult "测试获取数据库表信息..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/database/tables"
    
    if ($result.Success) {
        Write-TestResult "获取数据库表信息成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "数据库表信息" "PASS" "表结构信息获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取数据库表信息失败: $($result.Error)" "FAIL"
        Add-TestResult "数据库表信息" "FAIL" $result.Error $result.ResponseTime
    }
    
    # 3. 获取用户列表
    Write-TestResult "测试获取用户列表..." "INFO"
    $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/api/database/users?page=1&limit=5"
    
    if ($result.Success) {
        Write-TestResult "获取用户列表成功 (${result.ResponseTime}ms)" "PASS"
        Add-TestResult "用户列表" "PASS" "用户数据获取正常" $result.ResponseTime
    } else {
        Write-TestResult "获取用户列表失败: $($result.Error)" "FAIL"
        Add-TestResult "用户列表" "FAIL" $result.Error $result.ResponseTime
    }
}

# 性能测试
function Test-Performance {
    Write-TestResult "API性能测试" "TITLE"
    
    $testCount = 10
    $results = @()
    
    Write-TestResult "执行$testCount次健康检查请求..." "INFO"
    
    for ($i = 1; $i -le $testCount; $i++) {
        $result = Invoke-ApiRequest -Method "GET" -Uri "$BaseUrl/health"
        if ($result.Success) {
            $results += $result.ResponseTime
        }
    }
    
    if ($results.Count -gt 0) {
        $avgTime = ($results | Measure-Object -Average).Average
        $minTime = ($results | Measure-Object -Minimum).Minimum
        $maxTime = ($results | Measure-Object -Maximum).Maximum
        
        Write-TestResult "性能测试完成" "PASS"
        Write-TestResult "平均响应时间: ${avgTime}ms" "INFO"
        Write-TestResult "最快响应时间: ${minTime}ms" "INFO"
        Write-TestResult "最慢响应时间: ${maxTime}ms" "INFO"
        
        Add-TestResult "性能测试" "PASS" "平均:${avgTime}ms 最小:${minTime}ms 最大:${maxTime}ms" $avgTime
    } else {
        Write-TestResult "性能测试失败" "FAIL"
        Add-TestResult "性能测试" "FAIL" "无法完成性能测试" 0
    }
}

# 生成测试报告
function Generate-TestReport {
    Write-TestResult "测试报告生成" "TITLE"
    
    $totalTests = $Global:TestResults.Count
    $passedTests = ($Global:TestResults | Where-Object { $_.Status -eq "PASS" }).Count
    $failedTests = ($Global:TestResults | Where-Object { $_.Status -eq "FAIL" }).Count
    $passRate = if ($totalTests -gt 0) { [math]::Round(($passedTests / $totalTests) * 100, 2) } else { 0 }
    
    Write-Host "`n" -NoNewline
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "           🧪 API测试报告           " -ForegroundColor White -BackgroundColor Blue
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "📊 测试统计:" -ForegroundColor Yellow
    Write-Host "   总测试数: $totalTests" -ForegroundColor White
    Write-Host "   通过测试: $passedTests" -ForegroundColor Green
    Write-Host "   失败测试: $failedTests" -ForegroundColor Red
    Write-Host "   通过率: $passRate%" -ForegroundColor $(if ($passRate -ge 80) { "Green" } else { "Red" })
    
    Write-Host "`n📋 详细结果:" -ForegroundColor Yellow
    foreach ($result in $Global:TestResults) {
        $status = if ($result.Status -eq "PASS") { "✅" } else { "❌" }
        $time = "$($result.ResponseTime)ms".PadLeft(6)
        Write-Host "   $status $($result.TestName.PadRight(20)) $time" -ForegroundColor White
        if ($result.Details -and $Verbose) {
            Write-Host "      详情: $($result.Details)" -ForegroundColor Gray
        }
    }
    
    # 保存测试报告到文件
    $reportPath = "api-test-report-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
    $reportData = @{
        TestSummary = @{
            Timestamp = Get-Date
            TotalTests = $totalTests
            PassedTests = $passedTests
            FailedTests = $failedTests
            PassRate = $passRate
            BaseUrl = $BaseUrl
        }
        TestResults = $Global:TestResults
    }
    
    $reportData | ConvertTo-Json -Depth 10 | Out-File -FilePath $reportPath -Encoding UTF8
    Write-Host "`n💾 测试报告已保存到: $reportPath" -ForegroundColor Green
    
    Write-Host "═══════════════════════════════════════════" -ForegroundColor Cyan
}

# 主测试流程
function Start-ApiTest {
    Write-Host "🚀 AI导师对话系统 - API测试套件" -ForegroundColor Cyan -BackgroundColor Black
    Write-Host "测试服务器: $BaseUrl" -ForegroundColor Yellow
    Write-Host "开始时间: $(Get-Date)" -ForegroundColor Gray
    Write-Host ""
    
    # 检查服务器连接
    Write-TestResult "检查服务器连接..." "INFO"
    try {
        $response = Invoke-WebRequest -Uri $BaseUrl -TimeoutSec 5 -UseBasicParsing
        Write-TestResult "服务器连接正常" "PASS"
    }
    catch {
        Write-TestResult "无法连接到服务器: $($_.Exception.Message)" "FAIL"
        Write-TestResult "请确保后端服务正在运行" "WARN"
        return
    }
    
    # 执行测试模块
    switch ($TestModule.ToLower()) {
        "health" { Test-SystemHealth }
        "auth" { Test-AuthenticationAPI }
        "conversation" { Test-ConversationAPI }
        "history" { Test-ConversationHistoryAPI }
        "database" { Test-DatabaseAPI }
        "performance" { Test-Performance }
        "all" {
            Test-SystemHealth
            Test-AuthenticationAPI
            Test-ConversationAPI
            Test-ConversationHistoryAPI
            Test-DatabaseAPI
            Test-Performance
        }
        default {
            Write-TestResult "未知的测试模块: $TestModule" "FAIL"
            Write-TestResult "可用模块: all, health, auth, conversation, history, database, performance" "INFO"
            return
        }
    }
    
    # 生成测试报告
    Generate-TestReport
}

# 启动测试
Start-ApiTest 