"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TaskCenter } from "@/components/jobs";
import { M3Dialog } from "@/components/m3/host";
import { useOnlineStatus } from "@/components/pwa";
import { TaskStatusIndicator } from "@/components/sync-status";
import type { RuntimeJob } from "@/lib/jobs";
import { getLibraryJobScheduler } from "@/lib/runtime/library-runtime";
import { registerLibraryJobHandlers } from "@/components/library/library-job-handlers";

const TASK_CENTER_ID = "library-task-center";

export function LibraryJobCenter() {
  const online = useOnlineStatus();
  const onlineRef = useRef(online);
  const readyRef = useRef(false);
  const [jobs, setJobs] = useState<RuntimeJob[]>([]);
  const [open, setOpen] = useState(false);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const refresh = useCallback(() => setJobs(getLibraryJobScheduler().list()), []);

  useEffect(() => {
    onlineRef.current = online;
    if (!readyRef.current) return;
    void getLibraryJobScheduler().setOnline(online).then(refresh);
  }, [online, refresh]);

  useEffect(() => {
    let active = true;
    const scheduler = getLibraryJobScheduler();
    registerLibraryJobHandlers(scheduler);
    const initialize = async () => {
      await scheduler.hydrate();
      await scheduler.setOnline(onlineRef.current);
      await scheduler.start();
      readyRef.current = true;
      if (active) refresh();
    };
    void initialize();
    const poll = window.setInterval(refresh, 1_000);
    const shutdown = () => void scheduler.shutdown();
    window.addEventListener("pagehide", shutdown);
    return () => {
      active = false;
      window.clearInterval(poll);
      window.removeEventListener("pagehide", shutdown);
    };
  }, [refresh]);

  const runAction = async (id: string, action: "cancel" | "retry") => {
    setPendingIds((current) => [...new Set([...current, id])]);
    try {
      const scheduler = getLibraryJobScheduler();
      if (action === "cancel") await scheduler.cancel(id);
      else await scheduler.retry(id);
      refresh();
    } finally {
      setPendingIds((current) => current.filter((item) => item !== id));
    }
  };

  return (
    <>
      <TaskStatusIndicator
        jobs={jobs}
        isOnline={online}
        controlsId={TASK_CENTER_ID}
        expanded={open}
        hideWhenEmpty
        onOpen={() => setOpen(true)}
      />
      <M3Dialog
        open={open}
        onClose={() => setOpen(false)}
        headline="Aufgaben"
        presentation="fullscreen"
      >
        <div id={TASK_CENTER_ID}>
          <TaskCenter
            jobs={jobs}
            isOnline={online}
            pendingActionJobIds={pendingIds}
            onCancel={(id) => runAction(id, "cancel")}
            onRetry={(id) => runAction(id, "retry")}
            onClose={() => setOpen(false)}
          />
        </div>
      </M3Dialog>
    </>
  );
}
