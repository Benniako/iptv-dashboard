# Set ControlD Smart DNS on Ethernet and Wi-Fi adapters
# Run as Administrator

$primaryDns = "76.76.2.0"
$backupDns = "76.76.10.0"
$adapters = @("Ethernet", "Wi-Fi")

Write-Host "Setting DNS to ControlD Smart DNS..." -ForegroundColor Cyan
Write-Host "Primary: $primaryDns" -ForegroundColor Green
Write-Host "Backup:  $backupDns" -ForegroundColor Green
Write-Host ""

foreach ($adapter in $adapters) {
    try {
        Set-DnsClientServerAddress -InterfaceAlias $adapter -ServerAddresses ($primaryDns, $backupDns) -ErrorAction Stop
        Write-Host "✅ $adapter: DNS set to $primaryDns / $backupDns" -ForegroundColor Green
    } catch {
        Write-Host "❌ $adapter: Failed - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Verifying..." -ForegroundColor Cyan
Get-DnsClientServerAddress -AddressFamily IPv4 | Where-Object { $_.ServerAddresses -and $_.ServerAddresses.Count -gt 0 } | 
    Select-Object InterfaceAlias, ServerAddresses | Format-Table -AutoSize

Write-Host ""
Write-Host "To restore original DNS, run:" -ForegroundColor Yellow
Write-Host "  Set-DnsClientServerAddress -InterfaceAlias 'Ethernet' -ResetServerAddresses" -ForegroundColor Gray
Write-Host "  Set-DnsClientServerAddress -InterfaceAlias 'Wi-Fi' -ResetServerAddresses" -ForegroundColor Gray
