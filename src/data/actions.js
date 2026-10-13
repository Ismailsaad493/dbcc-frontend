export const ACTION_GROUPS = [
  {
    key: 'batting',
    title: 'Batting Actions',
    accent: 'gold',
    actions: [
      { id: 'runs50', label: '50 Runs', points: 10 },
      { id: 'runs100', label: '100 Runs', points: 20 },
      { id: 'duck', label: 'Duck (Out)', points: -15 },
    ],
  },
  {
    key: 'bowling',
    title: 'Bowling Actions',
    accent: 'purple',
    actions: [
      { id: 'wicket1', label: '1 Wicket', points: 10 },
      { id: 'maiden', label: 'Maiden', points: 5 },
      { id: 'wickets3', label: '3 Wicket Haul', points: 10 },
      { id: 'wickets5', label: '5 Wicket Haul', points: 20 },
      { id: 'extra', label: 'Extra (more than 5 in a match)', points: -3 },
    ],
  },
  {
    key: 'fielding',
    title: 'Fielding Actions',
    accent: 'pink',
    actions: [
      { id: 'catch', label: 'Catch', points: 10 },
      { id: 'runout', label: 'Runout', points: 10 },
      { id: 'dropCatch', label: 'Drop Catch', points: -10 },
    ],
  },
  {
    key: 'fielding',
    title: 'Attendance & Disciplinary Actions',
    accent: 'blue',
    actions: [
      { id: 'attendance', label: 'Match Attendance', points: 5 },
      { id: 'teamMeeting', label: 'Team Meeting', points: 5 },
      { id: 'onTime', label: 'On-time Arrival', points: 3 },
      { id: 'lateArrival', label: 'Late Arrival', points: -3 },
    ],
  },
]
