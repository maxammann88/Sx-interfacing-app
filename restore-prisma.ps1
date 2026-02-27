# Script to restore real Prisma Client after successful setup
# Run this AFTER Docker is running and prisma generate succeeded

Write-Host "Restoring original Prisma Client..." -ForegroundColor Green

# Backup current mock client
Copy-Item "packages/backend/src/prismaClient.ts" "packages/backend/src/prismaClient.mock.ts" -Force
Write-Host "Mock client backed up to prismaClient.mock.ts" -ForegroundColor Yellow

# Restore original
Copy-Item "packages/backend/src/prismaClient.original.ts" "packages/backend/src/prismaClient.ts" -Force
Write-Host "Original Prisma Client restored!" -ForegroundColor Green

Write-Host "`nBackend will restart automatically with real database connection." -ForegroundColor Cyan
