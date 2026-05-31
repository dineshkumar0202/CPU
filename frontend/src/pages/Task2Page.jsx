import React from 'react';
import CpuMonitor from '../components/CpuMonitor';
import MessageScheduler from '../components/MessageScheduler';

const Task2Page = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Dashboard Page Header */}
      <header className="mb-8 border-b border-zinc-200 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-50/80 text-violet-600 border border-violet-500/20 mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-violet-500"></span>
            Technical Assessment
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
             Server Utilities
          </h1>
          <p className="text-zinc-600 text-sm mt-1">
            Real-time CPU tracking console and automated cron job message delivery system.
          </p>
        </div>
        <div className="text-xs text-zinc-500 font-mono bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 w-fit">
          Timezone: Asia/Kolkata
        </div>
      </header>

      {/* Main Single-Column Layout Grid */}
      <main className="flex flex-col gap-8">
        {/* Section 1: CPU Monitor */}
        <section>
          <div className="mb-2.5 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Resource Tracking</h2>
          </div>
          <CpuMonitor />
        </section>

        {/* Section 2: Message Scheduler */}
        <section>
          <div className="mb-2.5 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Scheduler Controls</h2>
          </div>
          <MessageScheduler />
        </section>
      </main>

      {/* Dashboard Footer */}
      <footer className="mt-16 text-center text-xs text-zinc-550 border-t border-zinc-200 pt-6">
        <p>MERN Stack Task 2 • Built for InsuredMine Assessment</p>
      </footer>
    </div>
  );
};

export default Task2Page;
