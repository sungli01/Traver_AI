import React from 'react';
import { Clock, MapPin } from 'lucide-react';

export default function ItineraryTimeline({ plan }) {
  if (!plan) return null;

  return (
    <div className="space-y-8">
      {plan.itinerary.map((day) => (
        <div key={day.day} className="relative pl-6 border-l-2 border-blue-100 pb-4">
          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-500 border-2 border-white" />
          <h3 className="font-bold text-lg mb-4 text-gray-800">Day {day.day}</h3>
          <div className="grid gap-3">
            {day.activities.map((activity, idx) => (
              <div key={idx} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                    <Clock size={14} />
                    {activity.time}
                  </div>
                  {activity.cost && (
                    <span className="text-xs font-semibold bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      ₩{activity.cost.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-gray-900 font-medium">{activity.description}</p>
                {activity.location && (
                  <div className="flex items-center gap-1 mt-2 text-gray-400 text-xs">
                    <MapPin size={12} />
                    {activity.location}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
