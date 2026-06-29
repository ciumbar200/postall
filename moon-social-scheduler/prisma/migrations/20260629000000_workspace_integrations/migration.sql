-- Workspace-level platform OAuth app credentials and AI settings

CREATE TABLE "PlatformAppCredential" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "credentialsJson" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformAppCredential_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceAiSettings" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "apiKey" TEXT,
    "extrasJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceAiSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PlatformAppCredential_workspaceId_platform_key" ON "PlatformAppCredential"("workspaceId", "platform");
CREATE INDEX "PlatformAppCredential_workspaceId_platform_idx" ON "PlatformAppCredential"("workspaceId", "platform");

CREATE UNIQUE INDEX "WorkspaceAiSettings_workspaceId_key" ON "WorkspaceAiSettings"("workspaceId");

ALTER TABLE "PlatformAppCredential" ADD CONSTRAINT "PlatformAppCredential_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceAiSettings" ADD CONSTRAINT "WorkspaceAiSettings_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
