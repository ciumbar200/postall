"use client"

import { ExternalLinkIcon, PlugZapIcon, UnplugIcon } from "lucide-react"
import { Platform } from "@/generated/prisma/enums"
import { useAccounts } from "@/hooks/use-dashboard-data"
import { mvpPlatforms, platformMeta } from "@/lib/ui/platforms"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PlatformPill } from "@/components/shared/platform-pill"
import { StatusBadge } from "@/components/shared/status-badge"

export function AccountsOverview() {
  const { data: accounts = [] } = useAccounts()

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {mvpPlatforms.map((platform) => {
          const meta = platformMeta[platform]
          const connected = accounts.some((account) => account.platform === platform)

          return (
            <Card key={platform}>
              <CardHeader>
                <CardTitle>{meta.name}</CardTitle>
                <CardDescription>
                  OAuth direct to the official {meta.name} API adapter.
                </CardDescription>
                <CardAction>
                  <StatusBadge status={connected ? "CONNECTED" : "DRAFT"} />
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className="size-10 rounded-lg"
                    style={{ backgroundColor: meta.color }}
                  />
                  <div className="text-sm text-muted-foreground">
                    {platform === Platform.INSTAGRAM
                      ? "Requires business content publish permissions."
                      : "Requires Content Posting API approval."}
                  </div>
                </div>
                <Button onClick={() => {
                  window.location.href = `/api/accounts/${meta.slug}/connect`
                }}>
                  <PlugZapIcon data-icon="inline-start" />
                  Connect
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Unified status for all linked social identities.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Platform</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Token expiry</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell>
                    <PlatformPill platform={account.platform} />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{account.displayName ?? account.username}</div>
                    <div className="text-xs text-muted-foreground">@{account.username}</div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={account.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.expiresAt
                      ? new Date(account.expiresAt).toLocaleDateString()
                      : "No expiry"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon-sm" title="Open provider">
                        <ExternalLinkIcon />
                      </Button>
                      <Button variant="ghost" size="icon-sm" title="Disconnect">
                        <UnplugIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
