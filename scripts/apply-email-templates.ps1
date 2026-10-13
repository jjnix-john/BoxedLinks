# BoxedLinks — Deploy Custom Email Templates to Supabase
# Usage: powershell -File scripts/apply-email-templates.ps1 -ApiKey "re_..." -Token "sbp_..."

param(
  [Parameter(Mandatory=$false)]
  [string]$ApiKey,

  [Parameter(Mandatory=$false)]
  [string]$SenderEmail = "onboarding@resend.dev",

  [Parameter(Mandatory=$false)]
  [string]$Token = $env:SUPABASE_ACCESS_TOKEN,

  [Parameter(Mandatory=$false)]
  [string]$ProjectRef = "valbtrbmykmsxluyyebl"
)

if (-not $Token) {
  Write-Host "Please pass your Supabase access token via -Token or SUPABASE_ACCESS_TOKEN env var." -ForegroundColor Yellow
  $Token = Read-Host "Enter Supabase Personal Access Token (sbp_...)"
}

$recoveryPath = Join-Path $PSScriptRoot "..\supabase\templates\recovery.html"
$confirmPath  = Join-Path $PSScriptRoot "..\supabase\templates\confirmation.html"

if (-not (Test-Path $recoveryPath) -or -not (Test-Path $confirmPath)) {
  Write-Error "Template files not found in supabase/templates/"
  exit 1
}

$recoveryHtml = Get-Content $recoveryPath -Raw
$confirmHtml  = Get-Content $confirmPath -Raw

$headers = @{
  "Authorization" = "Bearer $Token"
  "Content-Type"  = "application/json"
}

$bodyObj = @{
  mailer_subjects_recovery              = "Reset Your BoxedLinks Password"
  mailer_templates_recovery_content     = $recoveryHtml
  mailer_subjects_confirmation          = "Welcome to BoxedLinks — Confirm Your Account"
  mailer_templates_confirmation_content = $confirmHtml
}

# If custom SMTP credentials provided, enable them to unlock template customization
if ($ApiKey) {
  $bodyObj["smtp_admin_email"] = $SenderEmail
  $bodyObj["smtp_host"]        = "smtp.resend.com"
  $bodyObj["smtp_port"]        = "465"
  $bodyObj["smtp_user"]        = "resend"
  $bodyObj["smtp_pass"]        = $ApiKey
  $bodyObj["smtp_sender_name"] = "BoxedLinks"
  $bodyObj["rate_limit_email_sent"] = 1000
}

$body = $bodyObj | ConvertTo-Json

try {
  $res = Invoke-RestMethod -Uri "https://api.supabase.com/v1/projects/$ProjectRef/config/auth" -Method Patch -Headers $headers -Body $body
  Write-Host "✓ Successfully deployed custom Purple-to-White email templates to Supabase!" -ForegroundColor Green
} catch {
  Write-Host "Failed to apply templates:" -ForegroundColor Red
  Write-Host $_.Exception.Message
  if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
}
