import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { governanceApi } from "@/features/governance/governanceApi";

export const NotificationsPopover = () => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["notifications"],
    queryFn: governanceApi.notifications,
  });

  const read = useMutation({
    mutationFn: governanceApi.read,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = query.data?.items.filter((item) => !item.readAt).length ?? 0;

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
                  onClick={() => {
                    if (!item.readAt) read.mutate(item._id);
                  }}
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
