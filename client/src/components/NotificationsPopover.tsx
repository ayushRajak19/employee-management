import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { governanceApi, type NotificationItem } from "@/features/governance/governanceApi";

export const NotificationsPopover = () => {
  const [open, setOpen] = useState(false);
  const [incoming, setIncoming] = useState<NotificationItem | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const knownIds = useRef<Set<string> | null>(null);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: governanceApi.notifications,
    refetchInterval: 10_000,
    refetchIntervalInBackground: true,
  });

  const read = useMutation({
    mutationFn: governanceApi.read,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = query.data?.items.filter((item) => !item.readAt).length ?? 0;

  useEffect(() => {
    const items = query.data?.items;
    if (!items) return;
    if (!knownIds.current) {
      knownIds.current = new Set(items.map((item) => item._id));
      return;
    }
    const newAssignment = items.find((item) => !knownIds.current!.has(item._id) && !item.readAt && item.type === "TASK_ASSIGNED");
    items.forEach((item) => knownIds.current!.add(item._id));
    if (newAssignment) setIncoming(newAssignment);
  }, [query.data?.items]);

  useEffect(() => {
    if (!incoming) return;
    const timer = window.setTimeout(() => setIncoming(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [incoming]);

  const openNotification = (item: NotificationItem) => {
    if (!item.readAt) read.mutate(item._id);
    if (item.entityType === "Task" && item.entityId) navigate(`/work?task=${encodeURIComponent(item.entityId)}`);
    setIncoming(null);
    setOpen(false);
  };

  // Close when clicking outside the popover
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      {incoming && <div role="status" className="fixed right-4 top-20 z-[70] w-[min(380px,calc(100vw-2rem))] rounded-2xl border border-brand-200 bg-white p-4 shadow-2xl"><div className="flex items-start gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700"><Bell size={16}/></div><button type="button" className="min-w-0 flex-1 text-left" onClick={() => openNotification(incoming)}><p className="text-sm font-semibold">{incoming.title}</p><p className="mt-1 text-xs leading-5 text-slate-500">{incoming.body}</p><p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-brand-700">Open assigned task</p></button><button type="button" className="text-slate-400 hover:text-slate-700" onClick={() => setIncoming(null)} aria-label="Dismiss notification"><X size={16}/></button></div></div>}
      <Button
        variant="ghost"
        className="relative size-10 px-0"
        aria-label={`${unread} unread notifications`}
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1.5 top-1.5 grid min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] text-white">
            {unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border bg-white shadow-2xl">
          <div className="border-b p-4">
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-slate-400">{unread} unread</p>
          </div>
          <div className="max-h-96 divide-y overflow-y-auto">
            {query.data?.items.length ? (
              query.data.items.map((item) => (
                <button
                  key={item._id}
                  className={`flex w-full gap-3 p-4 text-left hover:bg-slate-50 ${!item.readAt ? "bg-brand-50/40" : ""}`}
                  onClick={() => openNotification(item)}
                >
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-slate-100">
                    {item.readAt ? <Check size={12} /> : <Bell size={12} />}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.body}</p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </button>
              ))
            ) : (
              <p className="p-8 text-center text-sm text-slate-400">No notifications yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
