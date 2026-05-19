# setup_and_run_nginx.ps1
# Automates downloading, configuring, and starting Nginx on Windows

$nginxVersion = "1.26.1"
$zipUrl = "https://nginx.org/download/nginx-$nginxVersion.zip"
$destFolder = Join-Path $pwd "nginx_runtime"
$zipFile = Join-Path $pwd "nginx.zip"
$nginxExePath = Join-Path $destFolder "nginx-$nginxVersion\nginx.exe"
$nginxWorkDir = Join-Path $destFolder "nginx-$nginxVersion"

# 1. Kill any existing nginx instances to prevent port collisions
Write-Host "Checking for active Nginx instances..." -ForegroundColor Cyan
Get-Process -Name "nginx" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1

# 2. Download Nginx if not already downloaded
if (-not (Test-Path $nginxExePath)) {
    Write-Host "Nginx executable not found. Downloading Nginx v$nginxVersion..." -ForegroundColor Cyan
    
    # Set Security Protocol to avoid SSL download issues
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    
    Invoke-WebRequest -Uri $zipUrl -OutFile $zipFile
    
    Write-Host "Extracting Nginx archive..." -ForegroundColor Cyan
    if (-not (Test-Path $destFolder)) {
        New-Item -ItemType Directory -Path $destFolder | Out-Null
    }
    Expand-Archive -Path $zipFile -DestinationPath $destFolder -Force
    Remove-Item -Path $zipFile -Force
} else {
    Write-Host "Nginx already downloaded in $destFolder." -ForegroundColor Green
}

# 3. Copy our custom Nginx config into the runtime folder
$nginxConfDest = Join-Path $destFolder "nginx-$nginxVersion\conf\nginx.conf"
Write-Host "Applying custom configuration to $nginxConfDest..." -ForegroundColor Cyan
Copy-Item -Path "nginx.conf" -Destination $nginxConfDest -Force

# 4. Start Nginx reverse proxy
Write-Host "Launching Nginx Server on Port 80..." -ForegroundColor Green
Start-Process -FilePath $nginxExePath -WorkingDirectory $nginxWorkDir -WindowStyle Hidden

Write-Host "--------------------------------------------------------" -ForegroundColor Green
Write-Host "Nginx is successfully configured and running!" -ForegroundColor Green
Write-Host "Access locally at: http://localhost" -ForegroundColor Green
Write-Host "--------------------------------------------------------" -ForegroundColor Green
