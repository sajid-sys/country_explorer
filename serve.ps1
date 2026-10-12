Get-NetTCPConnection -LocalPort 8123 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
Start-Process -FilePath python -ArgumentList "-m","http.server","8123","--bind","127.0.0.1","-d","c:\Users\hp\OneDrive\Desktop\prc\Country Explorer" -WindowStyle Hidden
Start-Sleep -Seconds 1
(Invoke-WebRequest -Uri "http://127.0.0.1:8123/" -UseBasicParsing).StatusCode
