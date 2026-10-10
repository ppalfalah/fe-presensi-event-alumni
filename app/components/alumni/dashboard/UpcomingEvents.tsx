"use client";

import { Calendar, MapPin } from "lucide-react";

export default function UpcomingEvents() {
  // TODO: Replace with actual data from API
  const events = [
    {
      id: 1,
      title: "Workshop React Advanced",
      date: "28 Mei 2026",
      location: "Lab Komputer 1",
    },
    {
      id: 2,
      title: "Gathering Alumni 2026",
      date: "5 Jun 2026",
      location: "Gedung Serbaguna",
    },
  ];

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-800 mb-3">Event Mendatang</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <div key={event.id} className="bg-white rounded-xl p-4 border border-slate-200">
            <h4 className="font-semibold text-slate-800 text-sm mb-2">{event.title}</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Calendar size={12} />
                <span>{event.date}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <MapPin size={12} />
                <span>{event.location}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
