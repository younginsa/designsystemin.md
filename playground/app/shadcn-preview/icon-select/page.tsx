"use client";

// icon-select 스톡 렌더 캡처용 — 닫힌 트리거 + 열린 패널을 나란히
import * as React from "react";
import { Clock, Ship } from "lucide-react";
import { IconSelect } from "@ds/ui/ui/icon-select";

const TZ = [
  { value: "KST", label: "KST", hint: "+9" },
  { value: "UTC", label: "UTC", hint: "+0" },
  { value: "SGT", label: "SGT", hint: "+8" },
  { value: "EST", label: "EST", hint: "-5" },
];

const SHIPS = [
  { value: "s1", label: "HYUNDAI GLOBE 001" },
  { value: "s2", label: "MAERSK SEOUL 002" },
  { value: "s3", label: "EVER GIVEN 003" },
];

export default function Page() {
  return (
    <div className="flex h-screen items-start justify-center gap-24 bg-white pt-16">
      <style>{`nextjs-portal { display: none; }`}</style>
      <div className="flex flex-col items-center gap-6">
        <IconSelect icon={Clock} value="KST" sub="2026-08-18 13:00" items={TZ} heading="Timezone" />
        <IconSelect icon={Ship} value="s1" items={SHIPS} />
      </div>
      <div className="pt-2">
        <IconSelect icon={Clock} value="KST" sub="2026-08-18 13:00" items={TZ} heading="Timezone" defaultOpen align="start" />
      </div>
    </div>
  );
}
