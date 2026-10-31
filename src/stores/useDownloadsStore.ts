import { create } from "zustand";
import { buildZip, saveBlob } from "@/lib/zip";

/* Exports the user has started, shown by the download indicator in the top
   bar. Client state shared between distant components (the Recordings page
   starts one, the header shows it), so it lives here rather than in a page.

   There is no footage behind the prototype, so progress is simulated at a
   rate set by the archive's size, and the file that lands is a zip holding a
   manifest of what the real archive would contain. */

export interface DownloadFile {
  name: string;
  size: string;
}

export interface DownloadJob {
  id: string;
  /** e.g. "REC-0005.zip" */
  fileName: string;
  files: DownloadFile[];
  totalMb: number;
  /** 0–100. */
  progress: number;
  status: "downloading" | "done";
}

interface DownloadsState {
  jobs: DownloadJob[];
  start: (job: Pick<DownloadJob, "fileName" | "files" | "totalMb">) => void;
  /** Drops finished downloads from the list. */
  clearDone: () => void;
}

const TICK_MS = 200;
/** Simulated throughput — fast enough to watch, slow enough to see. */
const MB_PER_SECOND = 400;

function manifest(job: DownloadJob): string {
  return [
    `Accel recordings export — ${job.fileName}`,
    `Exported ${new Date().toLocaleString()}`,
    "",
    ...job.files.map((f) => `${f.name}\t${f.size}`),
    "",
    "Prototype archive: the footage files listed above are not included.",
  ].join("\n");
}

let seq = 0;

export const useDownloadsStore = create<DownloadsState>((set, get) => ({
  jobs: [],
  start: ({ fileName, files, totalMb }) => {
    const id = `dl-${Date.now()}-${seq++}`;
    set((s) => ({ jobs: [...s.jobs, { id, fileName, files, totalMb, progress: 0, status: "downloading" }] }));

    // Between ~3s and ~12s, whatever the size.
    const seconds = Math.min(12, Math.max(3, totalMb / MB_PER_SECOND));
    const step = 100 / ((seconds * 1000) / TICK_MS);
    const timer = setInterval(() => {
      const job = get().jobs.find((j) => j.id === id);
      if (!job) return clearInterval(timer);
      const progress = Math.min(100, job.progress + step);
      const done = progress >= 100;
      set((s) => ({ jobs: s.jobs.map((j) => (j.id === id ? { ...j, progress, status: done ? "done" : "downloading" } : j)) }));
      if (done) {
        clearInterval(timer);
        saveBlob(buildZip([{ name: "MANIFEST.txt", text: manifest(job) }]), fileName);
      }
    }, TICK_MS);
  },
  clearDone: () => set((s) => ({ jobs: s.jobs.filter((j) => j.status !== "done") })),
}));
