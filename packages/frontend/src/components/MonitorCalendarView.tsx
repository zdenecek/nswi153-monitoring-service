interface MonitorCheck {
  id: string;
  status: "succeeded" | "failed";
  responseTime: number;
  timestamp: string;
  error?: string;
}

interface MonitorCalendarViewProps {
  checks: MonitorCheck[];
}

interface DayStatus {
  date: Date;
  status: "green" | "orange" | "red" | "gray";
  failureRate: number;
  totalChecks: number;
}

export function MonitorCalendarView({ checks }: MonitorCalendarViewProps) {
  // Get current date and calculate 3 months range
  const today = new Date();
  // const startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1);
  // const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  // Group checks by day
  const checksByDay = new Map<string, MonitorCheck[]>();
  checks.forEach((check) => {
    const checkDate = new Date(check.timestamp);
    const dateKey = checkDate.toISOString().split("T")[0];
    if (!checksByDay.has(dateKey)) {
      checksByDay.set(dateKey, []);
    }
    checksByDay.get(dateKey)!.push(check);
  });

  // Generate calendar data for 3 months
  const generateCalendarData = (): DayStatus[][] => {
    const months: DayStatus[][] = [];

    for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
      const monthStart = new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset,
        1,
      );
      const monthEnd = new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset + 1,
        0,
      );
      const month: DayStatus[] = [];

      // Add padding days from previous month
      const firstDayOfWeek = monthStart.getDay();
      for (let i = 0; i < firstDayOfWeek; i++) {
        const paddingDate = new Date(monthStart);
        paddingDate.setDate(paddingDate.getDate() - (firstDayOfWeek - i));
        month.push({
          date: paddingDate,
          status: "gray",
          failureRate: 0,
          totalChecks: 0,
        });
      }

      // Add actual days of the month
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const currentDate = new Date(
          monthStart.getFullYear(),
          monthStart.getMonth(),
          day,
        );
        const dateKey = currentDate.toISOString().split("T")[0];
        const dayChecks = checksByDay.get(dateKey) || [];

        let status: "green" | "orange" | "red" | "gray" = "gray";
        let failureRate = 0;

        if (dayChecks.length > 0) {
          const failures = dayChecks.filter(
            (check) => check.status === "failed",
          ).length;
          failureRate = (failures / dayChecks.length) * 100;

          if (failureRate === 0) {
            status = "green";
          } else if (failureRate <= 5) {
            status = "orange";
          } else {
            status = "red";
          }
        }

        month.push({
          date: currentDate,
          status,
          failureRate,
          totalChecks: dayChecks.length,
        });
      }

      // Add padding days from next month to complete the week
      const remainingDays = 42 - month.length; // 6 weeks * 7 days
      for (let i = 1; i <= remainingDays; i++) {
        const paddingDate = new Date(monthEnd);
        paddingDate.setDate(paddingDate.getDate() + i);
        month.push({
          date: paddingDate,
          status: "gray",
          failureRate: 0,
          totalChecks: 0,
        });
      }

      months.push(month);
    }

    return months;
  };

  const calendarData = generateCalendarData();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "green":
        return "bg-green-500";
      case "orange":
        return "bg-orange-500";
      case "red":
        return "bg-red-500";
      default:
        return "bg-gray-200";
    }
  };

  // const getCurrentMonthIndex = () => {
  //   return today.getMonth();
  // };

  return (
    <div className="mt-8">
      <div className="overflow-hidden rounded-lg bg-white shadow">
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              3-Month Status Calendar
            </h3>
            <div className="flex items-center space-x-6 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>No failures</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span>≤5% failures</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>&gt;5% failures</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-200 rounded"></div>
                <span>No data</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {calendarData.map((month, monthIndex) => {
              const monthDate = new Date(
                today.getFullYear(),
                today.getMonth() - 2 + monthIndex,
                1,
              );
              return (
                <div key={monthIndex} className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-center font-medium text-gray-900 mb-4">
                    {monthNames[monthDate.getMonth()]} {monthDate.getFullYear()}
                  </h4>

                  {/* Day headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {dayNames.map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-500 py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {month.map((day, dayIndex) => {
                      const isCurrentMonth =
                        day.date.getMonth() === monthDate.getMonth();
                      const isToday =
                        day.date.toISOString().split("T")[0] ===
                        today.toISOString().split("T")[0];

                      return (
                        <div
                          key={dayIndex}
                          className={`
                            relative w-8 h-8 rounded text-xs flex items-center justify-center
                            ${getStatusColor(isCurrentMonth ? day.status : "gray")}
                            ${isCurrentMonth ? "text-white" : "text-gray-400"}
                            ${isToday ? "ring-2 ring-blue-500" : ""}
                          `}
                          title={
                            isCurrentMonth && day.totalChecks > 0
                              ? `${day.date.getDate()}: ${day.totalChecks} checks, ${day.failureRate.toFixed(1)}% failures`
                              : `${day.date.getDate()}: No data`
                          }
                        >
                          {day.date.getDate()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
