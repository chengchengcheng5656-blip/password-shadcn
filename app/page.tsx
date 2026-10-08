"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Moon, RefreshCw, ShieldCheck, Sun } from "lucide-react";

import { Toaster, toast } from "@/components/ui/sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  createPassword,
  getEntropyBits,
  getStrength,
  type PasswordOptions,
} from "@/lib/password";

const MIN_LENGTH = 8;
const MAX_LENGTH = 64;

export default function Home() {
  const [length, setLength] = useState(16);
  const [lower, setLower] = useState(true);
  const [upper, setUpper] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [avoidAmbiguous, setAvoidAmbiguous] = useState(true);
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(false);

  const options: PasswordOptions = useMemo(
    () => ({ length, lower, upper, numbers, symbols, avoidAmbiguous }),
    [length, lower, upper, numbers, symbols, avoidAmbiguous]
  );

  const bits = getEntropyBits(options);
  const strength = getStrength(bits);
  const canGenerate = bits > 0;

  const refresh = useCallback(() => {
    setCopied(false);
    setPassword(createPassword(options));
  }, [options]);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const nextDark = stored ? stored === "dark" : prefersDark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function toggleTheme() {
    const nextDark = !dark;
    setDark(nextDark);
    document.documentElement.classList.toggle("dark", nextDark);
    window.localStorage.setItem("theme", nextDark ? "dark" : "light");
  }

  async function copyPassword() {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
    } catch {
      const area = document.createElement("textarea");
      area.value = password;
      area.setAttribute("readonly", "");
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      if (!ok) return;
    }
    setCopied(true);
    toast.success("复制成功", {
      description: "密码已复制到剪贴板",
    });
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Toaster position="top-center" richColors closeButton />
      <main className="mx-auto flex min-h-screen w-full max-w-xl flex-col justify-center px-4 py-10">
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  <CardTitle>密码生成器</CardTitle>
                </div>
                <CardDescription>
                  用 crypto.getRandomValues 在本地生成。密码不会离开这台浏览器。
                </CardDescription>
              </div>
              <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="切换主题">
                {dark ? <Sun /> : <Moon />}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
              <div className="flex items-start gap-2">
                <p className="min-h-12 flex-1 break-all font-mono text-lg leading-relaxed tracking-wide">
                  {canGenerate && password ? password : "请至少打开一种字符"}
                </p>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={copyPassword}
                      disabled={!canGenerate || !password}
                      aria-label="复制密码"
                    >
                      {copied ? <Check /> : <Copy />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copied ? "已复制" : "复制"}</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={refresh}
                      disabled={!canGenerate}
                      aria-label="重新生成"
                    >
                      <RefreshCw />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>重新生成</TooltipContent>
                </Tooltip>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>强度</span>
                  <span>
                    {strength.label}
                    {bits > 0 ? ` · ${bits} bits` : ""}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all ${strength.tone}`}
                    style={{ width: `${strength.width}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="length">长度</Label>
                <Badge variant="secondary">{length}</Badge>
              </div>
              <Slider
                id="length"
                min={MIN_LENGTH}
                max={MAX_LENGTH}
                step={1}
                value={[length]}
                onValueChange={([value]) => setLength(value)}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{MIN_LENGTH}</span>
                <span>{MAX_LENGTH}</span>
              </div>
            </div>

            <Separator />

            <div className="grid gap-3">
              <OptionRow
                id="lower"
                title="小写字母"
                hint="a-z"
                checked={lower}
                onCheckedChange={setLower}
              />
              <OptionRow
                id="upper"
                title="大写字母"
                hint="A-Z"
                checked={upper}
                onCheckedChange={setUpper}
              />
              <OptionRow
                id="numbers"
                title="数字"
                hint="0-9"
                checked={numbers}
                onCheckedChange={setNumbers}
              />
              <OptionRow
                id="symbols"
                title="符号"
                hint="!@#$…"
                checked={symbols}
                onCheckedChange={setSymbols}
              />
              <OptionRow
                id="ambiguous"
                title="排除易混淆字符"
                hint="0 O o 1 l I |"
                checked={avoidAmbiguous}
                onCheckedChange={setAvoidAmbiguous}
              />
            </div>

            {!canGenerate ? (
              <p className="text-sm text-destructive">至少打开一种字符集。</p>
            ) : null}

            <Button className="w-full" onClick={refresh} disabled={!canGenerate}>
              <RefreshCw />
              生成新密码
            </Button>
          </CardContent>
        </Card>
      </main>
    </TooltipProvider>
  );
}

function OptionRow({
  id,
  title,
  hint,
  checked,
  onCheckedChange,
}: {
  id: string;
  title: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border px-3 py-3">
      <div className="space-y-1">
        <Label htmlFor={id}>{title}</Label>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
